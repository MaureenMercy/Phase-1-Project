// IEBC Bomas HQ Operations Dashboard - JavaScript
// Handles authentication, navigation, and functionality for National Tally Center Management

// Global state management
let currentUser = null;
let currentSection = 'results-map';
let sessionId = null;
let deviceFingerprint = null;
let auditLog = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
    setupEventListeners();
    checkAuthStatus();
    initializeSessionWatermark();
});

// Initialize application
function initializeApplication() {
    console.log('Bomas HQ Operations Dashboard initialized');
    
    // Setup navigation
    setupNavigation();
    
    // Setup authentication
    setupAuthentication();
    
    // Setup dashboard functionality
    setupDashboardFeatures();
    
    // Initialize device fingerprinting
    generateDeviceFingerprint();
}

// Generate device fingerprint for security
function generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = canvas.toDataURL().slice(-50) + 
                       navigator.userAgent.slice(-20) + 
                       screen.width + 'x' + screen.height;
    
    deviceFingerprint = btoa(fingerprint).slice(0, 16);
    updateWatermark();
}

// Initialize session watermark
function initializeSessionWatermark() {
    sessionId = 'BOMAS-' + new Date().getFullYear() + '-' + 
                String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    updateWatermark();
}

// Update watermark
function updateWatermark() {
    if (sessionId) document.getElementById('session-id').textContent = sessionId;
    if (deviceFingerprint) document.getElementById('device-fingerprint').textContent = deviceFingerprint;
    if (currentUser) document.getElementById('watermark-officer').textContent = currentUser.name;
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
    const loginForm = document.getElementById('bomas-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Periodic updates
    startPeriodicUpdates();
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
        
        // Log navigation
        logActivity(`Navigated to ${sectionId}`, 'navigation', 'info');
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
    // No additional setup needed for now
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const twoFactor = document.getElementById('two-factor').value;
    const deviceVerified = document.getElementById('device-verified').checked;
    
    // Validate required fields
    if (!username || !password || !twoFactor || !deviceVerified) {
        showMessage('Please complete all authentication steps', 'error');
        return;
    }
    
    // Validate device fingerprint
    if (!deviceFingerprint) {
        showMessage('Device verification failed', 'error');
        return;
    }
    
    // Simulate authentication process
    const loginButton = document.querySelector('#bomas-login-form button[type="submit"]');
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Authenticating...';
    loginButton.disabled = true;
    
    setTimeout(() => {
        // Simulate successful authentication
        currentUser = {
            type: 'bomas_operations',
            username: username,
            name: 'Commissioner Smith', // Would come from database
            level: 'national',
            authenticated: true,
            loginTime: new Date(),
            deviceId: 'BOMAS-TERM-001'
        };
        
        showDashboard();
        showMessage('Secure authentication successful! Welcome to Bomas HQ Operations', 'success');
        
        // Log successful login
        logActivity('Secure login successful', 'authentication', 'success');
        
        // Start session monitoring
        startSessionMonitoring();
        
    }, 2500);
}

// Show dashboard
function showDashboard() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('main-dashboard').classList.remove('d-none');
    
    // Update user information
    document.getElementById('officer-name').textContent = currentUser.name;
    document.getElementById('device-id').textContent = currentUser.deviceId;
    
    // Update watermark
    updateWatermark();
    
    // Load initial dashboard data
    loadDashboardData();
}

// Load dashboard data
function loadDashboardData() {
    // Simulate loading real-time data
    loadNationalMetrics();
    loadResultsData();
    loadTallyingData();
    loadEvidenceData();
    loadMonitoringData();
    loadAlertData();
    loadJudiciaryData();
    loadPublishingData();
}

// Setup dashboard features
function setupDashboardFeatures() {
    // Setup tallying engine
    setupTallyingEngine();
    
    // Setup evidence repository
    setupEvidenceRepository();
    
    // Setup monitoring
    setupMonitoring();
    
    // Setup alert center
    setupAlertCenter();
    
    // Setup judiciary interface
    setupJudiciaryInterface();
    
    // Setup publishing controls
    setupPublishingControls();
}

