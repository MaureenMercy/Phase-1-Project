const jsonServer = require('json-server');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'iebc-super-secret-key-2024';

// Access control middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Regional access control (can only access assigned county/constituency)
const requireRegionalAccess = (req, res, next) => {
  if (req.user.role !== 'regional') {
    return next();
  }
  
  const { county, constituency } = req.query;
  if (county && req.user.assignedCounty !== county) {
    return res.status(403).json({ error: 'Access denied to this county' });
  }
  if (constituency && req.user.assignedConstituency !== constituency) {
    return res.status(403).json({ error: 'Access denied to this constituency' });
  }
  next();
};

// Initialize JSON Server
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  const { nationalId, password, biometricData, otp } = req.body;
  
  try {
    // In production, validate against real database
    const user = await validateUser(nationalId, password, biometricData, otp);
    
    if (user) {
      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role, 
          assignedCounty: user.assignedCounty,
          assignedConstituency: user.assignedConstituency,
          permissions: user.permissions 
        }, 
        JWT_SECRET, 
        { expiresIn: '8h' }
      );
      
      res.json({ 
        token, 
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          assignedCounty: user.assignedCounty,
          assignedConstituency: user.assignedConstituency
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Regional dashboard endpoints
app.get('/api/regional/overview', authenticateToken, requireRole(['regional']), requireRegionalAccess, (req, res) => {
  // Return regional overview data
  res.json({
    assignedCounty: req.user.assignedCounty,
    assignedConstituency: req.user.assignedConstituency,
    pollingStations: getPollingStations(req.user.assignedCounty),
    clerkCount: getClerkCount(req.user.assignedCounty),
    deviceStatus: getDeviceStatus(req.user.assignedCounty)
  });
});

app.get('/api/regional/voters', authenticateToken, requireRole(['regional']), requireRegionalAccess, (req, res) => {
  const { county, constituency, ward } = req.query;
  // Return filtered voter data for the region
  res.json(getRegionalVoters(county, constituency, ward));
});

app.post('/api/regional/incidents', authenticateToken, requireRole(['regional']), requireRegionalAccess, (req, res) => {
  const incident = {
    ...req.body,
    reportedBy: req.user.id,
    timestamp: new Date().toISOString(),
    status: 'reported'
  };
  
  // Log incident and notify HQ if critical
  logIncident(incident);
  if (incident.severity === 'critical') {
    notifyHQ(incident);
  }
  
  res.json({ success: true, incidentId: incident.id });
});

// Bomas HQ endpoints
app.get('/api/bomas/results', authenticateToken, requireRole(['bomas', 'executive']), (req, res) => {
  res.json(getNationalResults());
});

app.post('/api/bomas/forms', authenticateToken, requireRole(['bomas', 'executive']), (req, res) => {
  // Process Form 34/35 uploads
  res.json({ success: true, formId: req.body.formId });
});

// Executive dashboard endpoints
app.get('/api/executive/analytics', authenticateToken, requireRole(['executive']), (req, res) => {
  res.json(getExecutiveAnalytics());
});

app.post('/api/executive/emergency', authenticateToken, requireRole(['executive']), (req, res) => {
  // Emergency system controls
  const { action, reason } = req.body;
  executeEmergencyAction(action, reason, req.user.id);
  res.json({ success: true, action, timestamp: new Date().toISOString() });
});

// Judiciary/Electoral Tribunal endpoints
app.get('/api/judiciary/constituencies/:county', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { county } = req.params;
  res.json(getConstituenciesByCounty(county));
});

app.get('/api/judiciary/wards/:constituency', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { constituency } = req.params;
  res.json(getWardsByConstituency(constituency));
});

app.get('/api/judiciary/metrics/:constituency', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { constituency } = req.params;
  res.json(getConstituencyMetrics(constituency));
});

app.get('/api/judiciary/polling-stations/:constituency', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { constituency } = req.params;
  res.json(getPollingStationsForJudiciary(constituency));
});

app.get('/api/judiciary/audit-logs', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { dateRange, actionType, constituency } = req.query;
  res.json(getJudiciaryAuditLogs(dateRange, actionType, constituency));
});

app.post('/api/judiciary/voter-history', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { voterId, caseNumber, constituency } = req.body;
  
  // Validate court order/case number
  if (!caseNumber || !voterId) {
    return res.status(400).json({ error: 'Case number and voter ID required' });
  }
  
  const voterHistory = getVoterHistoryForJudiciary(voterId, caseNumber, constituency);
  res.json(voterHistory);
});

app.get('/api/judiciary/forms/:constituency', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { constituency } = req.params;
  res.json(getFormsForJudiciary(constituency));
});

app.get('/api/judiciary/discrepancies/:constituency', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { constituency } = req.params;
  res.json(getDiscrepanciesForJudiciary(constituency));
});

app.post('/api/judiciary/run-analysis', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { constituency, analysisType } = req.body;
  
  // Log judiciary analysis request
  logJudiciaryAction(req.user.id, 'discrepancy_analysis', `Ran ${analysisType} analysis for ${constituency}`);
  
  const analysisResults = runJudiciaryAnalysis(constituency, analysisType);
  res.json(analysisResults);
});

