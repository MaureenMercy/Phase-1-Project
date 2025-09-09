const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      'candidate_created', 'candidate_updated', 'candidate_approved', 'candidate_rejected',
      'position_assigned', 'position_updated',
      'ballot_created', 'ballot_updated', 'ballot_submitted', 'ballot_reviewed', 
      'ballot_legal_audited', 'ballot_approved', 'ballot_locked',
      'user_login', 'user_logout', 'user_created', 'user_updated',
      'file_uploaded', 'file_deleted',
      'system_config_changed'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['candidate', 'position', 'ballot', 'user', 'file', 'system']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // User Information
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  userJurisdiction: {
    type: String
  },
  
  // Action Details
  description: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Changes Made
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed
    },
    after: {
      type: mongoose.Schema.Types.Mixed
    },
    fieldsChanged: [String]
  },
  
  // Request Information
  requestInfo: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String
    },
    sessionId: {
      type: String
    },
    requestId: {
      type: String
    }
  },
  
  // Security and Integrity
  hash: {
    type: String,
    required: true
  },
  previousHash: {
    type: String
  },
  isTampered: {
    type: Boolean,
    default: false
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Additional Metadata
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'data_modification', 'file_operation', 'system_change'],
    required: true
  },
  
  // Related Entities
  relatedEntities: [{
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    relationship: String
  }]
}, {
  timestamps: false // We use custom timestamp field
});

// Indexes for performance and queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ hash: 1 }, { unique: true });

// Pre-save middleware to generate hash
auditLogSchema.pre('save', async function(next) {
  try {
    // Generate hash for this log entry
    const crypto = require('crypto');
    const dataToHash = JSON.stringify({
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      performedBy: this.performedBy,
      description: this.description,
      timestamp: this.timestamp,
      changes: this.changes
    });
    
    this.hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
    
    // Get previous hash for chain integrity
    if (this.isNew) {
      const lastLog = await this.constructor.findOne({}, {}, { sort: { timestamp: -1 } });
      this.previousHash = lastLog ? lastLog.hash : null;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify integrity
auditLogSchema.methods.verifyIntegrity = function() {
  const crypto = require('crypto');
  const dataToHash = JSON.stringify({
    action: this.action,
    entityType: this.entityType,
    entityId: this.entityId,
    performedBy: this.performedBy,
    description: this.description,
    timestamp: this.timestamp,
    changes: this.changes
  });
  
  const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  return calculatedHash === this.hash;
};

// Static method to get audit trail for an entity
auditLogSchema.statics.getAuditTrail = function(entityType, entityId, options = {}) {
  const query = { entityType, entityId };
  
  if (options.startDate) {
    query.timestamp = { ...query.timestamp, $gte: options.startDate };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: options.endDate };
  }
  
  if (options.actions && options.actions.length > 0) {
    query.action = { $in: options.actions };
  }
  
  if (options.severity) {
    query.severity = options.severity;
  }
  
  return this.find(query)
    .populate('performedBy', 'username email role')
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

// Static method to get system audit summary
auditLogSchema.statics.getAuditSummary = function(startDate, endDate) {
  const matchStage = {
    timestamp: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          category: '$category',
          severity: '$severity'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        actions: {
          $push: {
            action: '$_id.action',
            severity: '$_id.severity',
            count: '$count',
            lastOccurrence: '$lastOccurrence'
          }
        },
        totalActions: { $sum: '$count' }
      }
    },
    { $sort: { totalActions: -1 } }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);