// Setup tallying engine
function setupTallyingEngine() {
    // Form entry buttons
    const tallyButtons = document.querySelectorAll('#tallying .btn');
    tallyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = e.target.textContent;
            if (buttonText.includes('Form 34B')) {
                openFormEntry('34B');
            } else if (buttonText.includes('Form 34C')) {
                openFormEntry('34C');
            } else if (buttonText.includes('Secure Tallying')) {
                openSecureTallying();
            }
        });
    });
    
    // Tallying queue actions
    setupTallyingQueueActions();
}

// Open form entry
function openFormEntry(formType) {
    showMessage(`Opening Form ${formType} entry interface...`, 'info');
    
    // Simulate form entry modal
    setTimeout(() => {
        showModal(`Form ${formType} Entry`, `
            <div class="form-entry-interface">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Secure Entry:</strong> All entries are logged and audited
                </div>
                <form>
                    <div class="mb-3">
                        <label class="form-label">Constituency</label>
                        <select class="form-select" required>
                            <option value="">Select Constituency</option>
                            <option value="kibra">Kibra</option>
                            <option value="langata">Langata</option>
                            <option value="westlands">Westlands</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Presidential Votes</label>
                        <input type="number" class="form-control" placeholder="Enter vote count">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parliamentary Votes</label>
                        <input type="number" class="form-control" placeholder="Enter vote count">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Form Image</label>
                        <input type="file" class="form-control" accept="image/*">
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Entry</button>
                </form>
            </div>
        `);
        
        logActivity(`Opened Form ${formType} entry`, 'tallying', 'info');
    }, 1000);
}

// Open secure tallying
function openSecureTallying() {
    showMessage('Initializing secure tallying mode...', 'warning');
    
    setTimeout(() => {
        showModal('Secure Tallying Interface', `
            <div class="secure-tally-interface">
                <div class="alert alert-danger">
                    <i class="fas fa-shield-alt me-2"></i>
                    <strong>Secure Mode:</strong> Dual authorization required
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6>Primary Authorization</h6>
                        <input type="password" class="form-control mb-2" placeholder="Enter primary key">
                        <button class="btn btn-warning btn-sm">Authorize</button>
                    </div>
                    <div class="col-md-6">
                        <h6>Secondary Authorization</h6>
                        <input type="password" class="form-control mb-2" placeholder="Enter secondary key">
                        <button class="btn btn-warning btn-sm">Authorize</button>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="progress">
                        <div class="progress-bar bg-warning" style="width: 50%">Partial Authorization</div>
                    </div>
                </div>
            </div>
        `);
        
        logActivity('Accessed secure tallying mode', 'tallying', 'warning');
    }, 1500);
}

// Setup tallying queue actions
function setupTallyingQueueActions() {
    // This would be implemented to handle approve, review, investigate actions
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-outline-success') && 
            e.target.textContent.includes('Approve')) {
            approveTallyEntry(e.target);
        } else if (e.target.classList.contains('btn-outline-warning') && 
                   e.target.textContent.includes('Review')) {
            reviewTallyEntry(e.target);
        } else if (e.target.classList.contains('btn-outline-danger') && 
                   e.target.textContent.includes('Investigate')) {
            investigateTallyEntry(e.target);
        }
    });
}

// Approve tally entry
function approveTallyEntry(button) {
    const row = button.closest('tr');
    const constituency = row.cells[0].textContent;
    
    showMessage(`Approving tally for ${constituency}...`, 'info');
    
    setTimeout(() => {
        row.cells[2].innerHTML = '<span class="badge bg-success">Approved</span>';
        showMessage(`Tally approved for ${constituency}`, 'success');
        logActivity(`Approved tally: ${constituency}`, 'tallying', 'success');
    }, 1000);
}

// Review tally entry
function reviewTallyEntry(button) {
    const row = button.closest('tr');
    const constituency = row.cells[0].textContent;
    
    showMessage(`Opening review for ${constituency}...`, 'info');
    logActivity(`Reviewed tally: ${constituency}`, 'tallying', 'info');
}