app.post('/api/judiciary/export-report', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const { reportType, constituency, dateRange, format } = req.body;
  
  // Log judiciary report export
  logJudiciaryAction(req.user.id, 'report_export', `Exported ${reportType} report for ${constituency}`);
  
  const reportData = generateJudiciaryReport(reportType, constituency, dateRange, format);
  res.json(reportData);
});

app.post('/api/judiciary/audit-log', authenticateToken, requireRole(['judiciary']), (req, res) => {
  const auditLog = {
    ...req.body,
    timestamp: new Date().toISOString(),
    judiciaryUser: req.user.id,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  // Store judiciary audit log
  storeJudiciaryAuditLog(auditLog);
  
  res.json({ success: true, logId: auditLog.id });
});

// Real-time updates via WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-region', (data) => {
    socket.join(`region-${data.county}`);
  });
  
  socket.on('join-bomas', () => {
    socket.join('bomas-hq');
  });
  
  socket.on('join-executive', () => {
    socket.join('executive-board');
  });
  
  socket.on('join-judiciary', (data) => {
    socket.join('judiciary-portal');
    console.log(`Judiciary user ${data.userId} joined judiciary portal`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast updates to relevant clients
function broadcastUpdate(channel, data) {
  io.to(channel).emit('update', data);
}

// Helper functions
async function validateUser(nationalId, password, biometricData, otp) {
  // Mock validation - replace with real authentication logic
  const mockUsers = {
    'regional001': {
      id: 'regional001',
      name: 'County Officer - Nairobi',
      role: 'regional',
      assignedCounty: 'Nairobi',
      assignedConstituency: 'Westlands',
      permissions: ['view_voters', 'manage_clerks', 'report_incidents']
    },
    'bomas001': {
      id: 'bomas001',
      name: 'Bomas Control Room Staff',
      role: 'bomas',
      permissions: ['view_results', 'process_forms', 'monitor_alerts']
    },
    'executive001': {
      id: 'executive001',
      name: 'IEBC Commissioner',
      role: 'executive',
      permissions: ['full_access', 'emergency_controls', 'final_approval']
    },
    'judiciary001': {
      id: 'judiciary001',
      name: 'Hon. Justice Sarah Wanjiku',
      role: 'judiciary',
      court: 'Supreme Court of Kenya',
      caseNumber: 'PETITION NO. 1 OF 2024',
      permissions: ['read_only', 'audit_access', 'form_verification', 'report_export']
    }
  };
  
  return mockUsers[nationalId] || null;
}

function getPollingStations(county) {
  // Mock data - replace with real database query
  return [
    { id: 1, name: 'Westlands Primary School', status: 'open', clerks: 3, devices: 2 },
    { id: 2, name: 'Parklands High School', status: 'open', clerks: 4, devices: 3 },
    { id: 3, name: 'Lavington Mall', status: 'closed', clerks: 0, devices: 0 }
  ];
}

function getClerkCount(county) {
  return 15; // Mock data
}

function getDeviceStatus(county) {
  return {
    online: 12,
    offline: 3,
    total: 15
  };
}

function getRegionalVoters(county, constituency, ward) {
  // Mock data - replace with real database query
  return {
    total: 45000,
    registered: 42000,
    voted: 38000,
    turnout: 90.5
  };
}

function logIncident(incident) {
  console.log('Incident logged:', incident);
  // In production, save to database
}

function notifyHQ(incident) {
  broadcastUpdate('bomas-hq', { type: 'critical_incident', incident });
}

function getNationalResults() {
  // Mock national results
  return {
    president: { total: 15000000, processed: 12000000, percentage: 80 },
    governor: { total: 15000000, processed: 11500000, percentage: 76.7 },
    mp: { total: 15000000, processed: 11800000, percentage: 78.7 }
  };
}

function getExecutiveAnalytics() {
  return {
    nationalTurnout: 78.5,
    riskZones: ['Nairobi West', 'Mombasa Central'],
    legalDisputes: 12,
    systemHealth: 'excellent'
  };
}

function executeEmergencyAction(action, reason, userId) {
  console.log(`Emergency action ${action} executed by ${userId}: ${reason}`);
  // In production, implement actual emergency controls
}

// Judiciary Helper Functions
function getConstituenciesByCounty(county) {
  const constituencies = {
    'nairobi': [
      { value: 'westlands', name: 'Westlands' },
      { value: 'dagoretti', name: 'Dagoretti' },
      { value: 'langata', name: 'Langata' },
      { value: 'kibra', name: 'Kibra' }
    ],
    'mombasa': [
      { value: 'mvita', name: 'Mvita' },
      { value: 'changamwe', name: 'Changamwe' },
      { value: 'jomvu', name: 'Jomvu' }
    ]
  };
  return constituencies[county] || [];
}

function getWardsByConstituency(constituency) {
  const wards = {
    'westlands': [
      { value: 'westlands', name: 'Westlands' },
      { value: 'parklands', name: 'Parklands' },
      { value: 'lavington', name: 'Lavington' }
    ],
    'mvita': [
      { value: 'mvita', name: 'Mvita' },
      { value: 'tudor', name: 'Tudor' }
    ]
  };
  return wards[constituency] || [];
}

function getConstituencyMetrics(constituency) {
  const metrics = {
    'westlands': { totalVoters: 45000, castVotes: 38000, turnout: 84.4, pollingStations: 15 },
    'mvita': { totalVoters: 32000, castVotes: 26800, turnout: 83.8, pollingStations: 12 }
  };
  return metrics[constituency] || { totalVoters: 0, castVotes: 0, turnout: 0, pollingStations: 0 };
}

function getPollingStationsForJudiciary(constituency) {
  const stations = {
    'westlands': [
      {
        id: 'PS001',
        name: 'Westlands Primary School',
        address: 'Westlands, Nairobi',
        status: 'active',
        totalVoters: 2500,
        castVotes: 1800,
        turnout: 72.0,
        lastSync: '2024-08-09T14:30:00.000Z'
      },
      {
        id: 'PS002',
        name: 'Parklands High School',
        address: 'Parklands, Nairobi',
        status: 'active',
        totalVoters: 1800,
        castVotes: 1350,
        turnout: 75.0,
        lastSync: '2024-08-09T14:25:00.000Z'
      }
    ]
  };
  return stations[constituency] || [];
}

function getJudiciaryAuditLogs(dateRange, actionType, constituency) {
  // Mock judiciary audit logs
  return [
    {
      id: 'AUD001',
      timestamp: '2024-08-09T08:00:00.000Z',
      user: 'judiciary001',
      action: 'login',
      details: 'Judiciary user logged in via biometric authentication',
      constituency: constituency
    },
    {
      id: 'AUD002',
      timestamp: '2024-08-09T08:05:00.000Z',
      user: 'judiciary001',
      action: 'data_access',
      details: `Accessed ${constituency} Constituency data`,
      constituency: constituency
    }
  ];
}

function getVoterHistoryForJudiciary(voterId, caseNumber, constituency) {
  // Mock voter history for judiciary
  return [
    {
      id: voterId,
      name: 'John Doe',
      registrationLocation: 'Westlands Primary School',
      voteStatus: 'cast',
      votingTime: '2024-08-09T10:30:00.000Z',
      objections: [],
      caseNumber: caseNumber,
      constituency: constituency
    }
  ];
}

function getFormsForJudiciary(constituency) {
  const forms = {
    'westlands': [
      {
        id: 'FORM001',
        type: '34A',
        stationName: 'Westlands Primary School',
        uploadTime: '2024-08-09T17:30:00.000Z',
        clerkId: 'CLK001',
        clerkName: 'Alice Wanjiku',
        deviceId: 'TAB001',
        totalVotes: 1800,
        validVotes: 1780,
        rejectedVotes: 20,
        status: 'active'
      }
    ]
  };
  return forms[constituency] || [];
}

function getDiscrepanciesForJudiciary(constituency) {
  const discrepancies = {
    'westlands': [
      {
        type: 'vote_count_mismatch',
        priority: 'high',
        description: 'Discrepancy detected in Form 34B from Parklands High School - vote count mismatch of 15 votes',
        station: 'Parklands High School',
        formId: 'FORM002'
      }
    ]
  };
  return discrepancies[constituency] || [];
}

function runJudiciaryAnalysis(constituency, analysisType) {
  // Mock AI analysis for judiciary
  return {
    constituency: constituency,
    analysisType: analysisType,
    timestamp: new Date().toISOString(),
    findings: [
      {
        type: 'vote_count_mismatch',
        priority: 'high',
        description: 'Discrepancy detected in vote counting',
        recommendation: 'Manual recount recommended'
      }
    ],
    confidence: 0.95
  };
}

function generateJudiciaryReport(reportType, constituency, dateRange, format) {
  // Mock report generation for judiciary
  return {
    reportId: 'REP-' + Date.now(),
    reportType: reportType,
    constituency: constituency,
    dateRange: dateRange,
    format: format,
    generatedAt: new Date().toISOString(),
    downloadUrl: `/reports/judiciary/${reportType}-${constituency}.pdf`,
    blockchainId: 'BLOCK-' + Math.random().toString(36).substr(2, 9),
    hashSignature: 'SHA256-' + Math.random().toString(36).substr(2, 9)
  };
}

function logJudiciaryAction(userId, action, details) {
  console.log(`Judiciary action logged: ${action} by ${userId} - ${details}`);
  // In production, store in database
}

function storeJudiciaryAuditLog(auditLog) {
  console.log('Judiciary audit log stored:', auditLog);
  // In production, store in database
}

// Use JSON Server for data operations
app.use('/api/data', middlewares, router);

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`IEBC Electoral System API running on port ${port}`);
  console.log(`WebSocket server active`);
  console.log(`Regional Admin: http://localhost:${port}/regional-admin-portal.html`);
  console.log(`Bomas HQ: http://localhost:${port}/bomas-hq-portal.html`);
  console.log(`Executive Board: http://localhost:${port}/board-executive-portal.html`);
  console.log(`Judiciary Portal: http://localhost:${port}/judiciary-portal.html`);
});