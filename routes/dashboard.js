const express = require('express');
const Candidate = require('../models/Candidate');
const Ballot = require('../models/Ballot');
const Position = require('../models/Position');
const AuditLog = require('../models/AuditLog');
const { verifyToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', verifyToken, async (req, res) => {
  try {
    const { jurisdiction } = req.query;

    // Build match criteria based on user role and jurisdiction
    const matchCriteria = {};
    if (jurisdiction) {
      matchCriteria['jurisdiction.code'] = jurisdiction;
    }

    // Get candidate statistics
    const candidateStats = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get position assignment statistics
    const positionStats = await Candidate.aggregate([
      { $match: { ...matchCriteria, status: 'approved' } },
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get ballot statistics
    const ballotStats = await Ballot.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$workflow.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await AuditLog.find({})
      .populate('performedBy', 'username email role')
      .sort({ timestamp: -1 })
      .limit(10);

    // Get pending verifications
    const pendingVerifications = await Candidate.countDocuments({
      ...matchCriteria,
      status: 'pending_verification'
    });

    // Get rejected applications
    const rejectedApplications = await Candidate.countDocuments({
      ...matchCriteria,
      status: 'rejected'
    });

    // Get approved candidates
    const approvedCandidates = await Candidate.countDocuments({
      ...matchCriteria,
      status: 'approved'
    });

    // Get total candidates
    const totalCandidates = await Candidate.countDocuments(matchCriteria);

    // Get approved ballots
    const approvedBallots = await Ballot.countDocuments({
      ...matchCriteria,
      'workflow.status': 'approved'
    });

    // Get locked ballots
    const lockedBallots = await Ballot.countDocuments({
      ...matchCriteria,
      isLocked: true
    });

    // Get total ballots
    const totalBallots = await Ballot.countDocuments(matchCriteria);

    res.json({
      metrics: {
        candidates: {
          total: totalCandidates,
          registered: totalCandidates,
          approved: approvedCandidates,
          pending: pendingVerifications,
          rejected: rejectedApplications
        },
        positions: {
          assigned: positionStats.reduce((sum, stat) => sum + stat.count, 0),
          breakdown: positionStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        },
        ballots: {
          total: totalBallots,
          approved: approvedBallots,
          locked: lockedBallots,
          breakdown: ballotStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity._id,
        action: activity.action,
        entityType: activity.entityType,
        performedBy: activity.performedBy,
        description: activity.description,
        timestamp: activity.timestamp,
        severity: activity.severity
      })),
      summary: {
        candidatesRegistered: totalCandidates,
        positionsAssigned: positionStats.reduce((sum, stat) => sum + stat.count, 0),
        ballotsApproved: approvedBallots,
        pendingVerifications: pendingVerifications,
        rejectedApplications: rejectedApplications
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard overview' });
  }
});

// Get candidate statistics
router.get('/candidates/stats', verifyToken, async (req, res) => {
  try {
    const { jurisdiction, startDate, endDate } = req.query;

    const matchCriteria = {};
    if (jurisdiction) matchCriteria['jurisdiction.code'] = jurisdiction;
    if (startDate) matchCriteria.createdAt = { ...matchCriteria.createdAt, $gte: new Date(startDate) };
    if (endDate) matchCriteria.createdAt = { ...matchCriteria.createdAt, $lte: new Date(endDate) };

    // Status breakdown
    const statusBreakdown = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Position breakdown
    const positionBreakdown = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    // Party breakdown
    const partyBreakdown = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$party.name',
          count: { $sum: 1 }
        }
      }
    ]).sort({ count: -1 }).limit(10);

    // Gender breakdown
    const genderBreakdown = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily registration trend
    const dailyTrend = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      { $limit: 30 }
    ]);

    res.json({
      statusBreakdown: statusBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      positionBreakdown: positionBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      partyBreakdown: partyBreakdown,
      genderBreakdown: genderBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      dailyTrend: dailyTrend.map(day => ({
        date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
        count: day.count
      }))
    });
  } catch (error) {
    console.error('Candidate stats error:', error);
    res.status(500).json({ error: 'Server error fetching candidate statistics' });
  }
});

