// Regional IEBC Admin Portal - JavaScript
// Handles authentication, navigation, and functionality for County/Constituency Management

// Global state management
let currentUser = null;
let currentSection = 'overview';
let biometricVerified = false;
let otpSent = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize application
function initializeApplication() {
    console.log('Regional IEBC Admin Portal initialized');
    
    // Setup navigation
    setupNavigation();
    
    // Setup authentication
    setupAuthentication();
    
    // Setup dashboard functionality
    setupDashboardFeatures();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // Login form
    const loginForm = document.getElementById('regional-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            navigateToSection(targetSection);
        });
    });
}

// Navigate to section
function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Update navigation active state
        updateNavActiveState(sectionId);
        
        // Load section-specific data
        loadSectionData(sectionId);
    }
}

// Update navigation active state
function updateNavActiveState(activeSectionId) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current nav link
    const activeNavLink = document.querySelector(`[data-section="${activeSectionId}"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
}

// Setup authentication
function setupAuthentication() {
    // Biometric scan simulation
    window.simulateBiometricScan = function() {
        const scanButton = document.querySelector('.biometric-scanner button');
        const statusDiv = document.getElementById('biometric-status');
        
        scanButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Scanning...';
        scanButton.disabled = true;
        
        setTimeout(() => {
            biometricVerified = true;
            scanButton.innerHTML = '<i class="fas fa-check me-2"></i>Scan Complete';
            scanButton.classList.remove('btn-light');
            scanButton.classList.add('btn-success');
            statusDiv.style.display = 'block';
            showMessage('Biometric verification successful!', 'success');
        }, 2000);
    };
    
    // OTP sending simulation
    window.sendOTP = function() {
        const nationalId = document.getElementById('national-id').value;
        if (!nationalId) {
            showMessage('Please enter your National ID first', 'error');
            return;
        }
        
        otpSent = true;
        showMessage('OTP sent to your registered mobile number', 'success');
        
        // Simulate OTP (for demo purposes)
        setTimeout(() => {
            document.getElementById('otp-code').value = '123456';
            showMessage('Demo OTP: 123456', 'info');
        }, 1000);
    };
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const nationalId = document.getElementById('national-id').value;
    const countyAssignment = document.getElementById('county-assignment').value;
    const accessBadge = document.getElementById('access-badge').value;
    const otpCode = document.getElementById('otp-code').value;
    
    // Validate required fields
    if (!nationalId || !countyAssignment || !biometricVerified || !otpCode) {
        showMessage('Please complete all authentication steps', 'error');
        return;
    }
    
    // Simulate authentication process
    const loginButton = document.querySelector('#regional-login-form button[type="submit"]');
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Authenticating...';
    loginButton.disabled = true;
    
    setTimeout(() => {
        // Simulate successful authentication
        currentUser = {
            type: 'regional_officer',
            nationalId: nationalId,
            county: countyAssignment,
            accessBadge: accessBadge,
            name: 'John Doe', // Would come from database
            authenticated: true,
            loginTime: new Date()
        };
        
        showDashboard();
        showMessage('Authentication successful! Welcome to Regional Admin Portal', 'success');
        
        // Log successful login
        logActivity('Successful login', 'authentication', 'success');
        
    }, 2000);
}

// Show dashboard
function showDashboard() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('main-dashboard').classList.remove('d-none');
    
    // Update user information
    document.getElementById('assigned-county').textContent = currentUser.county.charAt(0).toUpperCase() + currentUser.county.slice(1) + ' County';
    document.getElementById('officer-name').textContent = currentUser.name;
    
    // Load initial dashboard data
    loadDashboardData();
}

// Load dashboard data
function loadDashboardData() {
    // Simulate loading real-time data
    loadPollingStationData();
    loadClerkData();
    loadVoterData();
    loadIncidentData();
    loadAnalyticsData();
}

// Setup dashboard features
function setupDashboardFeatures() {
    // Setup polling station monitor
    setupPollingStationMonitor();
    
    // Setup clerk deployment
    setupClerkDeployment();
    
    // Setup voter roll verification
    setupVoterRoll();
    
    // Setup form upload monitor
    setupFormUploadMonitor();
    
    // Setup incident reporting
    setupIncidentReporting();
    
    // Setup analytics
    setupAnalytics();
}

// Setup polling station monitor
function setupPollingStationMonitor() {
    // Real-time polling station updates
    setInterval(() => {
        if (currentSection === 'polling-monitor') {
            updatePollingStationStatus();
        }
    }, 30000); // Update every 30 seconds
}

// Update polling station status
function updatePollingStationStatus() {
    // Simulate real-time updates
    const stationCells = document.querySelectorAll('.station-cell');
    stationCells.forEach(cell => {
        // Randomly update some stations (simulation)
        if (Math.random() < 0.1) { // 10% chance of status change
            const statuses = ['station-open', 'station-delayed', 'station-closed'];
            const statusTexts = ['Open', 'Delayed', 'Offline'];
            const randomStatus = Math.floor(Math.random() * statuses.length);
            
            cell.className = `station-cell ${statuses[randomStatus]}`;
            cell.innerHTML = cell.innerHTML.split('<br>')[0] + '<br>' + statusTexts[randomStatus];
        }
    });
}

// Setup clerk deployment
function setupClerkDeployment() {
    // Add clerk functionality
    const addClerkForms = document.querySelectorAll('#clerk-deployment form');
    addClerkForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewClerk(form);
        });
    });
}

// Add new clerk
function addNewClerk(form) {
    const formData = new FormData(form);
    const clerkData = {
        name: formData.get('name') || form.querySelector('input[placeholder="Enter full name"]').value,
        id: formData.get('id') || form.querySelector('input[placeholder="ID number"]').value,
        phone: formData.get('phone') || form.querySelector('input[placeholder="Phone number"]').value,
        station: formData.get('station') || form.querySelector('select').value
    };
    
    if (!clerkData.name || !clerkData.id || !clerkData.phone || !clerkData.station) {
        showMessage('Please fill in all clerk details', 'error');
        return;
    }
    
    // Simulate adding clerk to system
    showMessage(`Clerk ${clerkData.name} added to ${clerkData.station}`, 'success');
    
    // Clear form
    form.reset();
    
    // Log activity
    logActivity(`Added new clerk: ${clerkData.name}`, 'clerk_management', 'success');
}

// Setup voter roll verification
function setupVoterRoll() {
    const voterSearchForms = document.querySelectorAll('#voter-roll form');
    voterSearchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            searchVoter(form);
        });
    });
}

// Search voter
function searchVoter(form) {
    const searchType = form.querySelector('select').value;
    const searchTerm = form.querySelector('input[placeholder="Enter search term"]').value;
    
    if (!searchTerm) {
        showMessage('Please enter a search term', 'error');
        return;
    }
    
    // Simulate voter search
    showMessage('Searching voter database...', 'info');
    
    setTimeout(() => {
        // Simulate found voter
        const voterInfo = {
            name: 'John Doe',
            id: '12345678',
            station: 'Kenyatta Primary',
            status: 'Verified',
            voted: 'Not Yet',
            assistance: 'None Required'
        };
        
        // Update voter information display
        updateVoterDisplay(voterInfo);
        showMessage('Voter found in database', 'success');
        
        // Log activity
        logActivity(`Voter search: ${searchTerm}`, 'voter_verification', 'success');
    }, 1000);
}

// Update voter display
function updateVoterDisplay(voterInfo) {
    const voterTable = document.querySelector('#voter-roll .table');
    if (voterTable) {
        const rows = voterTable.querySelectorAll('tbody tr');
        rows[0].children[1].textContent = voterInfo.name;
        rows[1].children[1].textContent = voterInfo.id;
        rows[2].children[1].textContent = voterInfo.station;
        // Update other fields...
    }
}

// Setup form upload monitor
function setupFormUploadMonitor() {
    // Setup form verification buttons
    const verifyButtons = document.querySelectorAll('#form-upload .btn-outline-success');
    verifyButtons.forEach(button => {
        if (button.textContent.includes('Match')) {
            button.addEventListener('click', (e) => {
                verifyFormMatch(e.target);
            });
        }
    });
    
    // Setup flag HQ buttons
    const flagButtons = document.querySelectorAll('#form-upload .btn-outline-danger');
    flagButtons.forEach(button => {
        if (button.textContent.includes('Flag HQ')) {
            button.addEventListener('click', (e) => {
                flagToHQ(e.target);
            });
        }
    });
}

// Verify form match
function verifyFormMatch(button) {
    const row = button.closest('tr');
    const station = row.cells[0].textContent;
    
    showMessage(`Verifying forms for ${station}...`, 'info');
    
    setTimeout(() => {
        showMessage(`Forms verified for ${station}`, 'success');
        
        // Update verification status
        const verificationCell = row.cells[4];
        verificationCell.innerHTML = '<span class="badge bg-success">Verified</span>';
        
        // Log activity
        logActivity(`Form verification: ${station}`, 'form_verification', 'success');
    }, 1000);
}

// Flag to HQ
function flagToHQ(button) {
    const row = button.closest('tr');
    const station = row.cells[0].textContent;
    
    const reason = prompt(`Reason for flagging ${station} to HQ:`);
    if (reason) {
        showMessage(`${station} flagged to HQ: ${reason}`, 'warning');
        
        // Log activity
        logActivity(`Flagged to HQ: ${station} - ${reason}`, 'escalation', 'warning');
    }
}

// Setup incident reporting
function setupIncidentReporting() {
    const incidentForms = document.querySelectorAll('#incidents form');
    incidentForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            reportIncident(form);
        });
    });
}

// Report incident
function reportIncident(form) {
    const formData = new FormData(form);
    const incidentData = {
        type: form.querySelector('select').value,
        station: form.querySelectorAll('select')[1].value,
        description: form.querySelector('textarea').value,
        evidence: form.querySelector('input[type="file"]').files[0]
    };
    
    if (!incidentData.type || !incidentData.station || !incidentData.description) {
        showMessage('Please fill in all incident details', 'error');
        return;
    }
    
    // Simulate incident reporting
    showMessage('Reporting incident...', 'info');
    
    setTimeout(() => {
        showMessage('Incident reported successfully', 'success');
        
        // Clear form
        form.reset();
        
        // Add to incident log
        addToIncidentLog(incidentData);
        
        // Log activity
        logActivity(`Incident reported: ${incidentData.type} at ${incidentData.station}`, 'incident_reporting', 'warning');
    }, 1000);
}

// Add to incident log
function addToIncidentLog(incidentData) {
    const incidentLog = document.querySelector('.incident-log');
    if (incidentLog) {
        const incidentHTML = `
            <div class="incident-item p-3 mb-3 border rounded">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6><span class="incident-tag incident-critical">Critical</span> ${incidentData.type}</h6>
                        <p class="mb-1">${incidentData.description}</p>
                        <small class="text-muted">Reported by: ${currentUser.name} | Just now</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary">View Details</button>
                        <button class="btn btn-sm btn-outline-danger">Escalate</button>
                    </div>
                </div>
            </div>
        `;
        incidentLog.insertAdjacentHTML('afterbegin', incidentHTML);
    }
}

// Setup analytics
function setupAnalytics() {
    // Load analytics data
    loadAnalyticsData();
    
    // Setup chart if canvas exists
    const chartCanvas = document.getElementById('turnoutChart');
    if (chartCanvas) {
        setupTurnoutChart();
    }
}

// Load analytics data
function loadAnalyticsData() {
    // Simulate loading analytics data
    setTimeout(() => {
        updateAnalyticsMetrics();
    }, 1000);
}

// Update analytics metrics
function updateAnalyticsMetrics() {
    // Simulate real-time metrics updates
    const metrics = {
        turnout: Math.floor(Math.random() * 20) + 60, // 60-80%
        offline: Math.floor(Math.random() * 3) + 1,   // 1-3 stations
        formsUploaded: Math.floor(Math.random() * 10) + 90, // 90-100%
        clerkIssues: Math.floor(Math.random() * 5) + 1  // 1-5 issues
    };
    
    // Update metric displays
    const metricCards = document.querySelectorAll('#analytics .metric-value');
    if (metricCards.length >= 4) {
        metricCards[0].textContent = metrics.turnout + '%';
        metricCards[1].textContent = metrics.offline;
        metricCards[2].textContent = metrics.formsUploaded + '%';
        metricCards[3].textContent = metrics.clerkIssues;
    }
}

// Setup turnout chart
function setupTurnoutChart() {
    // Simple chart implementation (would use Chart.js in production)
    const canvas = document.getElementById('turnoutChart');
    const ctx = canvas.getContext('2d');
    
    // Simple bar chart simulation
    ctx.fillStyle = '#3498db';
    ctx.fillRect(50, 50, 30, 100);
    ctx.fillRect(100, 70, 30, 80);
    ctx.fillRect(150, 40, 30, 110);
    ctx.fillRect(200, 60, 30, 90);
    ctx.fillRect(250, 50, 30, 100);
    
    // Add labels
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('Ward 1', 45, 170);
    ctx.fillText('Ward 2', 95, 170);
    ctx.fillText('Ward 3', 145, 170);
    ctx.fillText('Ward 4', 195, 170);
    ctx.fillText('Ward 5', 245, 170);
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'clerk-deployment':
            loadClerkData();
            break;
        case 'polling-monitor':
            loadPollingStationData();
            break;
        case 'voter-roll':
            loadVoterData();
            break;
        case 'form-upload':
            loadFormUploadData();
            break;
        case 'incidents':
            loadIncidentData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// Load overview data
function loadOverviewData() {
    // Simulate loading overview data
    console.log('Loading overview data...');
}

// Load clerk data
function loadClerkData() {
    // Simulate loading clerk data
    console.log('Loading clerk data...');
}

// Load polling station data
function loadPollingStationData() {
    // Simulate loading polling station data
    console.log('Loading polling station data...');
}

// Load voter data
function loadVoterData() {
    // Simulate loading voter data
    console.log('Loading voter data...');
}

// Load form upload data
function loadFormUploadData() {
    // Simulate loading form upload data
    console.log('Loading form upload data...');
}

// Load incident data
function loadIncidentData() {
    // Simulate loading incident data
    console.log('Loading incident data...');
}

// Check authentication status
function checkAuthStatus() {
    // Check if user is already authenticated (from localStorage/sessionStorage)
    const savedAuth = localStorage.getItem('regionalAuth');
    if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.authenticated && new Date() - new Date(authData.loginTime) < 8 * 60 * 60 * 1000) {
            // Session valid for 8 hours
            currentUser = authData;
            showDashboard();
        } else {
            // Session expired
            localStorage.removeItem('regionalAuth');
        }
    }
}

// Log activity
function logActivity(action, category, level) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.name : 'Anonymous',
        action: action,
        category: category,
        level: level,
        county: currentUser ? currentUser.county : 'Unknown'
    };
    
    console.log('Activity Log:', logEntry);
    
    // In production, this would send to the server
    // sendToServer('/api/logs', logEntry);
}

// Show message
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.minWidth = '300px';
    
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('regionalAuth');
    
    // Show auth section
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('main-dashboard').classList.add('d-none');
    
    // Reset forms
    document.getElementById('regional-login-form').reset();
    biometricVerified = false;
    otpSent = false;
    
    // Reset biometric button
    const biometricButton = document.querySelector('.biometric-scanner button');
    if (biometricButton) {
        biometricButton.innerHTML = '<i class="fas fa-hand-paper me-2"></i>Scan Fingerprint';
        biometricButton.classList.remove('btn-success');
        biometricButton.classList.add('btn-light');
        biometricButton.disabled = false;
    }
    
    // Hide biometric status
    const biometricStatus = document.getElementById('biometric-status');
    if (biometricStatus) {
        biometricStatus.style.display = 'none';
    }
    
    showMessage('Logged out successfully', 'success');
}

// Save authentication state
function saveAuthState() {
    if (currentUser) {
        localStorage.setItem('regionalAuth', JSON.stringify(currentUser));
    }
}

// Set up periodic data refresh
setInterval(() => {
    if (currentUser && currentUser.authenticated) {
        // Refresh current section data
        loadSectionData(currentSection);
        
        // Save auth state
        saveAuthState();
    }
}, 60000); // Refresh every minute

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, save state
        saveAuthState();
    } else {
        // Page is visible, refresh data
        if (currentUser && currentUser.authenticated) {
            loadSectionData(currentSection);
        }
    }
});

// Handle beforeunload event
window.addEventListener('beforeunload', () => {
    saveAuthState();
});

// Export functions for global access
window.regionalAdmin = {
    logout,
    navigateToSection,
    showMessage,
    logActivity
};