// Investigate tally entry
function investigateTallyEntry(button) {
    const row = button.closest('tr');
    const constituency = row.cells[0].textContent;
    
    showMessage(`Flagging ${constituency} for investigation...`, 'warning');
    logActivity(`Flagged for investigation: ${constituency}`, 'tallying', 'warning');
}

// Setup evidence repository
function setupEvidenceRepository() {
    // Evidence item actions
    document.addEventListener('click', (e) => {
        if (e.target.textContent.includes('View') && e.target.closest('.evidence-item')) {
            viewEvidence(e.target);
        } else if (e.target.textContent.includes('Verify') && e.target.closest('.evidence-item')) {
            verifyEvidence(e.target);
        } else if (e.target.textContent.includes('Flag') && e.target.closest('.evidence-item')) {
            flagEvidence(e.target);
        }
    });
}

// View evidence
function viewEvidence(button) {
    const evidenceItem = button.closest('.evidence-item');
    const title = evidenceItem.querySelector('h6').textContent;
    
    showModal('Evidence Viewer', `
        <div class="evidence-viewer">
            <h5>${title}</h5>
            <div class="evidence-preview" style="height: 400px; background: #f8f9fa; border: 2px dashed #dee2e6; display: flex; align-items: center; justify-content: center;">
                <div class="text-center">
                    <i class="fas fa-file-image" style="font-size: 4rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <p class="text-muted">Evidence document preview would load here</p>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary me-2">Download Original</button>
                <button class="btn btn-success me-2">Mark Verified</button>
                <button class="btn btn-warning">Flag Issue</button>
            </div>
        </div>
    `);
    
    logActivity(`Viewed evidence: ${title}`, 'evidence', 'info');
}

// Verify evidence
function verifyEvidence(button) {
    const evidenceItem = button.closest('.evidence-item');
    const title = evidenceItem.querySelector('h6').textContent;
    
    showMessage(`Verifying ${title}...`, 'info');
    
    setTimeout(() => {
        showMessage(`${title} verified successfully`, 'success');
        logActivity(`Verified evidence: ${title}`, 'evidence', 'success');
    }, 1500);
}

// Flag evidence
function flagEvidence(button) {
    const evidenceItem = button.closest('.evidence-item');
    const title = evidenceItem.querySelector('h6').textContent;
    
    const reason = prompt(`Reason for flagging ${title}:`);
    if (reason) {
        showMessage(`${title} flagged: ${reason}`, 'warning');
        logActivity(`Flagged evidence: ${title} - ${reason}`, 'evidence', 'warning');
    }
}

// Setup monitoring
function setupMonitoring() {
    // Monitoring actions would be set up here
    console.log('Monitoring setup complete');
}

// Setup alert center
function setupAlertCenter() {
    // Alert actions
    document.addEventListener('click', (e) => {
        if (e.target.textContent.includes('Investigate') && e.target.closest('.security-alert')) {
            investigateAlert(e.target);
        } else if (e.target.textContent.includes('Check Status') && e.target.closest('.security-alert')) {
            checkAlertStatus(e.target);
        } else if (e.target.textContent.includes('Dispatch Tech') && e.target.closest('.security-alert')) {
            dispatchTech(e.target);
        }
    });
}

// Investigate alert
function investigateAlert(button) {
    const alert = button.closest('.security-alert');
    const alertTitle = alert.querySelector('h6').textContent;
    
    showMessage(`Investigating: ${alertTitle}...`, 'warning');
    logActivity(`Investigating alert: ${alertTitle}`, 'security', 'warning');
}

// Check alert status
function checkAlertStatus(button) {
    const alert = button.closest('.security-alert');
    const alertTitle = alert.querySelector('h6').textContent;
    
    showMessage(`Checking status: ${alertTitle}...`, 'info');
    logActivity(`Checked status: ${alertTitle}`, 'monitoring', 'info');
}

// Dispatch tech
function dispatchTech(button) {
    const alert = button.closest('.security-alert');
    const alertTitle = alert.querySelector('h6').textContent;
    
    showMessage(`Technical team dispatched for: ${alertTitle}`, 'success');
    logActivity(`Dispatched tech team: ${alertTitle}`, 'maintenance', 'success');
}

