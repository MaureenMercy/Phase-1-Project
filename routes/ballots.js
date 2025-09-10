const express = require('express');
const { body, validationResult } = require('express-validator');
const Ballot = require('../models/Ballot');
const Candidate = require('../models/Candidate');
const Position = require('../models/Position');
const { verifyToken, requirePermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Get all ballots with filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      position,
      jurisdiction,
      status,
      search
    } = req.query;

    const query = {};
    
    if (position) query.position = position;
    if (jurisdiction) query['jurisdiction.code'] = jurisdiction;
    if (status) query['workflow.status'] = status;
    
    if (search) {
      query.$or = [
        { 'jurisdiction.name': new RegExp(search, 'i') },
        { 'configuration.title': new RegExp(search, 'i') }
      ];
    }

    const ballots = await Ballot.find(query)
      .populate('candidates.candidate', 'firstName lastName party')
      .populate('workflow.submittedBy', 'username email role')
      .populate('workflow.reviewedBy', 'username email role')
      .populate('workflow.legalAuditedBy', 'username email role')
      .populate('workflow.approvedBy', 'username email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ballot.countDocuments(query);

    res.json({
      ballots: ballots.map(ballot => ({
        id: ballot._id,
        position: ballot.position,
        jurisdiction: ballot.jurisdiction,
        configuration: ballot.configuration,
        candidateCount: ballot.validation.candidateCount,
        workflow: ballot.workflow,
        validation: ballot.validation,
        isLocked: ballot.isLocked,
        createdAt: ballot.createdAt,
        updatedAt: ballot.updatedAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Ballots list error:', error);
    res.status(500).json({ error: 'Server error fetching ballots' });
  }
});

// Get single ballot
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const ballot = await Ballot.findById(req.params.id)
      .populate('candidates.candidate', 'firstName lastName middleName party deputy')
      .populate('workflow.submittedBy', 'username email role')
      .populate('workflow.reviewedBy', 'username email role')
      .populate('workflow.legalAuditedBy', 'username email role')
      .populate('workflow.approvedBy', 'username email role');

    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    res.json({
      ballot: {
        id: ballot._id,
        position: ballot.position,
        jurisdiction: ballot.jurisdiction,
        configuration: ballot.configuration,
        candidates: ballot.candidates,
        workflow: ballot.workflow,
        validation: ballot.validation,
        preview: ballot.preview,
        isLocked: ballot.isLocked,
        chainOfCustody: ballot.chainOfCustody,
        version: ballot.version,
        createdAt: ballot.createdAt,
        updatedAt: ballot.updatedAt
      }
    });
  } catch (error) {
    console.error('Ballot fetch error:', error);
    res.status(500).json({ error: 'Server error fetching ballot' });
  }
});

// Create new ballot
router.post('/', [
  verifyToken,
  requirePermission('ballot_approval'),
  body('position').isIn(['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca']),
  body('jurisdiction.level').isIn(['national', 'county', 'constituency', 'ward']),
  body('jurisdiction.name').notEmpty().trim(),
  body('jurisdiction.code').notEmpty().trim(),
  body('configuration.title').notEmpty().trim()
], auditLog('ballot_created', 'ballot'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { position, jurisdiction, configuration } = req.body;

    // Check if ballot already exists for this position and jurisdiction
    const existingBallot = await Ballot.findOne({
      position,
      'jurisdiction.code': jurisdiction.code
    });

    if (existingBallot) {
      return res.status(400).json({ 
        error: 'Ballot already exists for this position and jurisdiction' 
      });
    }

    // Get approved candidates for this position and jurisdiction
    const candidates = await Candidate.find({
      position,
      'jurisdiction.code': jurisdiction.code,
      status: 'approved'
    }).sort({ 'party.name': 1, lastName: 1 });

    if (candidates.length === 0) {
      return res.status(400).json({ 
        error: 'No approved candidates found for this position and jurisdiction' 
      });
    }

    // Create ballot with candidates
    const ballotCandidates = candidates.map((candidate, index) => ({
      candidate: candidate._id,
      displayOrder: index + 1,
      party: {
        name: candidate.party.name,
        symbol: candidate.party.symbol,
        color: candidate.party.color
      },
      deputy: candidate.deputy ? {
        name: `${candidate.deputy.firstName} ${candidate.deputy.lastName}`,
        nationalId: candidate.deputy.nationalId
      } : null
    }));

    const ballot = new Ballot({
      position,
      jurisdiction,
      configuration: {
        ...configuration,
        showDeputies: position === 'president' || position === 'governor'
      },
      candidates: ballotCandidates,
      workflow: {
        status: 'draft',
        submittedBy: req.user.userId
      }
    });

    // Validate ballot
    ballot.validateBallot();

    await ballot.save();

    // Add to chain of custody
    ballot.addToChainOfCustody('ballot_created', req.user.userId, 'Ballot created');

    res.status(201).json({
      message: 'Ballot created successfully',
      ballot: {
        id: ballot._id,
        position: ballot.position,
        jurisdiction: ballot.jurisdiction,
        candidateCount: ballot.validation.candidateCount,
        status: ballot.workflow.status
      }
    });
  } catch (error) {
    console.error('Ballot creation error:', error);
    res.status(500).json({ error: 'Server error creating ballot' });
  }
});

