const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, verifyToken } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Register new user (HQ only)
router.post('/register', [
  verifyToken,
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['hq_official', 'regional_officer', 'legal_auditor', 'judiciary_observer']),
  body('jurisdiction').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has permission to create users
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'hq_official') {
      return res.status(403).json({ error: 'Only HQ officials can create users' });
    }

    const { username, email, password, role, jurisdiction } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Validate jurisdiction for regional officers
    if (role === 'regional_officer' && !jurisdiction) {
      return res.status(400).json({ error: 'Jurisdiction required for regional officers' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role,
      jurisdiction: role === 'regional_officer' ? jurisdiction : undefined
    });

    await user.save();

    // Log the action
    const auditEntry = new AuditLog({
      action: 'user_created',
      entityType: 'user',
      entityId: user._id,
      performedBy: req.user.userId,
      userRole: currentUser.role,
      description: `User ${username} created with role ${role}`,
      details: { role, jurisdiction },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'authorization',
      severity: 'high'
    });
    await auditEntry.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        jurisdiction: user.jurisdiction
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Log the login
    const auditEntry = new AuditLog({
      action: 'user_login',
      entityType: 'user',
      entityId: user._id,
      performedBy: user._id,
      userRole: user.role,
      userJurisdiction: user.jurisdiction,
      description: `User ${user.username} logged in`,
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'authentication',
      severity: 'low'
    });
    await auditEntry.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        jurisdiction: user.jurisdiction,
        permissions: user.getPermissions(),
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Log the logout
    const auditEntry = new AuditLog({
      action: 'user_logout',
      entityType: 'user',
      entityId: user._id,
      performedBy: user._id,
      userRole: user.role,
      userJurisdiction: user.jurisdiction,
      description: `User ${user.username} logged out`,
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'authentication',
      severity: 'low'
    });
    await auditEntry.save();

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        jurisdiction: user.jurisdiction,
        permissions: user.getPermissions(),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', [
  verifyToken,
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, phoneNumber } = req.body;
    const updates = {};

    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.email = email;
    }

    if (phoneNumber) {
      updates.phoneNumber = phoneNumber;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    Object.assign(user, updates);
    await user.save();

    // Log the update
    const auditEntry = new AuditLog({
      action: 'user_updated',
      entityType: 'user',
      entityId: user._id,
      performedBy: user._id,
      userRole: user.role,
      userJurisdiction: user.jurisdiction,
      description: `User ${user.username} updated profile`,
      details: { updates },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'data_modification',
      severity: 'medium'
    });
    await auditEntry.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        jurisdiction: user.jurisdiction
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Change password
router.put('/change-password', [
  verifyToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log the password change
    const auditEntry = new AuditLog({
      action: 'user_updated',
      entityType: 'user',
      entityId: user._id,
      performedBy: user._id,
      userRole: user.role,
      userJurisdiction: user.jurisdiction,
      description: `User ${user.username} changed password`,
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'authentication',
      severity: 'high'
    });
    await auditEntry.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// Get all users (HQ only)
router.get('/users', verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'hq_official') {
      return res.status(403).json({ error: 'Only HQ officials can view all users' });
    }

    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        jurisdiction: user.jurisdiction,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

module.exports = router;