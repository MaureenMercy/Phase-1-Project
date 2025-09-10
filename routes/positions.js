const express = require('express');
const { body, validationResult } = require('express-validator');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const { verifyToken, requirePermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Get all positions
router.get('/', verifyToken, async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true }).sort({ ballotConfig: { displayOrder: 1 } });
    
    res.json({
      positions: positions.map(position => ({
        id: position._id,
        name: position.name,
        code: position.code,
        level: position.level,
        requirements: position.requirements,
        jurisdictionRules: position.jurisdictionRules,
        ballotConfig: position.ballotConfig,
        description: position.description
      }))
    });
  } catch (error) {
    console.error('Positions list error:', error);
    res.status(500).json({ error: 'Server error fetching positions' });
  }
});

// Get single position
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);
    
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    res.json({
      position: {
        id: position._id,
        name: position.name,
        code: position.code,
        level: position.level,
        requirements: position.requirements,
        jurisdictionRules: position.jurisdictionRules,
        ballotConfig: position.ballotConfig,
        description: position.description,
        isActive: position.isActive,
        createdAt: position.createdAt
      }
    });
  } catch (error) {
    console.error('Position fetch error:', error);
    res.status(500).json({ error: 'Server error fetching position' });
  }
});

// Create new position (HQ only)
router.post('/', [
  verifyToken,
  requirePermission('position_assignment'),
  body('name').notEmpty().trim(),
  body('code').isIn(['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca']),
  body('level').isIn(['national', 'county', 'constituency', 'ward']),
  body('requirements.minAge').isInt({ min: 18, max: 100 }),
  body('requirements.maxAge').optional().isInt({ min: 18, max: 100 }),
  body('ballotConfig.displayOrder').isInt({ min: 1 })
], auditLog('position_created', 'position'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const positionData = req.body;
    positionData.createdBy = req.user.userId;

    const position = new Position(positionData);
    await position.save();

    res.status(201).json({
      message: 'Position created successfully',
      position: {
        id: position._id,
        name: position.name,
        code: position.code,
        level: position.level
      }
    });
  } catch (error) {
    console.error('Position creation error:', error);
    res.status(500).json({ error: 'Server error creating position' });
  }
});

// Update position
router.put('/:id', [
  verifyToken,
  requirePermission('position_assignment'),
  body('requirements.minAge').optional().isInt({ min: 18, max: 100 }),
  body('requirements.maxAge').optional().isInt({ min: 18, max: 100 }),
  body('ballotConfig.displayOrder').optional().isInt({ min: 1 })
], auditLog('position_updated', 'position', (req) => req.params.id), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const position = await Position.findById(req.params.id);
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    const updates = req.body;
    Object.assign(position, updates);
    await position.save();

    res.json({
      message: 'Position updated successfully',
      position: {
        id: position._id,
        name: position.name,
        code: position.code
      }
    });
  } catch (error) {
    console.error('Position update error:', error);
    res.status(500).json({ error: 'Server error updating position' });
  }
});

// Auto-assign candidates to positions
router.post('/auto-assign', [
  verifyToken,
  requirePermission('position_assignment')
], async (req, res) => {
  try {
    const { jurisdiction } = req.body;
    
    // Get all approved candidates
    const candidates = await Candidate.find({ 
      status: 'approved',
      ...(jurisdiction && { 'jurisdiction.code': jurisdiction })
    });

    const assignments = [];
    const errors = [];

    for (const candidate of candidates) {
      try {
        // Get position requirements
        const position = await Position.findOne({ code: candidate.position });
        if (!position) {
          errors.push({
            candidateId: candidate._id,
            candidateName: candidate.fullName,
            error: 'Position not found'
          });
          continue;
        }

        // Check eligibility
        const eligibility = position.isEligible(candidate);
        if (!eligibility.eligible) {
          errors.push({
            candidateId: candidate._id,
            candidateName: candidate.fullName,
            error: eligibility.reason
          });
          continue;
        }

        // Check for duplicate names in same position and jurisdiction
        const duplicate = await Candidate.findOne({
          _id: { $ne: candidate._id },
          position: candidate.position,
          'jurisdiction.code': candidate.jurisdiction.code,
          status: 'approved',
          $or: [
            { firstName: candidate.firstName, lastName: candidate.lastName },
            { nationalId: candidate.nationalId }
          ]
        });

        if (duplicate) {
          errors.push({
            candidateId: candidate._id,
            candidateName: candidate.fullName,
            error: 'Duplicate candidate name or ID in same position and jurisdiction'
          });
          continue;
        }

        // Validate deputy if required
        if (position.jurisdictionRules.requiresDeputy) {
          const deputyValidation = position.validateDeputy(candidate.deputy);
          if (!deputyValidation.valid) {
            errors.push({
              candidateId: candidate._id,
              candidateName: candidate.fullName,
              error: deputyValidation.reason
            });
            continue;
          }
        }

        assignments.push({
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          position: candidate.position,
          jurisdiction: candidate.jurisdiction,
          status: 'eligible'
        });

      } catch (error) {
        errors.push({
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Auto-assignment completed',
      assignments,
      errors,
      summary: {
        total: candidates.length,
        assigned: assignments.length,
        errors: errors.length
      }
    });
  } catch (error) {
    console.error('Auto-assignment error:', error);
    res.status(500).json({ error: 'Server error during auto-assignment' });
  }
});

// Manual position assignment
router.post('/assign', [
  verifyToken,
  requirePermission('position_assignment'),
  body('candidateId').isMongoId(),
  body('position').isIn(['president', 'governor', 'senator', 'mp', 'woman_rep', 'mca']),
  body('jurisdiction.level').isIn(['national', 'county', 'constituency', 'ward']),
  body('jurisdiction.name').notEmpty().trim(),
  body('jurisdiction.code').notEmpty().trim()
], auditLog('position_assigned', 'candidate', (req) => req.body.candidateId), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { candidateId, position, jurisdiction } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved candidates can be assigned positions' });
    }

    // Get position requirements
    const positionDoc = await Position.findOne({ code: position });
    if (!positionDoc) {
      return res.status(400).json({ error: 'Invalid position' });
    }

    // Check eligibility
    const eligibility = positionDoc.isEligible(candidate);
    if (!eligibility.eligible) {
      return res.status(400).json({ error: eligibility.reason });
    }

    // Check for duplicates
    const duplicate = await Candidate.findOne({
      _id: { $ne: candidateId },
      position,
      'jurisdiction.code': jurisdiction.code,
      status: 'approved',
      $or: [
        { firstName: candidate.firstName, lastName: candidate.lastName },
        { nationalId: candidate.nationalId }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ 
        error: 'Duplicate candidate name or ID in same position and jurisdiction' 
      });
    }

    // Update candidate
    candidate.position = position;
    candidate.jurisdiction = jurisdiction;
    await candidate.save();

    res.json({
      message: 'Position assigned successfully',
      assignment: {
        candidateId: candidate._id,
        candidateName: candidate.fullName,
        position,
        jurisdiction
      }
    });
  } catch (error) {
    console.error('Position assignment error:', error);
    res.status(500).json({ error: 'Server error assigning position' });
  }
});