// Get ballot statistics
router.get('/ballots/stats', verifyToken, async (req, res) => {
  try {
    const { jurisdiction, startDate, endDate } = req.query;

    const matchCriteria = {};
    if (jurisdiction) matchCriteria['jurisdiction.code'] = jurisdiction;
    if (startDate) matchCriteria.createdAt = { ...matchCriteria.createdAt, $gte: new Date(startDate) };
    if (endDate) matchCriteria.createdAt = { ...matchCriteria.createdAt, $lte: new Date(endDate) };

    // Status breakdown
    const statusBreakdown = await Ballot.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$workflow.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Position breakdown
    const positionBreakdown = await Ballot.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    // Jurisdiction breakdown
    const jurisdictionBreakdown = await Ballot.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$jurisdiction.level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average candidates per ballot
    const avgCandidates = await Ballot.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          avgCandidates: { $avg: '$validation.candidateCount' },
          minCandidates: { $min: '$validation.candidateCount' },
          maxCandidates: { $max: '$validation.candidateCount' }
        }
      }
    ]);

    // Validation errors breakdown
    const validationErrors = await Ballot.aggregate([
      { $match: matchCriteria },
      { $unwind: '$validation.errors' },
      {
        $group: {
          _id: '$validation.errors.type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusBreakdown: statusBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      positionBreakdown: positionBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      jurisdictionBreakdown: jurisdictionBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      candidateStats: avgCandidates[0] || { avgCandidates: 0, minCandidates: 0, maxCandidates: 0 },
      validationErrors: validationErrors.reduce((acc, error) => {
        acc[error._id] = error.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Ballot stats error:', error);
    res.status(500).json({ error: 'Server error fetching ballot statistics' });
  }
});

// Get system activity
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, category } = req.query;

    const matchCriteria = {};
    if (startDate) matchCriteria.timestamp = { ...matchCriteria.timestamp, $gte: new Date(startDate) };
    if (endDate) matchCriteria.timestamp = { ...matchCriteria.timestamp, $lte: new Date(endDate) };
    if (category) matchCriteria.category = category;

    const activities = await AuditLog.find(matchCriteria)
      .populate('performedBy', 'username email role jurisdiction')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(matchCriteria);

    // Get activity summary by category
    const categorySummary = await AuditLog.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get top users by activity
    const topUsers = await AuditLog.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$performedBy',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      activities: activities.map(activity => ({
        id: activity._id,
        action: activity.action,
        entityType: activity.entityType,
        performedBy: activity.performedBy,
        description: activity.description,
        category: activity.category,
        severity: activity.severity,
        timestamp: activity.timestamp
      })),
      categorySummary,
      topUsers: topUsers.map(user => ({
        userId: user._id,
        activityCount: user.count,
        lastActivity: user.lastActivity
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: 'Server error fetching system activity' });
  }
});

// Get security dashboard
router.get('/security', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchCriteria = {
      severity: { $in: ['high', 'critical'] }
    };
    
    if (startDate) matchCriteria.timestamp = { ...matchCriteria.timestamp, $gte: new Date(startDate) };
    if (endDate) matchCriteria.timestamp = { ...matchCriteria.timestamp, $lte: new Date(endDate) };

    // Security events by severity
    const severityBreakdown = await AuditLog.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    // Security events by category
    const categoryBreakdown = await AuditLog.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent security events
    const recentEvents = await AuditLog.find(matchCriteria)
      .populate('performedBy', 'username email role jurisdiction')
      .sort({ timestamp: -1 })
      .limit(20);

    // Failed login attempts
    const failedLogins = await AuditLog.countDocuments({
      action: 'user_login',
      'details.error': { $exists: true },
      ...matchCriteria
    });

    // Unauthorized access attempts
    const unauthorizedAccess = await AuditLog.countDocuments({
      action: { $in: ['unauthorized_access', 'permission_denied'] },
      ...matchCriteria
    });

    res.json({
      severityBreakdown: severityBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      categoryBreakdown: categoryBreakdown.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      recentEvents: recentEvents.map(event => ({
        id: event._id,
        action: event.action,
        performedBy: event.performedBy,
        description: event.description,
        severity: event.severity,
        timestamp: event.timestamp,
        requestInfo: event.requestInfo
      })),
      summary: {
        totalSecurityEvents: severityBreakdown.reduce((sum, stat) => sum + stat.count, 0),
        failedLogins,
        unauthorizedAccess
      }
    });
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({ error: 'Server error fetching security dashboard' });
  }
});

// Get jurisdiction-specific data
router.get('/jurisdiction/:code', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { startDate, endDate } = req.query;

    const matchCriteria = { 'jurisdiction.code': code };
    if (startDate) matchCriteria.createdAt = { ...matchCriteria.createdAt, $gte: new Date(startDate) };
    if (endDate) matchCriteria.createdAt = { ...matchCriteria.createdAt, $lte: new Date(endDate) };

    // Candidate statistics for jurisdiction
    const candidateStats = await Candidate.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Ballot statistics for jurisdiction
    const ballotStats = await Ballot.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$workflow.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Position breakdown for jurisdiction
    const positionStats = await Candidate.aggregate([
      { $match: { ...matchCriteria, status: 'approved' } },
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      jurisdiction: code,
      candidates: candidateStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      ballots: ballotStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      positions: positionStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Jurisdiction data error:', error);
    res.status(500).json({ error: 'Server error fetching jurisdiction data' });
  }
});

module.exports = router;