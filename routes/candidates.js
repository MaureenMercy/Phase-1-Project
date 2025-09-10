const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const { verifyToken, requirePermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/candidates');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'));
    }
  }
});

// Get all candidates with filtering and pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      position,
      jurisdiction,
      party,
      search
    } = req.query;

    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (position) query.position = position;
    if (jurisdiction) query['jurisdiction.code'] = jurisdiction;
    if (party) query['party.name'] = new RegExp(party, 'i');
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { nationalId: new RegExp(search, 'i') },
        { 'party.name': new RegExp(search, 'i') }
      ];
    }

    const candidates = await Candidate.find(query)
      .populate('submittedBy', 'username email role')
      .populate('verifiedBy', 'username email role')
      .populate('approvedBy', 'username email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Candidate.countDocuments(query);

    res.json({
      candidates: candidates.map(candidate => ({
        id: candidate._id,
        fullName: candidate.fullName,
        nationalId: candidate.nationalId,
        age: candidate.age,
        gender: candidate.gender,
        party: candidate.party,
        position: candidate.position,
        jurisdiction: candidate.jurisdiction,
        status: candidate.status,
        rejectionReason: candidate.rejectionReason,
        appealsWindow: candidate.appealsWindow,
        submittedBy: candidate.submittedBy,
        verifiedBy: candidate.verifiedBy,
        verifiedAt: candidate.verifiedAt,
        approvedBy: candidate.approvedBy,
        approvedAt: candidate.approvedAt,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Candidates list error:', error);
    res.status(500).json({ error: 'Server error fetching candidates' });
  }
});

// Get single candidate
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('submittedBy', 'username email role')
      .populate('verifiedBy', 'username email role')
      .populate('approvedBy', 'username email role');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({
      candidate: {
        id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        middleName: candidate.middleName,
        fullName: candidate.fullName,
        nationalId: candidate.nationalId,
        dateOfBirth: candidate.dateOfBirth,
        age: candidate.age,
        gender: candidate.gender,
        phoneNumber: candidate.phoneNumber,
        email: candidate.email,
        address: candidate.address,
        party: candidate.party,
        position: candidate.position,
        jurisdiction: candidate.jurisdiction,
        deputy: candidate.deputy,
        documents: candidate.documents,
        status: candidate.status,
        rejectionReason: candidate.rejectionReason,
        appealsWindow: candidate.appealsWindow,
        submittedBy: candidate.submittedBy,
        verifiedBy: candidate.verifiedBy,
        verifiedAt: candidate.verifiedAt,
        approvedBy: candidate.approvedBy,
        approvedAt: candidate.approvedAt,
        notes: candidate.notes,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt
      }
    });
  } catch (error) {
    console.error('Candidate fetch error:', error);
    res.status(500).json({ error: 'Server error fetching candidate' });
  }
});

// Create new candidate
router.post('/', [
  verifyToken,
  requirePermission('candidate_approval'),
  upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'academicCerts', maxCount: 5 },
    { name: 'nominationDocs', maxCount: 5 }
  ]),
  body('firstName').notEmpty().trim().escape(),
  body('lastName').notEmpty().trim().escape(),
  body('nationalId').matches(/^[0-9]{8}$/),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('phoneNumber').isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').notEmpty().trim(),
  body('party.name').notEmpty().trim(),
  body('party.symbol').notEmpty().trim(),
  body('party.color').matches(/^#[0-9A-Fa-f]{6}$/),
  body('position').isIn(['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca']),
  body('jurisdiction.level').isIn(['national', 'county', 'constituency', 'ward']),
  body('jurisdiction.name').notEmpty().trim(),
  body('jurisdiction.code').notEmpty().trim()
], auditLog('candidate_created', 'candidate'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      middleName,
      nationalId,
      dateOfBirth,
      gender,
      phoneNumber,
      email,
      address,
      party,
      position,
      jurisdiction,
      deputy
    } = req.body;

    // Check if candidate already exists
    const existingCandidate = await Candidate.findOne({ nationalId });
    if (existingCandidate) {
      return res.status(400).json({ error: 'Candidate with this National ID already exists' });
    }

    // Validate position eligibility
    const positionDoc = await Position.findOne({ code: position });
    if (!positionDoc) {
      return res.status(400).json({ error: 'Invalid position' });
    }

    // Check age eligibility
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    if (age < positionDoc.requirements.minAge) {
      return res.status(400).json({ 
        error: `Age requirement not met. Minimum age: ${positionDoc.requirements.minAge}, Candidate age: ${age}` 
      });
    }

    // Validate deputy requirements
    if ((position === 'president' || position === 'governor') && !deputy) {
      return res.status(400).json({ error: 'Deputy information required for President/Governor candidates' });
    }

    // Process uploaded files
    const documents = {};
    
    if (req.files.passportPhoto) {
      documents.passportPhoto = {
        filename: req.files.passportPhoto[0].filename,
        path: req.files.passportPhoto[0].path,
        uploadedAt: new Date()
      };
    }

    if (req.files.academicCerts) {
      documents.academicCerts = req.files.academicCerts.map(file => ({
        filename: file.filename,
        path: file.path,
        uploadedAt: new Date(),
        description: 'Academic Certificate'
      }));
    }

    if (req.files.nominationDocs) {
      documents.nominationDocs = req.files.nominationDocs.map(file => ({
        filename: file.filename,
        path: file.path,
        uploadedAt: new Date(),
        description: 'Nomination Document'
      }));
    }

    // Create candidate
    const candidate = new Candidate({
      firstName,
      lastName,
      middleName,
      nationalId,
      dateOfBirth,
      gender,
      phoneNumber,
      email,
      address,
      party,
      position,
      jurisdiction,
      deputy,
      documents,
      submittedBy: req.user.userId
    });

    await candidate.save();

    res.status(201).json({
      message: 'Candidate registered successfully',
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        nationalId: candidate.nationalId,
        position: candidate.position,
        jurisdiction: candidate.jurisdiction,
        status: candidate.status
      }
    });
  } catch (error) {
    console.error('Candidate creation error:', error);
    res.status(500).json({ error: 'Server error creating candidate' });
  }
});

