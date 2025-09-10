const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Check if user has required permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive.' });
      }
      
      const permissions = user.getPermissions();
      
      if (!permissions.includes(permission) && !permissions.includes('read_only')) {
        return res.status(403).json({ 
          error: 'Insufficient permissions.',
          required: permission,
          userPermissions: permissions
        });
      }
      
      req.userPermissions = permissions;
      req.userDetails = user;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error checking permissions.' });
    }
  };
};

// Check if user has any of the required roles
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User not found or inactive.' });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient role privileges.',
          required: roles,
          userRole: user.role
        });
      }
      
      req.userDetails = user;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Error checking role.' });
    }
  };
};

// Check if user can access jurisdiction-specific data
const requireJurisdictionAccess = (req, res, next) => {
  const user = req.userDetails;
  const requestedJurisdiction = req.params.jurisdiction || req.body.jurisdiction;
  
  // HQ officials and judiciary observers can access all jurisdictions
  if (['hq_official', 'judiciary_observer'].includes(user.role)) {
    return next();
  }
  
  // Regional officers can only access their assigned jurisdiction
  if (user.role === 'regional_officer' && user.jurisdiction !== requestedJurisdiction) {
    return res.status(403).json({ 
      error: 'Access denied. You can only access data for your assigned jurisdiction.',
      userJurisdiction: user.jurisdiction,
      requestedJurisdiction
    });
  }
  
  next();
};

// Audit logging middleware
const auditLog = (action, entityType, getEntityId) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      if (res.statusCode < 400) { // Only log successful operations
        const AuditLog = require('../models/AuditLog');
        const crypto = require('crypto');
        
        const entityId = getEntityId ? getEntityId(req, res) : req.params.id;
        
        const auditEntry = new AuditLog({
          action,
          entityType,
          entityId: entityId || new require('mongoose').Types.ObjectId(),
          performedBy: req.user.userId,
          userRole: req.userDetails?.role || 'unknown',
          userJurisdiction: req.userDetails?.jurisdiction,
          description: `${action} ${entityType}`,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query
          },
          requestInfo: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            requestId: crypto.randomUUID()
          },
          category: getCategoryFromAction(action),
          severity: getSeverityFromAction(action)
        });
        
        auditEntry.save().catch(err => {
          console.error('Audit logging error:', err);
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Helper functions
const getCategoryFromAction = (action) => {
  if (action.includes('login') || action.includes('logout')) return 'authentication';
  if (action.includes('approve') || action.includes('reject')) return 'authorization';
  if (action.includes('create') || action.includes('update') || action.includes('delete')) return 'data_modification';
  if (action.includes('upload') || action.includes('file')) return 'file_operation';
  return 'system_change';
};

const getSeverityFromAction = (action) => {
  if (action.includes('approve') || action.includes('reject') || action.includes('lock')) return 'high';
  if (action.includes('create') || action.includes('update')) return 'medium';
  if (action.includes('view') || action.includes('list')) return 'low';
  return 'medium';
};

module.exports = {
  generateToken,
  verifyToken,
  requirePermission,
  requireRole,
  requireJurisdictionAccess,
  auditLog
};