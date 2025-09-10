const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[0-9]{8}$/
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  
  // Contact Information
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9+\-\s()]+$/
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  
  // Political Information
  party: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    symbol: {
      type: String,
      required: true,
      trim: true
    },
    slogan: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/
    }
  },
  
  // Position and Jurisdiction
  position: {
    type: String,
    enum: ['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca'],
    required: true
  },
  jurisdiction: {
    level: {
      type: String,
      enum: ['national', 'county', 'constituency', 'ward'],
      required: true
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
  
  // Deputy Information (for President/Governor)
  deputy: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    nationalId: {
      type: String,
      trim: true,
      match: /^[0-9]{8}$/
    },
    phoneNumber: {
      type: String,
      trim: true
    }
  },
  
  // Document Uploads
  documents: {
    passportPhoto: {
      filename: String,
      path: String,
      uploadedAt: Date
    },
    academicCerts: [{
      filename: String,
      path: String,
      uploadedAt: Date,
      description: String
    }],
    nominationDocs: [{
      filename: String,
      path: String,
      uploadedAt: Date,
      description: String
    }]
  },
  
  // Status and Approval
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected'],
    default: 'pending_verification'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  appealsWindow: {
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  
  // Audit Trail
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
candidateSchema.index({ nationalId: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ position: 1, 'jurisdiction.code': 1 });
candidateSchema.index({ 'party.name': 1 });

// Virtual for full name
candidateSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// Virtual for age
candidateSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Method to check if appeals window is active
candidateSchema.methods.isAppealsWindowActive = function() {
  if (!this.appealsWindow.isActive) return false;
  
  const now = new Date();
  return now >= this.appealsWindow.startDate && now <= this.appealsWindow.endDate;
};

// Method to set appeals window
candidateSchema.methods.setAppealsWindow = function(days = 7) {
  this.appealsWindow = {
    startDate: new Date(),
    endDate: new Date(Date.now() + (days * 24 * 60 * 60 * 1000)),
    isActive: true
  };
};

module.exports = mongoose.model('Candidate', candidateSchema);