const mongoose = require('mongoose');

const ballotSchema = new mongoose.Schema({
  // Ballot Identification
  position: {
    type: String,
    required: true,
    enum: ['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca']
  },
  jurisdiction: {
    level: {
      type: String,
      required: true,
      enum: ['national', 'county', 'constituency', 'ward']
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Ballot Configuration
  configuration: {
    title: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    },
    showPartySymbols: {
      type: Boolean,
      default: true
    },
    showPartyColors: {
      type: Boolean,
      default: true
    },
    showDeputies: {
      type: Boolean,
      default: false
    },
    randomizeOrder: {
      type: Boolean,
      default: false
    },
    maxSelections: {
      type: Number,
      default: 1
    }
  },
  
  // Candidates on Ballot
  candidates: [{
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true
    },
    displayOrder: {
      type: Number,
      required: true
    },
    party: {
      name: String,
      symbol: String,
      color: String
    },
    deputy: {
      name: String,
      nationalId: String
    }
  }],
  
  // Approval Workflow
  workflow: {
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'legal_audit', 'approved', 'locked'],
      default: 'draft'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    legalAuditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    legalAuditedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    lockedAt: Date
  },
  
  // Validation Results
  validation: {
    candidateCount: {
      type: Number,
      default: 0
    },
    hasUniqueNames: {
      type: Boolean,
      default: true
    },
    hasValidParties: {
      type: Boolean,
      default: true
    },
    hasValidColors: {
      type: Boolean,
      default: true
    },
    hasRequiredDeputies: {
      type: Boolean,
      default: true
    },
    errors: [{
      type: String,
      description: String,
      severity: {
        type: String,
        enum: ['error', 'warning', 'info']
      }
    }]
  },
  
  // Preview and Export
  preview: {
    generatedAt: Date,
    imagePath: String,
    pdfPath: String,
    htmlPath: String
  },
  
  // Security and Audit
  isLocked: {
    type: Boolean,
    default: false
  },
  lockReason: {
    type: String,
    trim: true
  },
  chainOfCustody: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  
  // Metadata
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ballotSchema.index({ position: 1, 'jurisdiction.code': 1 });
ballotSchema.index({ 'workflow.status': 1 });
ballotSchema.index({ isLocked: 1 });
ballotSchema.index({ 'workflow.approvedAt': 1 });

// Pre-save middleware to update validation
ballotSchema.pre('save', function(next) {
  // Update candidate count
  this.validation.candidateCount = this.candidates.length;
  
  // Check for unique names
  const names = this.candidates.map(c => c.candidate.toString());
  this.validation.hasUniqueNames = names.length === new Set(names).size;
  
  // Check for valid parties (simplified)
  this.validation.hasValidParties = this.candidates.every(c => c.party && c.party.name && c.party.color);
  
  // Check for valid colors (simplified)
  this.validation.hasValidColors = this.candidates.every(c => 
    c.party && c.party.color && /^#[0-9A-Fa-f]{6}$/.test(c.party.color)
  );
  
  // Check for required deputies
  if (this.position === 'president' || this.position === 'governor') {
    this.validation.hasRequiredDeputies = this.candidates.every(c => c.deputy && c.deputy.name);
  }
  
  next();
});

// Method to add to chain of custody
ballotSchema.methods.addToChainOfCustody = function(action, performedBy, details = '') {
  this.chainOfCustody.push({
    action,
    performedBy,
    performedAt: new Date(),
    details
  });
};

// Method to check if ballot can be edited
ballotSchema.methods.canBeEdited = function() {
  return !this.isLocked && this.workflow.status !== 'locked';
};

// Method to validate ballot
ballotSchema.methods.validateBallot = function() {
  const errors = [];
  
  // Check minimum candidates
  if (this.candidates.length < 2) {
    errors.push({
      type: 'error',
      description: 'At least 2 candidates required for a valid ballot'
    });
  }
  
  // Check for duplicate names
  if (!this.validation.hasUniqueNames) {
    errors.push({
      type: 'error',
      description: 'Duplicate candidate names found'
    });
  }
  
  // Check party information
  if (!this.validation.hasValidParties) {
    errors.push({
      type: 'error',
      description: 'Invalid party information found'
    });
  }
  
  // Check color format
  if (!this.validation.hasValidColors) {
    errors.push({
      type: 'error',
      description: 'Invalid party color format found'
    });
  }
  
  // Check deputy requirements
  if ((this.position === 'president' || this.position === 'governor') && !this.validation.hasRequiredDeputies) {
    errors.push({
      type: 'error',
      description: 'Deputy information required for President/Governor candidates'
    });
  }
  
  this.validation.errors = errors;
  return errors.length === 0;
};

// Method to generate preview
ballotSchema.methods.generatePreview = function() {
  // This would integrate with a preview generation service
  this.preview = {
    generatedAt: new Date(),
    imagePath: `/previews/ballot_${this._id}.png`,
    pdfPath: `/previews/ballot_${this._id}.pdf`,
    htmlPath: `/previews/ballot_${this._id}.html`
  };
};

module.exports = mongoose.model('Ballot', ballotSchema);