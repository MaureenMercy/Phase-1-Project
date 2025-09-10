const express = require('express');
const { body, validationResult } = require('express-validator');
const Voter = require('../models/Voter');
const { verifyToken } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Register new voter
router.post('/register', [
  body('nationalId').isLength({ min: 8, max: 8 }).isNumeric(),
  body('name').isLength({ min: 2, max: 100 }).trim().escape(),
  body('dateOfBirth').isISO8601().toDate(),
  body('address').isLength({ min: 5, max: 200 }).trim().escape(),
  body('phone').matches(/^\+254\d{9}$/),
  body('county').notEmpty().trim().escape(),
  body('constituency').notEmpty().trim().escape(),
  body('ward').notEmpty().trim().escape(),
  body('pollingStation').notEmpty().trim().escape(),
  body('hasDisability').isBoolean(),
  body('disabilityTypes').optional().isArray(),
  body('otherDisabilityDescription').optional().isLength({ max: 200 }).trim().escape(),
  body('biometricData.fingerprint').notEmpty(),
  body('biometricData.photo').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      nationalId,
      name,
      dateOfBirth,
      address,
      phone,
      county,
      constituency,
      ward,
      pollingStation,
      hasDisability,
      disabilityTypes = [],
      otherDisabilityDescription,
      biometricData
    } = req.body;

    // Check if voter already exists
    const existingVoter = await Voter.findOne({ nationalId });
    if (existingVoter) {
      return res.status(400).json({ error: 'Voter with this National ID already registered' });
    }

    // Validate age (must be 18 or older)
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age;

    if (actualAge < 18) {
      return res.status(400).json({ error: 'Voter must be 18 years or older to register' });
    }

    // Validate disability data
    if (hasDisability) {
      if (!disabilityTypes || disabilityTypes.length === 0) {
        return res.status(400).json({ error: 'Disability types must be specified when hasDisability is true' });
      }

      const validDisabilityTypes = [
        'visual_impairment',
        'hearing_impairment', 
        'physical_disability',
        'cognitive_impairment',
        'other'
      ];

      const invalidTypes = disabilityTypes.filter(type => !validDisabilityTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({ error: `Invalid disability types: ${invalidTypes.join(', ')}` });
      }

      if (disabilityTypes.includes('other') && !otherDisabilityDescription) {
        return res.status(400).json({ error: 'Other disability description is required when "other" is selected' });
      }
    }

    // Create new voter
    const voter = new Voter({
      nationalId,
      name,
      dateOfBirth,
      address,
      phone,
      county,
      constituency,
      ward,
      pollingStation,
      hasDisability,
      disabilityTypes: hasDisability ? disabilityTypes : [],
      otherDisabilityDescription: hasDisability && disabilityTypes.includes('other') ? otherDisabilityDescription : undefined,
      biometricData
    });

    await voter.save();

    // Log the registration
    const auditEntry = new AuditLog({
      action: 'voter_registered',
      entityType: 'voter',
      entityId: voter._id,
      performedBy: req.user?.userId || 'system',
      userRole: req.user?.role || 'system',
      description: `Voter ${name} (${nationalId}) registered with ${hasDisability ? 'disability disclosure' : 'no disability'}`,
      details: {
        nationalId,
        county,
        constituency,
        ward,
        hasDisability,
        disabilityTypes: hasDisability ? disabilityTypes : null
      },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'registration',
      severity: 'medium'
    });
    await auditEntry.save();

    res.status(201).json({
      message: 'Voter registered successfully',
      voter: {
        id: voter._id,
        nationalId: voter.nationalId,
        name: voter.name,
        county: voter.county,
        constituency: voter.constituency,
        ward: voter.ward,
        pollingStation: voter.pollingStation,
        hasDisability: voter.hasDisability,
        disabilityTypes: voter.disabilityTypes,
        accessibilityPreferences: voter.accessibilityPreferences,
        registrationDate: voter.registrationDate
      }
    });
  } catch (error) {
    console.error('Voter registration error:', error);
    res.status(500).json({ error: 'Server error during voter registration' });
  }
});