// Setup judiciary interface
function setupJudiciaryInterface() {
    // Judiciary interface would be set up here
    console.log('Judiciary interface setup complete');
}

// Setup publishing controls
function setupPublishingControls() {
    // Publishing buttons
    const publishButtons = document.querySelectorAll('#publishing .btn');
    publishButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonText = e.target.textContent;
            if (buttonText.includes('Preview Results')) {
                previewResults();
            } else if (buttonText.includes('Publish Updates')) {
                publishUpdates();
            } else if (buttonText.includes('Emergency Stop')) {
                emergencyStop();
            }
        });
    });
}

// Preview results
function previewResults() {
    showMessage('Loading results preview...', 'info');
    
    setTimeout(() => {
        showModal('Results Preview', `
            <div class="results-preview">
                <h5>Election Results Preview</h5>
                <div class="alert alert-warning">
                    <i class="fas fa-eye me-2"></i>
                    This is a preview only. Results have not been published.
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Leading Candidate</th>
                                <th>Votes</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>President</td>
                                <td>William Ruto</td>
                                <td>7,176,141</td>
                                <td>50.49%</td>
                            </tr>
                            <tr>
                                <td>Deputy President</td>
                                <td>Rigathi Gachagua</td>
                                <td>7,176,141</td>
                                <td>50.49%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-3">
                    <button class="btn btn-success me-2">Approve for Publishing</button>
                    <button class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `);
        
        logActivity('Previewed results for publishing', 'publishing', 'info');
    }, 1500);
}

// Publish updates
function publishUpdates() {
    const confirmation = confirm('Are you sure you want to publish results updates? This action cannot be undone.');
    
    if (confirmation) {
        showMessage('Publishing results updates...', 'warning');
        
        setTimeout(() => {
            showMessage('Results published successfully to public dashboard', 'success');
            logActivity('Published results update', 'publishing', 'success');
            
            // Update publishing history
            updatePublishingHistory();
        }, 2000);
    }
}

// Emergency stop
function emergencyStop() {
    const confirmation = confirm('EMERGENCY STOP: This will halt all public result updates. Are you sure?');
    
    if (confirmation) {
        showMessage('EMERGENCY STOP ACTIVATED - All publishing halted', 'error');
        logActivity('Emergency stop activated', 'publishing', 'critical');
    }
}

