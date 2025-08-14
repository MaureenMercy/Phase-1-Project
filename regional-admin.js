// Regional IEBC Admin Portal - JavaScript
// Handles authentication, navigation, and functionality for County/Constituency Management

// Global state management
let currentUser = null;
let currentSection = 'overview';
let biometricVerified = false;
let otpSent = false;
let socket = null;
let charts = {};

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
    
    // Initialize WebSocket connection
    initializeWebSocket();
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
    
    // Biometric simulation
    const biometricScanner = document.querySelector('.biometric-scanner');
    if (biometricScanner) {
        biometricScanner.addEventListener('click', simulateBiometricScan);
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
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
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
    // Check if user is already authenticated
    const token = localStorage.getItem('regional_token');
    if (token) {
        // Validate token and get user info
        validateToken(token);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const nationalId = document.getElementById('national-id').value;
    const password = document.getElementById('password').value;
    const otp = document.getElementById('otp').value;
    
    if (!biometricVerified) {
        alert('Please complete biometric verification first');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nationalId,
                password,
                biometricData: 'verified',
                otp
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('regional_token', data.token);
            currentUser = data.user;
            
            // Show dashboard
            showDashboard();
            
            // Join regional WebSocket room
            if (socket) {
                socket.emit('join-region', { county: currentUser.assignedCounty });
            }
            
        } else {
            const error = await response.json();
            alert(`Login failed: ${error.error}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Simulate biometric scan
function simulateBiometricScan() {
    const scanner = document.querySelector('.scanner-animation');
    const status = document.querySelector('.biometric-scanner p');
    
    scanner.style.animation = 'none';
    scanner.style.borderTopColor = '#28a745';
    
    setTimeout(() => {
        biometricVerified = true;
        status.innerHTML = '<i class="fas fa-check-circle text-success"></i> Biometric verified successfully';
        status.style.color = '#28a745';
    }, 2000);
}

// Validate token
async function validateToken(token) {
    try {
        // In production, validate token with server
        // For now, use mock validation
        const mockUser = {
            id: 'regional001',
            name: 'County Officer - Nairobi',
            role: 'regional',
            assignedCounty: 'Nairobi',
            assignedConstituency: 'Westlands'
        };
        
        currentUser = mockUser;
        showDashboard();
        
    } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('regional_token');
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('dashboard').classList.remove('d-none');
    
    // Update header information
    updateHeaderInfo();
    
    // Load initial data
    loadSectionData('overview');
}

// Update header information
function updateHeaderInfo() {
    if (currentUser) {
        document.getElementById('user-county').textContent = currentUser.assignedCounty;
        document.getElementById('header-county').textContent = currentUser.assignedCounty;
        document.getElementById('header-constituency').textContent = currentUser.assignedConstituency;
        document.getElementById('current-user').textContent = currentUser.name;
    }
}

// Load section data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'clerks':
            loadClerksData();
            break;
        case 'stations':
            loadStationsData();
            break;
        case 'voters':
            loadVotersData();
            break;
        case 'forms':
            loadFormsData();
            break;
        case 'incidents':
            loadIncidentsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// Load overview data
async function loadOverviewData() {
    try {
        const response = await fetch(`/api/regional/overview?county=${currentUser.assignedCounty}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('regional_token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateOverviewDisplay(data);
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
        // Use mock data for demo
        updateOverviewDisplay(getMockOverviewData());
    }
}

// Load clerks data
async function loadClerksData() {
    try {
        // Load clerks from database
        const response = await fetch('/api/data/clerks');
        if (response.ok) {
            const clerks = await response.json();
            const regionalClerks = clerks.filter(clerk => 
                clerk.county === currentUser.assignedCounty
            );
            updateClerksDisplay(regionalClerks);
        }
    } catch (error) {
        console.error('Error loading clerks data:', error);
        updateClerksDisplay(getMockClerksData());
    }
}

// Load stations data
async function loadStationsData() {
    try {
        const response = await fetch('/api/data/pollingStations');
        if (response.ok) {
            const stations = await response.json();
            const regionalStations = stations.filter(station => 
                station.county === currentUser.assignedCounty
            );
            updateStationsDisplay(regionalStations);
        }
    } catch (error) {
        console.error('Error loading stations data:', error);
        updateStationsDisplay(getMockStationsData());
    }
}

// Load voters data
async function loadVotersData() {
    try {
        const response = await fetch('/api/data/voters');
        if (response.ok) {
            const voters = await response.json();
            const regionalVoters = voters.filter(voter => 
                voter.county === currentUser.assignedCounty
            );
            updateVotersDisplay(regionalVoters);
            
            // Populate ward filter
            populateWardFilter(regionalVoters);
        }
    } catch (error) {
        console.error('Error loading voters data:', error);
        updateVotersDisplay(getMockVotersData());
    }
}

// Load forms data
async function loadFormsData() {
    try {
        const response = await fetch('/api/data/forms');
        if (response.ok) {
            const forms = await response.json();
            const regionalForms = forms.filter(form => 
                form.county === currentUser.assignedCounty
            );
            updateFormsDisplay(regionalForms);
        }
    } catch (error) {
        console.error('Error loading forms data:', error);
        updateFormsDisplay(getMockFormsData());
    }
}

// Load incidents data
async function loadIncidentsData() {
    try {
        const response = await fetch('/api/data/incidents');
        if (response.ok) {
            const incidents = await response.json();
            const regionalIncidents = incidents.filter(incident => 
                incident.county === currentUser.assignedCounty
            );
            updateIncidentsDisplay(regionalIncidents);
        }
    } catch (error) {
        console.error('Error loading incidents data:', error);
        updateIncidentsDisplay(getMockIncidentsData());
    }
}

// Load analytics data
async function loadAnalyticsData() {
    try {
        // Load analytics data
        updateAnalyticsDisplay(getMockAnalyticsData());
        
        // Initialize charts
        initializeCharts();
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Update overview display
function updateOverviewDisplay(data) {
    // Update metrics
    document.getElementById('total-positions').textContent = data.positions?.length || 6;
    document.getElementById('approved-candidates').textContent = data.approvedCandidates || 12;
    document.getElementById('ballot-status').textContent = data.ballotStatus || '85%';
    
    // Update positions table
    updatePositionsTable(data.positions || getMockPositions());
    
    // Update updates list
    updateUpdatesList(data.updates || getMockUpdates());
}

// Update positions table
function updatePositionsTable(positions) {
    const tbody = document.getElementById('positions-table');
    if (!tbody) return;
    
    tbody.innerHTML = positions.map(pos => `
        <tr>
            <td>${pos.name}</td>
            <td><span class="badge bg-${pos.status === 'active' ? 'success' : 'info'}">${pos.status}</span></td>
            <td>${pos.candidates}</td>
        </tr>
    `).join('');
}

// Update updates list
function updateUpdatesList(updates) {
    const container = document.getElementById('updates-list');
    if (!container) return;
    
    container.innerHTML = updates.map(update => `
        <div class="alert alert-${update.type === 'warning' ? 'warning' : 'info'} alert-sm">
            <i class="fas fa-${update.type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${update.message}
        </div>
    `).join('');
}

// Update clerks display
function updateClerksDisplay(clerks) {
    const container = document.getElementById('clerks-list');
    if (!container) return;
    
    container.innerHTML = clerks.map(clerk => `
        <div class="clerk-card">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h6 class="mb-1">${clerk.name}</h6>
                    <small class="text-muted">ID: ${clerk.nationalId} | Phone: ${clerk.phone}</small>
                    <br>
                    <small class="text-muted">Station: ${clerk.assignedStation}</small>
                </div>
                <div class="col-md-4 text-end">
                    <span class="badge bg-${clerk.status === 'active' ? 'success' : 'warning'}">${clerk.status}</span>
                    <br>
                    <small class="text-muted">Training: ${clerk.trainingCompleted ? '✓' : '✗'}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update deployment checklist
    updateDeploymentChecklist(clerks);
}

// Update deployment checklist
function updateDeploymentChecklist(clerks) {
    const container = document.getElementById('deployment-checklist');
    if (!container) return;
    
    const totalClerks = clerks.length;
    const trainedClerks = clerks.filter(c => c.trainingCompleted).length;
    const checkedInClerks = clerks.filter(c => c.checkInTime).length;
    
    container.innerHTML = `
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Total Clerks:</span>
                <span class="fw-bold">${totalClerks}</span>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Training Complete:</span>
                <span class="fw-bold text-${trainedClerks === totalClerks ? 'success' : 'warning'}">${trainedClerks}/${totalClerks}</span>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Checked In:</span>
                <span class="fw-bold text-${checkedInClerks === totalClerks ? 'success' : 'info'}">${checkedInClerks}/${totalClerks}</span>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-outline-primary btn-sm w-100" onclick="generateDeploymentList()">
                <i class="fas fa-download me-2"></i> Generate List
            </button>
        </div>
    `;
}

// Update stations display
function updateStationsDisplay(stations) {
    // Update heatmap
    updateStationsHeatmap(stations);
    
    // Update alerts
    updateStationAlerts(stations);
    
    // Update detailed table
    updateStationsTable(stations);
}

// Update stations heatmap
function updateStationsHeatmap(stations) {
    const container = document.getElementById('stations-heatmap');
    if (!container) return;
    
    container.innerHTML = stations.map(station => `
        <div class="station-cell station-${station.status}" title="${station.name}">
            ${station.name.split(' ')[0]}<br>
            <small>${station.status}</small>
        </div>
    `).join('');
}

// Update station alerts
function updateStationAlerts(stations) {
    const container = document.getElementById('station-alerts');
    if (!container) return;
    
    const alerts = [];
    
    // Check for offline stations
    const offlineStations = stations.filter(s => !s.isOnline);
    if (offlineStations.length > 0) {
        alerts.push({
            type: 'danger',
            message: `${offlineStations.length} station(s) offline`,
            icon: 'exclamation-triangle'
        });
    }
    
    // Check for no activity stations
    const noActivityStations = stations.filter(s => {
        if (!s.lastSync) return true;
        const lastSync = new Date(s.lastSync);
        const now = new Date();
        const hoursDiff = (now - lastSync) / (1000 * 60 * 60);
        return hoursDiff > 2;
    });
    
    if (noActivityStations.length > 0) {
        alerts.push({
            type: 'warning',
            message: `${noActivityStations.length} station(s) no activity`,
            icon: 'clock'
        });
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert alert-${alert.type} alert-sm">
            <i class="fas fa-${alert.icon} me-2"></i>
            ${alert.message}
        </div>
    `).join('');
}

// Update stations table
function updateStationsTable(stations) {
    const tbody = document.getElementById('stations-table');
    if (!tbody) return;
    
    tbody.innerHTML = stations.map(station => `
        <tr>
            <td>${station.name}</td>
            <td>
                <span class="badge bg-${station.status === 'open' ? 'success' : station.status === 'closed' ? 'danger' : 'warning'}">
                    ${station.status}
                </span>
            </td>
            <td>${station.clerks?.length || 0}</td>
            <td>${station.devices?.length || 0}</td>
            <td>${station.turnout?.toFixed(1) || 0}%</td>
            <td>${station.lastSync ? new Date(station.lastSync).toLocaleTimeString() : 'Never'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewStationDetails('${station.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update voters display
function updateVotersDisplay(voters) {
    const container = document.getElementById('voter-results');
    if (!container) return;
    
    container.innerHTML = `
        <div class="row">
            <div class="col-md-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Found ${voters.length} voters in your region. Use the search filters above to narrow down results.
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>ID</th>
                                <th>Ward</th>
                                <th>Station</th>
                                <th>Status</th>
                                <th>Voted</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${voters.slice(0, 10).map(voter => `
                                <tr>
                                    <td>${voter.name}</td>
                                    <td>${voter.id}</td>
                                    <td>${voter.ward}</td>
                                    <td>${voter.pollingStation}</td>
                                    <td>
                                        <span class="badge bg-${voter.status === 'Active' ? 'success' : 'warning'}">
                                            ${voter.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge bg-${voter.hasVoted ? 'success' : 'secondary'}">
                                            ${voter.hasVoted ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Populate ward filter
function populateWardFilter(voters) {
    const wardFilter = document.getElementById('ward-filter');
    if (!wardFilter) return;
    
    const wards = [...new Set(voters.map(v => v.ward))];
    wardFilter.innerHTML = '<option value="">All Wards</option>' + 
        wards.map(ward => `<option value="${ward}">${ward}</option>`).join('');
}

// Search voters
function searchVoters() {
    const searchTerm = document.getElementById('voter-search').value;
    const wardFilter = document.getElementById('ward-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    // Implement search logic
    console.log('Searching voters:', { searchTerm, wardFilter, statusFilter });
    
    // For demo, just reload voters
    loadVotersData();
}

// Update forms display
function updateFormsDisplay(forms) {
    // Update upload status
    updateFormUploadStatus(forms);
    
    // Update verification required
    updateFormsVerification(forms);
    
    // Update photo viewer
    updateFormPhotoViewer(forms);
}

// Update form upload status
function updateFormUploadStatus(forms) {
    const container = document.getElementById('form-upload-status');
    if (!container) return;
    
    const totalForms = forms.length;
    const uploadedForms = forms.filter(f => f.status === 'uploaded').length;
    const verifiedForms = forms.filter(f => f.verificationStatus === 'verified').length;
    
    container.innerHTML = `
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Form 34A (President):</span>
                <span class="fw-bold">${uploadedForms}/${totalForms}</span>
            </div>
            <div class="progress">
                <div class="progress-bar" style="width: ${(uploadedForms/totalForms)*100}%"></div>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Form 34B (Constituency):</span>
                <span class="fw-bold">${uploadedForms}/${totalForms}</span>
            </div>
            <div class="progress">
                <div class="progress-bar bg-warning" style="width: ${(uploadedForms/totalForms)*100}%"></div>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Form 35A (Other):</span>
                <span class="fw-bold">${uploadedForms}/${totalForms}</span>
            </div>
            <div class="progress">
                <div class="progress-bar bg-info" style="width: ${(uploadedForms/totalForms)*100}%"></div>
            </div>
        </div>
    `;
}

// Update forms verification
function updateFormsVerification(forms) {
    const container = document.getElementById('forms-verification');
    if (!container) return;
    
    const verificationRequired = forms.filter(f => f.verificationStatus === 'pending');
    
    container.innerHTML = verificationRequired.map(form => `
        <div class="alert alert-warning alert-sm">
            <strong>${form.station}</strong> - ${form.type}<br>
            <small>Uploaded: ${new Date(form.uploadTime).toLocaleString()}</small>
            <br>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="verifyForm('${form.id}')">
                <i class="fas fa-eye me-2"></i> Verify
            </button>
        </div>
    `).join('');
}

// Update form photo viewer
function updateFormPhotoViewer(forms) {
    const container = document.getElementById('form-photo-viewer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            Form photo match viewer will be available once forms are uploaded and require verification.
        </div>
    `;
}

// Update incidents display
function updateIncidentsDisplay(incidents) {
    // Update incidents list
    updateIncidentsList(incidents);
    
    // Update incident statistics
    updateIncidentStats(incidents);
}

// Update incidents list
function updateIncidentsList(incidents) {
    const container = document.getElementById('incidents-list');
    if (!container) return;
    
    container.innerHTML = incidents.map(incident => `
        <div class="alert alert-${incident.severity === 'critical' ? 'danger' : incident.severity === 'moderate' ? 'warning' : 'info'} alert-sm">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6>
                        <span class="incident-tag incident-${incident.severity}">${incident.severity}</span>
                        ${incident.type.replace('_', ' ').toUpperCase()}
                    </h6>
                    <p class="mb-1">${incident.description}</p>
                    <small class="text-muted">
                        Station: ${incident.station} | Reported: ${new Date(incident.timestamp).toLocaleString()}
                    </small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewIncidentDetails('${incident.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${incident.severity === 'critical' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="escalateIncident('${incident.id}')">
                            <i class="fas fa-arrow-up"></i> Escalate
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Update incident statistics
function updateIncidentStats(incidents) {
    const container = document.getElementById('incident-stats');
    if (!container) return;
    
    const critical = incidents.filter(i => i.severity === 'critical').length;
    const moderate = incidents.filter(i => i.severity === 'moderate').length;
    const info = incidents.filter(i => i.severity === 'info').length;
    
    container.innerHTML = `
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Critical:</span>
                <span class="fw-bold text-danger">${critical}</span>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Moderate:</span>
                <span class="fw-bold text-warning">${moderate}</span>
            </div>
        </div>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Info:</span>
                <span class="fw-bold text-info">${info}</span>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-outline-secondary btn-sm w-100" onclick="exportIncidentReport()">
                <i class="fas fa-download me-2"></i> Export Report
            </button>
        </div>
    `;
}

// Update analytics display
function updateAnalyticsDisplay(data) {
    // Update metrics
    document.getElementById('county-turnout').textContent = data.countyTurnout + '%';
    document.getElementById('offline-stations').textContent = data.offlineStations;
    document.getElementById('form-upload-rate').textContent = data.formUploadRate + '%';
    document.getElementById('active-clerks').textContent = data.activeClerks;
    
    // Update clerk performance table
    updateClerkPerformanceTable(data.clerkPerformance || []);
}

// Update clerk performance table
function updateClerkPerformanceTable(performance) {
    const tbody = document.getElementById('clerk-performance-table');
    if (!tbody) return;
    
    tbody.innerHTML = performance.map(clerk => `
        <tr>
            <td>${clerk.name}</td>
            <td>${clerk.station}</td>
            <td>${clerk.checkInTime}</td>
            <td>${clerk.lastActivity}</td>
            <td>
                <span class="badge bg-${clerk.performance === 'excellent' ? 'success' : clerk.performance === 'good' ? 'info' : 'warning'}">
                    ${clerk.performance}
                </span>
            </td>
            <td>${clerk.issues || 'None'}</td>
        </tr>
    `).join('');
}

// Initialize charts
function initializeCharts() {
    // Turnout chart
    const turnoutCtx = document.getElementById('turnout-chart');
    if (turnoutCtx) {
        charts.turnout = new Chart(turnoutCtx, {
            type: 'line',
            data: {
                labels: ['Westlands', 'Parklands', 'Lavington', 'Kilimani', 'Hurlingham'],
                datasets: [{
                    label: 'Turnout %',
                    data: [72, 75, 0, 68, 81],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Device status chart
    const deviceCtx = document.getElementById('device-chart');
    if (deviceCtx) {
        charts.device = new Chart(deviceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Online', 'Offline', 'Warning'],
                datasets: [{
                    data: [12, 3, 0],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107']
                }]
            },
            options: {
                responsive: true
            }
        });
    }
}

// Initialize WebSocket
function initializeWebSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        document.getElementById('last-sync').textContent = 'Online';
        document.getElementById('last-sync').className = 'status-online';
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        document.getElementById('last-sync').textContent = 'Offline';
        document.getElementById('last-sync').className = 'status-offline';
    });
    
    socket.on('update', (data) => {
        console.log('Received update:', data);
        handleRealTimeUpdate(data);
    });
}

// Handle real-time updates
function handleRealTimeUpdate(data) {
    switch (data.type) {
        case 'critical_incident':
            showEmergencyAlert(data.incident);
            break;
        case 'station_status':
            updateStationStatus(data.station);
            break;
        case 'form_upload':
            updateFormStatus(data.form);
            break;
        case 'voter_update':
            updateVoterStatus(data.voter);
            break;
    }
}

// Show emergency alert
function showEmergencyAlert(incident) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'emergency-alert';
    alertContainer.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>EMERGENCY:</strong> ${incident.description} at ${incident.station}
        <button class="btn btn-light btn-sm ms-3" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.querySelector('.main-content').insertBefore(alertContainer, document.querySelector('.main-content').firstChild);
}

// Add clerk
function addClerk() {
    const name = document.getElementById('clerk-name').value;
    const nationalId = document.getElementById('clerk-national-id').value;
    const phone = document.getElementById('clerk-phone').value;
    const email = document.getElementById('clerk-email').value;
    const station = document.getElementById('clerk-station').value;
    
    if (!name || !nationalId || !phone || !email || !station) {
        alert('Please fill in all fields');
        return;
    }
    
    // In production, send to API
    console.log('Adding clerk:', { name, nationalId, phone, email, station });
    
    // Close modal and refresh
    const modal = bootstrap.Modal.getInstance(document.getElementById('addClerkModal'));
    modal.hide();
    
    // Refresh clerks data
    loadClerksData();
}

// Submit incident
function submitIncident() {
    const type = document.getElementById('incident-type').value;
    const severity = document.getElementById('incident-severity').value;
    const station = document.getElementById('incident-station').value;
    const description = document.getElementById('incident-description').value;
    const evidence = document.getElementById('incident-evidence').files[0];
    const witness = document.getElementById('incident-witness').value;
    
    if (!type || !severity || !station || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    // In production, send to API
    console.log('Submitting incident:', { type, severity, station, description, evidence, witness });
    
    // Close modal and refresh
    const modal = bootstrap.Modal.getInstance(document.getElementById('reportIncidentModal'));
    modal.hide();
    
    // Refresh incidents data
    loadIncidentsData();
}

// Generate deployment list
function generateDeploymentList() {
    // In production, generate and download deployment list
    console.log('Generating deployment list');
    alert('Deployment list generated successfully!');
}

// Export incident report
function exportIncidentReport() {
    // In production, generate and download incident report
    console.log('Exporting incident report');
    alert('Incident report exported successfully!');
}

// View station details
function viewStationDetails(stationId) {
    console.log('Viewing station details:', stationId);
    // Implement station details view
}

// View incident details
function viewIncidentDetails(incidentId) {
    console.log('Viewing incident details:', incidentId);
    // Implement incident details view
}

// Escalate incident
function escalateIncident(incidentId) {
    console.log('Escalating incident:', incidentId);
    // Implement incident escalation
}

// Verify form
function verifyForm(formId) {
    console.log('Verifying form:', formId);
    // Implement form verification
}

// Logout
function logout() {
    localStorage.removeItem('regional_token');
    currentUser = null;
    
    // Disconnect WebSocket
    if (socket) {
        socket.disconnect();
    }
    
    // Show auth section
    document.getElementById('dashboard').classList.add('d-none');
    document.getElementById('auth-section').classList.remove('d-none');
    
    // Reset form
    document.getElementById('regional-login-form').reset();
    biometricVerified = false;
}

// Mock data functions
function getMockOverviewData() {
    return {
        positions: [
            { name: 'MCA', status: 'active', candidates: 15 },
            { name: 'MP', status: 'active', candidates: 8 },
            { name: 'Senator', status: 'active', candidates: 3 },
            { name: 'Governor', status: 'active', candidates: 5 },
            { name: 'Women Rep', status: 'active', candidates: 4 },
            { name: 'President', status: 'readonly', candidates: 2 }
        ],
        updates: [
            { type: 'info', message: 'Ballot layout approved for Ward 12' },
            { type: 'warning', message: 'Candidate withdrawal deadline: 2 days' }
        ]
    };
}

function getMockClerksData() {
    return [
        {
            id: 'CLK001',
            name: 'Alice Wanjiku',
            nationalId: '11111111',
            phone: '+254700000001',
            email: 'alice.wanjiku@iebc.go.ke',
            assignedStation: 'PS001',
            status: 'active',
            trainingCompleted: true
        },
        {
            id: 'CLK002',
            name: 'John Mwangi',
            nationalId: '22222222',
            phone: '+254700000002',
            email: 'john.mwangi@iebc.go.ke',
            assignedStation: 'PS001',
            status: 'active',
            trainingCompleted: true
        }
    ];
}

function getMockStationsData() {
    return [
        {
            id: 'PS001',
            name: 'Westlands Primary School',
            status: 'open',
            isOnline: true,
            lastSync: new Date().toISOString()
        },
        {
            id: 'PS002',
            name: 'Parklands High School',
            status: 'open',
            isOnline: true,
            lastSync: new Date().toISOString()
        },
        {
            id: 'PS003',
            name: 'Lavington Mall',
            status: 'closed',
            isOnline: false,
            lastSync: null
        }
    ];
}

function getMockVotersData() {
    return [
        {
            id: '38860346',
            name: 'Moreen Wanjiku',
            ward: 'Westlands',
            pollingStation: 'Westlands Primary School',
            status: 'Active',
            hasVoted: false
        },
        {
            id: '12345678',
            name: 'John Kamau',
            ward: 'Parklands',
            pollingStation: 'Parklands High School',
            status: 'Active',
            hasVoted: true
        }
    ];
}

function getMockFormsData() {
    return [
        {
            id: 'FORM001',
            type: '34A',
            station: 'PS001',
            status: 'uploaded',
            verificationStatus: 'pending',
            uploadTime: new Date().toISOString()
        }
    ];
}

function getMockIncidentsData() {
    return [
        {
            id: 'INC001',
            type: 'device_failure',
            severity: 'moderate',
            description: 'Tablet battery draining too fast',
            station: 'PS001',
            timestamp: new Date().toISOString()
        },
        {
            id: 'INC002',
            type: 'violence',
            severity: 'critical',
            description: 'Fight broke out between party agents',
            station: 'PS002',
            timestamp: new Date().toISOString()
        }
    ];
}

function getMockAnalyticsData() {
    return {
        countyTurnout: 78.5,
        offlineStations: 3,
        formUploadRate: 92,
        activeClerks: 15,
        clerkPerformance: [
            {
                name: 'Alice Wanjiku',
                station: 'PS001',
                checkInTime: '05:45',
                lastActivity: '14:30',
                performance: 'excellent',
                issues: 'None'
            },
            {
                name: 'John Mwangi',
                station: 'PS001',
                checkInTime: '05:50',
                lastActivity: '14:30',
                performance: 'good',
                issues: 'None'
            }
        ]
    };
}

// Check auth status
function checkAuthStatus() {
    const token = localStorage.getItem('regional_token');
    if (token) {
        validateToken(token);
    }
}

// Setup dashboard features
function setupDashboardFeatures() {
    // Initialize any additional dashboard features
    console.log('Dashboard features initialized');
}