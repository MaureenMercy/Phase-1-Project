const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 8,
    maxlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^\+254\d{9}$/
  },
  county: {
    type: String,
    required: true,
    trim: true
  },
  constituency: {
    type: String,
    required: true,
    trim: true
  },
  ward: {
    type: String,
    required: true,
    trim: true
  },
  pollingStation: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  votingTime: {
    type: Date
  },
  // Disability disclosure fields
  hasDisability: {
    type: Boolean,
    default: false
  },
  disabilityTypes: [{
    type: String,
    enum: [
      'visual_impairment', // I am blind or have very low vision
      'hearing_impairment', // I am deaf or hard of hearing
      'physical_disability', // I have a physical disability that limits my hands or movement
      'cognitive_impairment', // I have a cognitive impairment (memory, processing issues)
      'other' // Other disability
    ]
  }],
  otherDisabilityDescription: {
    type: String,
    trim: true,
    maxlength: 200,
    required: function() {
      return this.disabilityTypes && this.disabilityTypes.includes('other');
    }
  },
  // Accessibility preferences for voting
  accessibilityPreferences: {
    largeText: {
      type: Boolean,
      default: false
    },
    highContrast: {
      type: Boolean,
      default: false
    },
    voiceGuidance: {
      type: Boolean,
      default: false
    },
    screenReader: {
      type: Boolean,
      default: false
    },
    oneHandedMode: {
      type: Boolean,
      default: false
    },
    simplifiedInterface: {
      type: Boolean,
      default: false
    },
    audioInstructions: {
      type: Boolean,
      default: false
    }
  },
  // Biometric data
  biometricData: {
    fingerprint: {
      type: String, // Base64 encoded fingerprint template
      required: true
    },
    photo: {
      type: String, // Base64 encoded passport photo
      required: true
    }
  },
  // Audit fields
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
voterSchema.index({ nationalId: 1 });
voterSchema.index({ county: 1, constituency: 1, ward: 1 });
voterSchema.index({ hasDisability: 1 });
voterSchema.index({ status: 1 });

// Virtual for age calculation
voterSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to check if voter is eligible to vote
voterSchema.methods.isEligibleToVote = function() {
  return this.status === 'Active' && this.age >= 18 && !this.hasVoted;
};

// Method to get accessibility features based on disability types
voterSchema.methods.getAccessibilityFeatures = function() {
  const features = [];
  
  if (this.disabilityTypes.includes('visual_impairment')) {
    features.push('largeText', 'highContrast', 'voiceGuidance', 'screenReader');
  }
  
  if (this.disabilityTypes.includes('hearing_impairment')) {
    features.push('visualIndicators', 'textInstructions');
  }
  
  if (this.disabilityTypes.includes('physical_disability')) {
    features.push('oneHandedMode', 'voiceGuidance');
  }
  
  if (this.disabilityTypes.includes('cognitive_impairment')) {
    features.push('simplifiedInterface', 'audioInstructions', 'stepByStepGuidance');
  }
  
  return features;
};

// Method to update accessibility preferences based on disability types
voterSchema.methods.updateAccessibilityPreferences = function() {
  if (this.hasDisability && this.disabilityTypes.length > 0) {
    const features = this.getAccessibilityFeatures();
    
    // Update preferences based on detected features
    if (features.includes('largeText')) this.accessibilityPreferences.largeText = true;
    if (features.includes('highContrast')) this.accessibilityPreferences.highContrast = true;
    if (features.includes('voiceGuidance')) this.accessibilityPreferences.voiceGuidance = true;
    if (features.includes('screenReader')) this.accessibilityPreferences.screenReader = true;
    if (features.includes('oneHandedMode')) this.accessibilityPreferences.oneHandedMode = true;
    if (features.includes('simplifiedInterface')) this.accessibilityPreferences.simplifiedInterface = true;
    if (features.includes('audioInstructions')) this.accessibilityPreferences.audioInstructions = true;
  }
};

// Pre-save middleware to update accessibility preferences
voterSchema.pre('save', function(next) {
  if (this.isModified('disabilityTypes') || this.isModified('hasDisability')) {
    this.updateAccessibilityPreferences();
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Voter', voterSchema);