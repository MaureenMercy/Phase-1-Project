const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  // Position Details
  name: {
    type: String,
    required: true,
    enum: ['President', 'Governor', 'Senator', 'Member of Parliament', 'Woman Representative', 'Member of County Assembly'],
    unique: true
  },
  code: {
    type: String,
    required: true,
    enum: ['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca'],
    unique: true
  },
  level: {
    type: String,
    required: true,
    enum: ['national', 'county', 'constituency', 'ward']
  },
  
  // Eligibility Requirements
  requirements: {
    minAge: {
      type: Number,
      required: true,
      default: 18
    },
    maxAge: {
      type: Number
    },
    educationLevel: {
      type: String,
      enum: ['none', 'primary', 'secondary', 'diploma', 'degree', 'masters', 'phd'],
      default: 'none'
    },
    citizenship: {
      type: String,
      enum: ['kenyan', 'dual_citizen', 'naturalized'],
      default: 'kenyan'
    },
    residencyYears: {
      type: Number,
      default: 0
    }
  },
  
  // Jurisdiction Rules
  jurisdictionRules: {
    allowMultipleCandidates: {
      type: Boolean,
      default: true
    },
    maxCandidates: {
      type: Number,
      default: null
    },
    requiresDeputy: {
      type: Boolean,
      default: false
    },
    deputyRequirements: {
      minAge: Number,
      educationLevel: String,
      citizenship: String
    }
  },
  
  // Ballot Configuration
  ballotConfig: {
    displayOrder: {
      type: Number,
      required: true
    },
    showPartySymbol: {
      type: Boolean,
      default: true
    },
    showPartyColor: {
      type: Boolean,
      default: true
    },
    showDeputy: {
      type: Boolean,
      default: false
    },
    randomizeOrder: {
      type: Boolean,
      default: false
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
positionSchema.index({ code: 1 });
positionSchema.index({ level: 1 });
positionSchema.index({ isActive: 1 });

// Method to check if candidate is eligible for this position
positionSchema.methods.isEligible = function(candidate) {
  // Check age requirements
  if (candidate.age < this.requirements.minAge) {
    return { eligible: false, reason: `Minimum age requirement not met. Required: ${this.requirements.minAge}, Candidate: ${candidate.age}` };
  }
  
  if (this.requirements.maxAge && candidate.age > this.requirements.maxAge) {
    return { eligible: false, reason: `Maximum age requirement exceeded. Maximum: ${this.requirements.maxAge}, Candidate: ${candidate.age}` };
  }
  
  // Check education level (simplified - would need actual education data)
  // This would require integration with education verification system
  
  // Check citizenship
  if (this.requirements.citizenship === 'kenyan' && candidate.citizenship !== 'kenyan') {
    return { eligible: false, reason: 'Kenyan citizenship required' };
  }
  
  // Check residency (simplified)
  // This would require integration with residency verification system
  
  return { eligible: true };
};

// Method to validate deputy requirements
positionSchema.methods.validateDeputy = function(deputy) {
  if (!this.jurisdictionRules.requiresDeputy) {
    return { valid: true };
  }
  
  if (!deputy) {
    return { valid: false, reason: 'Deputy is required for this position' };
  }
  
  // Check deputy age
  if (this.jurisdictionRules.deputyRequirements.minAge && deputy.age < this.jurisdictionRules.deputyRequirements.minAge) {
    return { valid: false, reason: `Deputy minimum age requirement not met. Required: ${this.jurisdictionRules.deputyRequirements.minAge}` };
  }
  
  return { valid: true };
};

module.exports = mongoose.model('Position', positionSchema);