// Update candidate
router.put('/:id', [
  verifyToken,
  requirePermission('candidate_approval'),
  body('firstName').optional().notEmpty().trim().escape(),
  body('lastName').optional().notEmpty().trim().escape(),
  body('phoneNumber').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().notEmpty().trim(),
  body('party.name').optional().notEmpty().trim(),
  body('party.symbol').optional().notEmpty().trim(),
  body('party.color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
], auditLog('candidate_updated', 'candidate', (req) => req.params.id), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Check if candidate can be edited
    if (candidate.status === 'approved') {
      return res.status(400).json({ error: 'Cannot edit approved candidates' });
    }

    const updates = req.body;
    Object.assign(candidate, updates);
    
    await candidate.save();

    res.json({
      message: 'Candidate updated successfully',
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        status: candidate.status
      }
    });
  } catch (error) {
    console.error('Candidate update error:', error);
    res.status(500).json({ error: 'Server error updating candidate' });
  }
});

// Approve candidate
router.put('/:id/approve', [
  verifyToken,
  requirePermission('candidate_approval')
], auditLog('candidate_approved', 'candidate', (req) => req.params.id), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.status === 'approved') {
      return res.status(400).json({ error: 'Candidate already approved' });
    }

    candidate.status = 'approved';
    candidate.verifiedBy = req.user.userId;
    candidate.verifiedAt = new Date();
    candidate.approvedBy = req.user.userId;
    candidate.approvedAt = new Date();

    await candidate.save();

    res.json({
      message: 'Candidate approved successfully',
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        status: candidate.status,
        approvedAt: candidate.approvedAt
      }
    });
  } catch (error) {
    console.error('Candidate approval error:', error);
    res.status(500).json({ error: 'Server error approving candidate' });
  }
});

// Reject candidate
router.put('/:id/reject', [
  verifyToken,
  requirePermission('candidate_approval'),
  body('reason').notEmpty().trim()
], auditLog('candidate_rejected', 'candidate', (req) => req.params.id), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.status === 'approved') {
      return res.status(400).json({ error: 'Cannot reject approved candidate' });
    }

    candidate.status = 'rejected';
    candidate.rejectionReason = reason;
    candidate.verifiedBy = req.user.userId;
    candidate.verifiedAt = new Date();
    
    // Set appeals window (7 days)
    candidate.setAppealsWindow(7);

    await candidate.save();

    res.json({
      message: 'Candidate rejected successfully',
      candidate: {
        id: candidate._id,
        fullName: candidate.fullName,
        status: candidate.status,
        rejectionReason: candidate.rejectionReason,
        appealsWindow: candidate.appealsWindow
      }
    });
  } catch (error) {
    console.error('Candidate rejection error:', error);
    res.status(500).json({ error: 'Server error rejecting candidate' });
  }
});

// Add note to candidate
router.post('/:id/notes', [
  verifyToken,
  requirePermission('candidate_approval'),
  body('text').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    candidate.notes.push({
      text,
      addedBy: req.user.userId,
      addedAt: new Date()
    });

    await candidate.save();

    res.json({
      message: 'Note added successfully',
      note: {
        text,
        addedBy: req.user.userId,
        addedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Server error adding note' });
  }
});

// Get candidate statistics
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const stats = await Candidate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const positionStats = await Candidate.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    const partyStats = await Candidate.aggregate([
      {
        $group: {
          _id: '$party.name',
          count: { $sum: 1 }
        }
      }
    ]).sort({ count: -1 }).limit(10);

    res.json({
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      positionBreakdown: positionStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      topParties: partyStats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

module.exports = router;