// Get voter by National ID
router.get('/:nationalId', async (req, res) => {
  try {
    const voter = await Voter.findOne({ nationalId: req.params.nationalId });
    
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    res.json({
      voter: {
        id: voter._id,
        nationalId: voter.nationalId,
        name: voter.name,
        dateOfBirth: voter.dateOfBirth,
        address: voter.address,
        phone: voter.phone,
        county: voter.county,
        constituency: voter.constituency,
        ward: voter.ward,
        pollingStation: voter.pollingStation,
        status: voter.status,
        hasDisability: voter.hasDisability,
        disabilityTypes: voter.disabilityTypes,
        otherDisabilityDescription: voter.otherDisabilityDescription,
        accessibilityPreferences: voter.accessibilityPreferences,
        hasVoted: voter.hasVoted,
        votingTime: voter.votingTime,
        registrationDate: voter.registrationDate
      }
    });
  } catch (error) {
    console.error('Get voter error:', error);
    res.status(500).json({ error: 'Server error fetching voter' });
  }
});

// Update voter disability information
router.put('/:nationalId/disability', [
  verifyToken,
  body('hasDisability').isBoolean(),
  body('disabilityTypes').optional().isArray(),
  body('otherDisabilityDescription').optional().isLength({ max: 200 }).trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const voter = await Voter.findOne({ nationalId: req.params.nationalId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    const { hasDisability, disabilityTypes = [], otherDisabilityDescription } = req.body;

    // Validate disability data
    if (hasDisability) {
      if (!disabilityTypes || disabilityTypes.length === 0) {
        return res.status(400).json({ error: 'Disability types must be specified when hasDisability is true' });
      }

      const validDisabilityTypes = [
        'visual_impairment',
        'hearing_impairment',
        'physical_disability', 
        'cognitive_impairment',
        'other'
      ];

      const invalidTypes = disabilityTypes.filter(type => !validDisabilityTypes.includes(type));
      if (invalidTypes.length > 0) {
        return res.status(400).json({ error: `Invalid disability types: ${invalidTypes.join(', ')}` });
      }

      if (disabilityTypes.includes('other') && !otherDisabilityDescription) {
        return res.status(400).json({ error: 'Other disability description is required when "other" is selected' });
      }
    }

    // Update voter disability information
    voter.hasDisability = hasDisability;
    voter.disabilityTypes = hasDisability ? disabilityTypes : [];
    voter.otherDisabilityDescription = hasDisability && disabilityTypes.includes('other') ? otherDisabilityDescription : undefined;
    voter.updatedBy = req.user.userId;

    await voter.save();

    // Log the update
    const auditEntry = new AuditLog({
      action: 'voter_disability_updated',
      entityType: 'voter',
      entityId: voter._id,
      performedBy: req.user.userId,
      userRole: req.user.role,
      description: `Disability information updated for voter ${voter.name} (${voter.nationalId})`,
      details: {
        nationalId: voter.nationalId,
        hasDisability,
        disabilityTypes: hasDisability ? disabilityTypes : null,
        previousDisabilityTypes: voter.disabilityTypes
      },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'data_modification',
      severity: 'medium'
    });
    await auditEntry.save();

    res.json({
      message: 'Disability information updated successfully',
      voter: {
        id: voter._id,
        nationalId: voter.nationalId,
        hasDisability: voter.hasDisability,
        disabilityTypes: voter.disabilityTypes,
        otherDisabilityDescription: voter.otherDisabilityDescription,
        accessibilityPreferences: voter.accessibilityPreferences
      }
    });
  } catch (error) {
    console.error('Update disability error:', error);
    res.status(500).json({ error: 'Server error updating disability information' });
  }
});

// Get voters with disabilities (for accessibility planning)
router.get('/disability/statistics', verifyToken, async (req, res) => {
  try {
    const stats = await Voter.aggregate([
      {
        $group: {
          _id: null,
          totalVoters: { $sum: 1 },
          votersWithDisabilities: {
            $sum: { $cond: [{ $eq: ['$hasDisability', true] }, 1, 0] }
          },
          disabilityBreakdown: {
            $push: {
              $cond: [
                { $eq: ['$hasDisability', true] },
                '$disabilityTypes',
                []
              ]
            }
          }
        }
      }
    ]);

    const countyStats = await Voter.aggregate([
      {
        $group: {
          _id: '$county',
          totalVoters: { $sum: 1 },
          votersWithDisabilities: {
            $sum: { $cond: [{ $eq: ['$hasDisability', true] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          disabilityPercentage: {
            $multiply: [
              { $divide: ['$votersWithDisabilities', '$totalVoters'] },
              100
            ]
          }
        }
      },
      { $sort: { disabilityPercentage: -1 } }
    ]);

    // Flatten disability types for breakdown
    const allDisabilityTypes = stats[0]?.disabilityBreakdown?.flat() || [];
    const disabilityTypeCount = allDisabilityTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      overall: {
        totalVoters: stats[0]?.totalVoters || 0,
        votersWithDisabilities: stats[0]?.votersWithDisabilities || 0,
        disabilityPercentage: stats[0]?.totalVoters > 0 
          ? ((stats[0].votersWithDisabilities / stats[0].totalVoters) * 100).toFixed(2)
          : 0
      },
      disabilityTypeBreakdown: disabilityTypeCount,
      countyBreakdown: countyStats
    });
  } catch (error) {
    console.error('Disability statistics error:', error);
    res.status(500).json({ error: 'Server error fetching disability statistics' });
  }
});

// Get voters by polling station with accessibility needs
router.get('/polling-station/:stationId/accessibility', verifyToken, async (req, res) => {
  try {
    const voters = await Voter.find({
      pollingStation: req.params.stationId,
      hasDisability: true
    }).select('nationalId name disabilityTypes accessibilityPreferences');

    res.json({
      pollingStation: req.params.stationId,
      votersWithAccessibilityNeeds: voters.length,
      voters: voters.map(voter => ({
        nationalId: voter.nationalId,
        name: voter.name,
        disabilityTypes: voter.disabilityTypes,
        accessibilityPreferences: voter.accessibilityPreferences
      }))
    });
  } catch (error) {
    console.error('Polling station accessibility error:', error);
    res.status(500).json({ error: 'Server error fetching polling station accessibility data' });
  }
});

// Mark voter as voted
router.put('/:nationalId/vote', [
  verifyToken,
  body('candidateSelections').isObject()
], async (req, res) => {
  try {
    const voter = await Voter.findOne({ nationalId: req.params.nationalId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ error: 'Voter has already voted' });
    }

    voter.hasVoted = true;
    voter.votingTime = new Date();
    voter.updatedBy = req.user.userId;

    await voter.save();

    // Log the vote
    const auditEntry = new AuditLog({
      action: 'voter_voted',
      entityType: 'voter',
      entityId: voter._id,
      performedBy: req.user.userId,
      userRole: req.user.role,
      description: `Voter ${voter.name} (${voter.nationalId}) cast their vote`,
      details: {
        nationalId: voter.nationalId,
        hasDisability: voter.hasDisability,
        disabilityTypes: voter.disabilityTypes,
        votingTime: voter.votingTime
      },
      requestInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      category: 'voting',
      severity: 'high'
    });
    await auditEntry.save();

    res.json({
      message: 'Vote recorded successfully',
      voter: {
        nationalId: voter.nationalId,
        hasVoted: voter.hasVoted,
        votingTime: voter.votingTime
      }
    });
  } catch (error) {
    console.error('Vote recording error:', error);
    res.status(500).json({ error: 'Server error recording vote' });
  }
});

module.exports = router;