// Update publishing history
function updatePublishingHistory() {
    const historyTable = document.querySelector('#publishing .table tbody');
    if (historyTable) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${new Date().toLocaleTimeString()}</td>
            <td>Results update - Live</td>
            <td>${currentUser.name}</td>
            <td><span class="badge bg-success">Published</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary">View</button>
                <button class="btn btn-sm btn-outline-warning">Recall</button>
            </td>
        `;
        historyTable.insertBefore(newRow, historyTable.firstChild);
    }
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'results-map':
            loadResultsData();
            break;
        case 'tallying':
            loadTallyingData();
            break;
        case 'evidence':
            loadEvidenceData();
            break;
        case 'monitoring':
            loadMonitoringData();
            break;
        case 'alerts':
            loadAlertData();
            break;
        case 'judiciary':
            loadJudiciaryData();
            break;
        case 'publishing':
            loadPublishingData();
            break;
    }
}

// Load national metrics
function loadNationalMetrics() {
    // Simulate real-time metrics updates
    const metrics = {
        totalResults: Math.floor(Math.random() * 50) + 220,
        verifiedResults: Math.floor(Math.random() * 30) + 200,
        flaggedResults: Math.floor(Math.random() * 10) + 5,
        turnoutPercentage: Math.floor(Math.random() * 15) + 65
    };
    
    // Update metric displays
    document.getElementById('total-results').textContent = metrics.totalResults;
    document.getElementById('verified-results').textContent = metrics.verifiedResults;
    document.getElementById('flagged-results').textContent = metrics.flaggedResults;
    document.getElementById('turnout-percentage').textContent = metrics.turnoutPercentage + '%';
}

// Load results data
function loadResultsData() {
    console.log('Loading results data...');
    setupResultsChart();
}

// Setup results chart
function setupResultsChart() {
    const canvas = document.getElementById('resultsChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        // Simple pie chart simulation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        
        // Draw pie segments
        let startAngle = 0;
        const segments = [
            { angle: Math.PI * 1.1, color: '#3498db', label: 'Party A' },
            { angle: Math.PI * 0.8, color: '#e74c3c', label: 'Party B' },
            { angle: Math.PI * 0.1, color: '#f39c12', label: 'Others' }
        ];
        
        segments.forEach(segment => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + segment.angle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = segment.color;
            ctx.fill();
            startAngle += segment.angle;
        });
    }
}

// Load other section data functions
function loadTallyingData() {
    console.log('Loading tallying data...');
}

function loadEvidenceData() {
    console.log('Loading evidence data...');
}

function loadMonitoringData() {
    console.log('Loading monitoring data...');
}

function loadAlertData() {
    console.log('Loading alert data...');
}

function loadJudiciaryData() {
    console.log('Loading judiciary data...');
}

function loadPublishingData() {
    console.log('Loading publishing data...');
}

// Start periodic updates
function startPeriodicUpdates() {
    setInterval(() => {
        if (currentUser && currentUser.authenticated) {
            loadNationalMetrics();
            loadSectionData(currentSection);
        }
    }, 30000); // Update every 30 seconds
}

// Start session monitoring
function startSessionMonitoring() {
    // Track user activity
    let lastActivity = Date.now();
    
    // Update last activity on any user interaction
    document.addEventListener('click', () => {
        lastActivity = Date.now();
    });
    
    document.addEventListener('keypress', () => {
        lastActivity = Date.now();
    });
    
    // Check for session timeout every minute
    setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
        
        if (inactiveTime > maxInactiveTime) {
            showMessage('Session expired due to inactivity', 'warning');
            logout();
        }
    }, 60000);
}

// Check authentication status
function checkAuthStatus() {
    // Check if user is already authenticated (from localStorage/sessionStorage)
    const savedAuth = localStorage.getItem('bomasAuth');
    if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.authenticated && new Date() - new Date(authData.loginTime) < 8 * 60 * 60 * 1000) {
            // Session valid for 8 hours
            currentUser = authData;
            showDashboard();
        } else {
            // Session expired
            localStorage.removeItem('bomasAuth');
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
        sessionId: sessionId,
        deviceFingerprint: deviceFingerprint,
        ip: '192.168.1.100' // Would be actual IP in production
    };
    
    auditLog.push(logEntry);
    console.log('Bomas Activity Log:', logEntry);
    
    // In production, this would send to secure server
    // sendToSecureServer('/api/audit', logEntry);
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
    messageDiv.style.minWidth = '350px';
    messageDiv.style.maxWidth = '500px';
    
    messageDiv.innerHTML = `
        <strong>BOMAS HQ:</strong> ${message}
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

// Show modal
function showModal(title, content) {
    // Create modal
    const modalHtml = `
        <div class="modal fade" id="bomasModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('bomasModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('bomasModal'));
    modal.show();
}

// Logout function
function logout() {
    logActivity('User logout', 'authentication', 'info');
    
    currentUser = null;
    localStorage.removeItem('bomasAuth');
    
    // Show auth section
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('main-dashboard').classList.add('d-none');
    
    // Reset forms
    document.getElementById('bomas-login-form').reset();
    
    showMessage('Logged out successfully', 'success');
}

// Save authentication state
function saveAuthState() {
    if (currentUser) {
        localStorage.setItem('bomasAuth', JSON.stringify(currentUser));
    }
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, save state
        saveAuthState();
        logActivity('Page hidden', 'session', 'info');
    } else {
        // Page is visible, refresh data
        if (currentUser && currentUser.authenticated) {
            loadSectionData(currentSection);
            logActivity('Page visible', 'session', 'info');
        }
    }
});

// Handle beforeunload event
window.addEventListener('beforeunload', () => {
    saveAuthState();
    logActivity('Page unload', 'session', 'info');
});

// Export functions for global access
window.bomasHQ = {
    logout,
    navigateToSection,
    showMessage,
    logActivity,
    getAuditLog: () => auditLog
};