// Update ballot configuration
router.put('/:id', [
  verifyToken,
  requirePermission('ballot_approval'),
  body('configuration.title').optional().notEmpty().trim(),
  body('configuration.instructions').optional().trim(),
  body('configuration.showPartySymbols').optional().isBoolean(),
  body('configuration.showPartyColors').optional().isBoolean(),
  body('configuration.randomizeOrder').optional().isBoolean()
], auditLog('ballot_updated', 'ballot', (req) => req.params.id), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ballot = await Ballot.findById(req.params.id);
    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    if (!ballot.canBeEdited()) {
      return res.status(400).json({ error: 'Ballot cannot be edited in current state' });
    }

    const { configuration } = req.body;
    if (configuration) {
      Object.assign(ballot.configuration, configuration);
    }

    // Re-validate ballot
    ballot.validateBallot();
    await ballot.save();

    // Add to chain of custody
    ballot.addToChainOfCustody('ballot_updated', req.user.userId, 'Ballot configuration updated');

    res.json({
      message: 'Ballot updated successfully',
      ballot: {
        id: ballot._id,
        configuration: ballot.configuration,
        validation: ballot.validation
      }
    });
  } catch (error) {
    console.error('Ballot update error:', error);
    res.status(500).json({ error: 'Server error updating ballot' });
  }
});

// Submit ballot for review
router.put('/:id/submit', [
  verifyToken,
  requirePermission('ballot_approval')
], auditLog('ballot_submitted', 'ballot', (req) => req.params.id), async (req, res) => {
  try {
    const ballot = await Ballot.findById(req.params.id);
    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    if (ballot.workflow.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft ballots can be submitted' });
    }

    // Validate ballot before submission
    const isValid = ballot.validateBallot();
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Ballot validation failed',
        errors: ballot.validation.errors
      });
    }

    ballot.workflow.status = 'submitted';
    ballot.workflow.submittedBy = req.user.userId;
    ballot.workflow.submittedAt = new Date();

    await ballot.save();

    // Add to chain of custody
    ballot.addToChainOfCustody('ballot_submitted', req.user.userId, 'Ballot submitted for review');

    res.json({
      message: 'Ballot submitted for review',
      ballot: {
        id: ballot._id,
        status: ballot.workflow.status,
        submittedAt: ballot.workflow.submittedAt
      }
    });
  } catch (error) {
    console.error('Ballot submission error:', error);
    res.status(500).json({ error: 'Server error submitting ballot' });
  }
});

// Review ballot (HQ)
router.put('/:id/review', [
  verifyToken,
  requirePermission('ballot_approval'),
  body('approved').isBoolean(),
  body('comments').optional().trim()
], auditLog('ballot_reviewed', 'ballot', (req) => req.params.id), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { approved, comments } = req.body;
    const ballot = await Ballot.findById(req.params.id);
    
    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    if (ballot.workflow.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted ballots can be reviewed' });
    }

    ballot.workflow.status = approved ? 'legal_audit' : 'draft';
    ballot.workflow.reviewedBy = req.user.userId;
    ballot.workflow.reviewedAt = new Date();

    if (comments) {
      ballot.notes = ballot.notes || [];
      ballot.notes.push({
        text: comments,
        addedBy: req.user.userId,
        addedAt: new Date()
      });
    }

    await ballot.save();

    // Add to chain of custody
    ballot.addToChainOfCustody('ballot_reviewed', req.user.userId, 
      `Ballot ${approved ? 'approved' : 'rejected'} for review`);

    res.json({
      message: `Ballot ${approved ? 'approved' : 'rejected'} for review`,
      ballot: {
        id: ballot._id,
        status: ballot.workflow.status,
        reviewedAt: ballot.workflow.reviewedAt
      }
    });
  } catch (error) {
    console.error('Ballot review error:', error);
    res.status(500).json({ error: 'Server error reviewing ballot' });
  }
});

