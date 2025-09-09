const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['hq_official', 'regional_officer', 'legal_auditor', 'judiciary_observer'],
    required: true
  },
  jurisdiction: {
    type: String,
    required: function() {
      return this.role === 'regional_officer';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    type: String,
    enum: ['candidate_approval', 'position_assignment', 'ballot_approval', 'audit_view', 'read_only']
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user permissions based on role
userSchema.methods.getPermissions = function() {
  const rolePermissions = {
    hq_official: ['candidate_approval', 'position_assignment', 'ballot_approval', 'audit_view'],
    regional_officer: ['candidate_approval', 'position_assignment', 'audit_view'],
    legal_auditor: ['ballot_approval', 'audit_view'],
    judiciary_observer: ['read_only', 'audit_view']
  };
  
  return rolePermissions[this.role] || [];
};

module.exports = mongoose.model('User', userSchema);