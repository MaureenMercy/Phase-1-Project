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
});