// Legal audit (Legal Auditor)
router.put('/:id/legal-audit', [
  verifyToken,
  requirePermission('ballot_approval'),
  body('approved').isBoolean(),
  body('comments').optional().trim()
], auditLog('ballot_legal_audited', 'ballot', (req) => req.params.id), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { approved, comments } = req.body;
    const ballot = await Ballot.findById(req.params.id);
    
    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    if (ballot.workflow.status !== 'legal_audit') {
      return res.status(400).json({ error: 'Only ballots in legal audit can be audited' });
    }

    ballot.workflow.status = approved ? 'approved' : 'draft';
    ballot.workflow.legalAuditedBy = req.user.userId;
    ballot.workflow.legalAuditedAt = new Date();

    if (approved) {
      ballot.workflow.approvedBy = req.user.userId;
      ballot.workflow.approvedAt = new Date();
    }

    if (comments) {
      ballot.notes = ballot.notes || [];
      ballot.notes.push({
        text: comments,
        addedBy: req.user.userId,
        addedAt: new Date()
      });
    }

    await ballot.save();

    // Add to chain of custody
    ballot.addToChainOfCustody('ballot_legal_audited', req.user.userId, 
      `Legal audit ${approved ? 'passed' : 'failed'}`);

    res.json({
      message: `Legal audit ${approved ? 'passed' : 'failed'}`,
      ballot: {
        id: ballot._id,
        status: ballot.workflow.status,
        legalAuditedAt: ballot.workflow.legalAuditedAt,
        approvedAt: ballot.workflow.approvedAt
      }
    });
  } catch (error) {
    console.error('Legal audit error:', error);
    res.status(500).json({ error: 'Server error during legal audit' });
  }
});

// Lock ballot (Final approval)
router.put('/:id/lock', [
  verifyToken,
  requirePermission('ballot_approval'),
  body('reason').optional().trim()
], auditLog('ballot_locked', 'ballot', (req) => req.params.id), async (req, res) => {
  try {
    const { reason } = req.body;
    const ballot = await Ballot.findById(req.params.id);
    
    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    if (ballot.workflow.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved ballots can be locked' });
    }

    ballot.workflow.status = 'locked';
    ballot.workflow.lockedAt = new Date();
    ballot.isLocked = true;
    ballot.lockReason = reason || 'Final approval';

    await ballot.save();

    // Add to chain of custody
    ballot.addToChainOfCustody('ballot_locked', req.user.userId, 'Ballot locked for production');

    res.json({
      message: 'Ballot locked successfully',
      ballot: {
        id: ballot._id,
        status: ballot.workflow.status,
        lockedAt: ballot.workflow.lockedAt,
        isLocked: ballot.isLocked
      }
    });
  } catch (error) {
    console.error('Ballot lock error:', error);
    res.status(500).json({ error: 'Server error locking ballot' });
  }
});

// Generate ballot preview
router.post('/:id/preview', [
  verifyToken,
  requirePermission('ballot_approval')
], async (req, res) => {
  try {
    const ballot = await Ballot.findById(req.params.id);
    if (!ballot) {
      return res.status(404).json({ error: 'Ballot not found' });
    }

    // Generate preview (this would integrate with a preview service)
    ballot.generatePreview();
    await ballot.save();

    res.json({
      message: 'Preview generated successfully',
      preview: ballot.preview
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({ error: 'Server error generating preview' });
  }
});

// Get ballot statistics
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const stats = await Ballot.aggregate([
      {
        $group: {
          _id: '$workflow.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const positionStats = await Ballot.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    const jurisdictionStats = await Ballot.aggregate([
      {
        $group: {
          _id: '$jurisdiction.level',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      positionBreakdown: positionStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      jurisdictionBreakdown: jurisdictionStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Ballot stats error:', error);
    res.status(500).json({ error: 'Server error fetching ballot statistics' });
  }
});

module.exports = router;