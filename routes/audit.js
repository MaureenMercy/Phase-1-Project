const express = require('express');
const { body, validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const { verifyToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get audit logs with filtering
router.get('/logs', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      entityType,
      entityId,
      action,
      category,
      severity,
      startDate,
      endDate,
      performedBy,
      search
    } = req.query;

    const query = {};
    
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (performedBy) query.performedBy = performedBy;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { description: new RegExp(search, 'i') },
        { action: new RegExp(search, 'i') }
      ];
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'username email role jurisdiction')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs: logs.map(log => ({
        id: log._id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        performedBy: log.performedBy,
        userRole: log.userRole,
        userJurisdiction: log.userJurisdiction,
        description: log.description,
        details: log.details,
        changes: log.changes,
        category: log.category,
        severity: log.severity,
        timestamp: log.timestamp,
        hash: log.hash,
        isTampered: log.isTampered
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Server error fetching audit logs' });
  }
});

// Get audit trail for specific entity
router.get('/trail/:entityType/:entityId', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { startDate, endDate, actions, limit = 100 } = req.query;

    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (actions) options.actions = actions.split(',');
    if (limit) options.limit = parseInt(limit);

    const trail = await AuditLog.getAuditTrail(entityType, entityId, options);

    res.json({
      entityType,
      entityId,
      trail: trail.map(log => ({
        id: log._id,
        action: log.action,
        performedBy: log.performedBy,
        description: log.description,
        details: log.details,
        changes: log.changes,
        timestamp: log.timestamp,
        hash: log.hash,
        isTampered: log.isTampered
      }))
    });
  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({ error: 'Server error fetching audit trail' });
  }
});

// Get audit summary
router.get('/summary', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const summary = await AuditLog.getAuditSummary(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      summary,
      period: {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date()
      }
    });
  } catch (error) {
    console.error('Audit summary error:', error);
    res.status(500).json({ error: 'Server error fetching audit summary' });
  }
});

// Verify audit log integrity
router.get('/verify/:logId', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.logId);
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    const isIntact = log.verifyIntegrity();
    
    res.json({
      logId: log._id,
      isIntact,
      timestamp: log.timestamp,
      hash: log.hash,
      previousHash: log.previousHash
    });
  } catch (error) {
    console.error('Audit verification error:', error);
    res.status(500).json({ error: 'Server error verifying audit log' });
  }
});

// Get security events (high severity logs)
router.get('/security', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = {
      severity: { $in: ['high', 'critical'] }
    };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const securityEvents = await AuditLog.find(query)
      .populate('performedBy', 'username email role jurisdiction')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      securityEvents: securityEvents.map(log => ({
        id: log._id,
        action: log.action,
        entityType: log.entityType,
        performedBy: log.performedBy,
        description: log.description,
        severity: log.severity,
        category: log.category,
        timestamp: log.timestamp,
        requestInfo: log.requestInfo
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Security events error:', error);
    res.status(500).json({ error: 'Server error fetching security events' });
  }
});

// Get user activity
router.get('/user-activity/:userId', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    const query = { performedBy: userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const activities = await AuditLog.find(query)
      .populate('performedBy', 'username email role jurisdiction')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    // Get activity summary
    const summary = await AuditLog.aggregate([
      { $match: { performedBy: userId } },
      {
        $group: {
          _id: {
            action: '$action',
            category: '$category'
          },
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count',
              lastActivity: '$lastActivity'
            }
          },
          totalActions: { $sum: '$count' }
        }
      }
    ]);

    res.json({
      activities: activities.map(log => ({
        id: log._id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        category: log.category,
        severity: log.severity,
        timestamp: log.timestamp
      })),
      summary,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ error: 'Server error fetching user activity' });
  }
});

// Export audit logs
router.get('/export', [
  verifyToken,
  requirePermission('audit_view')
], async (req, res) => {
  try {
    const { format = 'json', startDate, endDate, entityType } = req.query;

    const query = {};
    if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) };
    if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) };
    if (entityType) query.entityType = entityType;

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'username email role jurisdiction')
      .sort({ timestamp: -1 })
      .limit(10000); // Limit for performance

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'Timestamp,Action,Entity Type,Entity ID,Performed By,User Role,Description,Category,Severity,Hash\n';
      const csvData = logs.map(log => 
        `${log.timestamp.toISOString()},${log.action},${log.entityType},${log.entityId},${log.performedBy?.username || 'Unknown'},${log.userRole},"${log.description.replace(/"/g, '""')}",${log.category},${log.severity},${log.hash}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      res.send(csvHeader + csvData);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
      res.json({
        exportDate: new Date().toISOString(),
        totalLogs: logs.length,
        logs: logs.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          performedBy: {
            id: log.performedBy?._id,
            username: log.performedBy?.username,
            email: log.performedBy?.email,
            role: log.performedBy?.role,
            jurisdiction: log.performedBy?.jurisdiction
          },
          description: log.description,
          details: log.details,
          changes: log.changes,
          category: log.category,
          severity: log.severity,
          hash: log.hash,
          isTampered: log.isTampered
        }))
      });
    }
  } catch (error) {
    console.error('Audit export error:', error);
    res.status(500).json({ error: 'Server error exporting audit logs' });
  }
});

module.exports = router;