// Get assignment statistics
router.get('/stats/assignments', verifyToken, async (req, res) => {
  try {
    const { jurisdiction } = req.query;

    const matchStage = { status: 'approved' };
    if (jurisdiction) {
      matchStage['jurisdiction.code'] = jurisdiction;
    }

    const stats = await Candidate.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            position: '$position',
            jurisdiction: '$jurisdiction.code'
          },
          count: { $sum: 1 },
          candidates: {
            $push: {
              id: '$_id',
              name: { $concat: ['$firstName', ' ', '$lastName'] },
              party: '$party.name'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.position',
          jurisdictions: {
            $push: {
              jurisdiction: '$_id.jurisdiction',
              count: '$count',
              candidates: '$candidates'
            }
          },
          totalCandidates: { $sum: '$count' }
        }
      }
    ]);

    res.json({
      assignments: stats.map(stat => ({
        position: stat._id,
        totalCandidates: stat.totalCandidates,
        jurisdictions: stat.jurisdictions
      }))
    });
  } catch (error) {
    console.error('Assignment stats error:', error);
    res.status(500).json({ error: 'Server error fetching assignment statistics' });
  }
});

// Validate position assignments
router.post('/validate', [
  verifyToken,
  requirePermission('position_assignment')
], async (req, res) => {
  try {
    const { jurisdiction } = req.body;

    const matchStage = { status: 'approved' };
    if (jurisdiction) {
      matchStage['jurisdiction.code'] = jurisdiction;
    }

    const candidates = await Candidate.find(matchStage);
    const validationResults = [];

    for (const candidate of candidates) {
      const position = await Position.findOne({ code: candidate.position });
      if (!position) {
        validationResults.push({
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          position: candidate.position,
          jurisdiction: candidate.jurisdiction.code,
          status: 'error',
          message: 'Position not found'
        });
        continue;
      }

      const eligibility = position.isEligible(candidate);
      if (!eligibility.eligible) {
        validationResults.push({
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          position: candidate.position,
          jurisdiction: candidate.jurisdiction.code,
          status: 'error',
          message: eligibility.reason
        });
        continue;
      }

      // Check for duplicates
      const duplicate = await Candidate.findOne({
        _id: { $ne: candidate._id },
        position: candidate.position,
        'jurisdiction.code': candidate.jurisdiction.code,
        status: 'approved',
        $or: [
          { firstName: candidate.firstName, lastName: candidate.lastName },
          { nationalId: candidate.nationalId }
        ]
      });

      if (duplicate) {
        validationResults.push({
          candidateId: candidate._id,
          candidateName: candidate.fullName,
          position: candidate.position,
          jurisdiction: candidate.jurisdiction.code,
          status: 'error',
          message: 'Duplicate candidate in same position and jurisdiction'
        });
        continue;
      }

      validationResults.push({
        candidateId: candidate._id,
        candidateName: candidate.fullName,
        position: candidate.position,
        jurisdiction: candidate.jurisdiction.code,
        status: 'valid',
        message: 'Assignment is valid'
      });
    }

    const summary = {
      total: validationResults.length,
      valid: validationResults.filter(r => r.status === 'valid').length,
      errors: validationResults.filter(r => r.status === 'error').length
    };

    res.json({
      validationResults,
      summary
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Server error validating assignments' });
  }
});

module.exports = router;