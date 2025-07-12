// IEBC Board & Executive Dashboard - JavaScript
// Handles top-tier authentication, oversight, and executive decision-making

// Global state management
let currentUser = null;
let currentSection = 'nationwide';
let sessionId = null;
let securityClearance = 'TOP SECRET';
let biometricProgress = 0;
let emergencyFreezeable = true;
let auditTrail = [];

// Biometric verification states
let fingerprintVerified = false;
let retinaVerified = false;
let voiceVerified = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
    setupEventListeners();
    checkAuthStatus();
    initializeSecurityFeatures();
});

// Initialize application
function initializeApplication() {
    console.log('IEBC Board & Executive Dashboard initialized');
    console.log('Security Level: TOP SECRET');
    
    // Setup navigation
    setupNavigation();
    
    // Setup authentication
    setupAuthentication();
    
    // Setup dashboard functionality
    setupDashboardFeatures();
    
    // Initialize session tracking
    initializeSessionTracking();
}

// Initialize session tracking
function initializeSessionTracking() {
    sessionId = 'EXEC-' + new Date().getFullYear() + '-' + 
                String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    updateWatermark();
}

// Initialize security features
function initializeSecurityFeatures() {
    // Enable offline audit trail storage
    enableOfflineStorage();
    
    // Setup session watermarking
    setupSessionWatermarking();
    
    // Initialize emergency freeze capability
    initializeEmergencyFreeze();
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
    const loginForm = document.getElementById('executive-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleExecutiveLogin);
    }
    
    // Biometric scan functions
    window.scanFingerprint = scanFingerprint;
    window.scanRetina = scanRetina;
    window.scanVoice = scanVoice;
    window.verifyLocation = verifyLocation;
    
    // Emergency controls
    window.suspendUser = suspendUser;
    window.forceBallotRecall = forceBallotRecall;
    window.overrideResult = overrideResult;
    window.lockConstituency = lockConstituency;
    window.generateReport = generateReport;
    window.certifyResults = certifyResults;
    window.emergencyFreeze = emergencyFreeze;
    
    // Setup periodic updates
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
        logExecutiveActivity(`Navigated to ${sectionId}`, 'navigation', 'info');
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
    // Authentication is handled by the individual scan functions
}

// Biometric scan functions
function scanFingerprint() {
    showMessage('Scanning fingerprint...', 'info');
    
    setTimeout(() => {
        fingerprintVerified = true;
        updateBiometricProgress();
        showMessage('Fingerprint verified successfully', 'success');
        logExecutiveActivity('Fingerprint scan completed', 'biometric', 'success');
    }, 2000);
}

function scanRetina() {
    showMessage('Scanning retina...', 'info');
    
    setTimeout(() => {
        retinaVerified = true;
        updateBiometricProgress();
        showMessage('Retina scan verified successfully', 'success');
        logExecutiveActivity('Retina scan completed', 'biometric', 'success');
    }, 3000);
}

function scanVoice() {
    showMessage('Recording voice pattern...', 'info');
    
    setTimeout(() => {
        voiceVerified = true;
        updateBiometricProgress();
        showMessage('Voice pattern verified successfully', 'success');
        logExecutiveActivity('Voice pattern scan completed', 'biometric', 'success');
    }, 2500);
}

function verifyLocation() {
    showMessage('Verifying geo-location...', 'info');
    
    setTimeout(() => {
        document.getElementById('location-status').style.display = 'block';
        showMessage('Location verified: IEBC HQ', 'success');
        logExecutiveActivity('Geo-location verified', 'security', 'success');
    }, 1500);
}

// Update biometric progress
function updateBiometricProgress() {
    let verifiedCount = 0;
    if (fingerprintVerified) verifiedCount++;
    if (retinaVerified) verifiedCount++;
    if (voiceVerified) verifiedCount++;
    
    biometricProgress = (verifiedCount / 3) * 100;
    
    const progressBar = document.getElementById('biometric-progress');
    const progressText = document.getElementById('biometric-text');
    const statusDiv = document.getElementById('biometric-status');
    
    if (progressBar && progressText && statusDiv) {
        statusDiv.style.display = 'block';
        progressBar.style.width = biometricProgress + '%';
        
        if (biometricProgress === 100) {
            progressText.textContent = 'All biometric scans completed';
            progressBar.classList.remove('bg-warning');
            progressBar.classList.add('bg-success');
        } else {
            progressText.textContent = `Verification ${Math.round(biometricProgress)}% complete`;
        }
    }
}

// Handle executive login
function handleExecutiveLogin(e) {
    e.preventDefault();
    
    const commissionerId = document.getElementById('commissioner-id').value;
    const password = document.getElementById('executive-password').value;
    const smartToken = document.getElementById('smart-token').checked;
    const locationVerified = document.getElementById('location-status').style.display === 'block';
    
    // Validate all security requirements
    if (!commissionerId || !password) {
        showMessage('Please enter Commissioner ID and password', 'error');
        return;
    }
    
    if (biometricProgress < 100) {
        showMessage('Complete all biometric scans first', 'error');
        return;
    }
    
    if (!smartToken) {
        showMessage('Smart token verification required', 'error');
        return;
    }
    
    if (!locationVerified) {
        showMessage('Location verification required', 'error');
        return;
    }
    
    // Simulate dual-approval authentication process
    const loginButton = document.querySelector('#executive-login-form button[type="submit"]');
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Authenticating...';
    loginButton.disabled = true;
    
    setTimeout(() => {
        // Simulate successful authentication
        currentUser = {
            type: 'board_executive',
            commissionerId: commissionerId,
            name: 'Hon. Wafula Chebukati', // Would come from secure database
            clearance: securityClearance,
            authenticated: true,
            loginTime: new Date(),
            biometricVerified: true,
            locationVerified: true,
            smartTokenVerified: true
        };
        
        showExecutiveDashboard();
        showMessage('EXECUTIVE ACCESS GRANTED - Welcome Commissioner', 'success');
        
        // Log successful login
        logExecutiveActivity('Executive login successful', 'authentication', 'success');
        
        // Start advanced session monitoring
        startAdvancedSessionMonitoring();
        
    }, 3000);
}

// Show executive dashboard
function showExecutiveDashboard() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('main-dashboard').classList.remove('d-none');
    
    // Update user information
    document.getElementById('commissioner-name').textContent = currentUser.name;
    document.getElementById('security-clearance').textContent = currentUser.clearance;
    
    // Update watermark
    updateWatermark();
    
    // Load initial dashboard data
    loadExecutiveDashboardData();
}

// Load executive dashboard data
function loadExecutiveDashboardData() {
    // Simulate loading real-time executive data
    loadNationwideAnalytics();
    loadFraudRiskData();
    loadLegalOverviewData();
    loadSystemPerformanceData();
    loadObserverFeedbackData();
    loadAIBriefingsData();
}

// Setup dashboard features
function setupDashboardFeatures() {
    // All dashboard features are set up through the global window functions
}

// Emergency control functions
function suspendUser() {
    const userId = prompt('Enter User ID to suspend:');
    if (userId) {
        const reason = prompt('Reason for suspension:');
        if (reason) {
            showMessage(`User ${userId} suspended. Reason: ${reason}`, 'warning');
            logExecutiveActivity(`Suspended user: ${userId} - ${reason}`, 'admin_action', 'critical');
        }
    }
}

function forceBallotRecall() {
    const constituency = prompt('Enter constituency for ballot recall:');
    if (constituency) {
        const confirmation = confirm(`CRITICAL ACTION: Force ballot recall for ${constituency}?\n\nThis action cannot be undone and will require judicial review.`);
        if (confirmation) {
            showMessage(`Ballot recall initiated for ${constituency}`, 'error');
            logExecutiveActivity(`Forced ballot recall: ${constituency}`, 'admin_action', 'critical');
        }
    }
}

function overrideResult() {
    const constituency = prompt('Enter constituency for result override:');
    if (constituency) {
        const reason = prompt('Enter reason for override:');
        if (reason) {
            const confirmation = confirm(`EXECUTIVE OVERRIDE: Override results for ${constituency}?\n\nReason: ${reason}\n\nThis requires dual approval.`);
            if (confirmation) {
                showMessage(`Result override flagged for dual approval: ${constituency}`, 'warning');
                logExecutiveActivity(`Result override requested: ${constituency} - ${reason}`, 'admin_action', 'critical');
            }
        }
    }
}

function lockConstituency() {
    const constituency = prompt('Enter constituency to lock:');
    if (constituency) {
        showMessage(`Constituency ${constituency} locked for investigation`, 'warning');
        logExecutiveActivity(`Locked constituency: ${constituency}`, 'admin_action', 'warning');
    }
}

function generateReport() {
    const reportType = prompt('Report type (summary/detailed/legal):');
    if (reportType) {
        showMessage(`Generating ${reportType} report...`, 'info');
        
        setTimeout(() => {
            showModal('Executive Report Generated', `
                <div class="report-preview">
                    <h5>IEBC Executive Report - ${reportType.toUpperCase()}</h5>
                    <div class="alert alert-info">
                        <i class="fas fa-file-alt me-2"></i>
                        Report generated successfully with digital signature and timestamp
                    </div>
                    <div class="report-details">
                        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Commissioner:</strong> ${currentUser.name}</p>
                        <p><strong>Classification:</strong> ${securityClearance}</p>
                        <p><strong>Report ID:</strong> EXEC-RPT-${Date.now()}</p>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-primary me-2">Download Report</button>
                        <button class="btn btn-success me-2">Digital Sign</button>
                        <button class="btn btn-warning">Send to Legal</button>
                    </div>
                </div>
            `);
            
            logExecutiveActivity(`Generated ${reportType} report`, 'report_generation', 'info');
        }, 2000);
    }
}

function certifyResults() {
    const confirmation = confirm('FINAL CERTIFICATION: Certify and seal final national election results?\n\nThis action is irreversible and will trigger judicial notification.');
    
    if (confirmation) {
        const secondConfirmation = confirm('DUAL APPROVAL REQUIRED: This action requires a second commissioner approval.\n\nProceed with certification request?');
        
        if (secondConfirmation) {
            showMessage('Results certification submitted for dual approval', 'success');
            logExecutiveActivity('Final results certification requested', 'certification', 'critical');
            
            // Show certification modal
            showModal('Results Certification', `
                <div class="certification-interface">
                    <h5>FINAL ELECTION RESULTS CERTIFICATION</h5>
                    <div class="alert alert-warning">
                        <i class="fas fa-certificate me-2"></i>
                        <strong>DUAL APPROVAL PENDING:</strong> Requires second commissioner signature
                    </div>
                    <div class="certification-details">
                        <p><strong>Requesting Commissioner:</strong> ${currentUser.name}</p>
                        <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Status:</strong> Pending Second Approval</p>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-warning" style="width: 50%">50% - First Approval Complete</div>
                    </div>
                </div>
            `);
        }
    }
}

function emergencyFreeze() {
    if (!emergencyFreezeable) {
        showMessage('Emergency freeze already activated', 'error');
        return;
    }
    
    const confirmation = confirm('EMERGENCY SYSTEM FREEZE\n\nThis will immediately halt ALL election operations nationwide.\n\nOnly proceed in case of critical security threat.\n\nConfirm?');
    
    if (confirmation) {
        const finalConfirmation = confirm('FINAL WARNING: This action will:\n- Stop all voting nationwide\n- Lock all systems\n- Trigger judicial notification\n- Require parliamentary review\n\nPROCEED WITH EMERGENCY FREEZE?');
        
        if (finalConfirmation) {
            emergencyFreezeable = false;
            showMessage('EMERGENCY SYSTEM FREEZE ACTIVATED - All operations halted', 'error');
            
            // Visual indicators of system freeze
            document.body.style.background = 'repeating-linear-gradient(45deg, #dc3545, #dc3545 10px, #721c24 10px, #721c24 20px)';
            
            // Show emergency freeze modal
            showModal('EMERGENCY SYSTEM FREEZE ACTIVATED', `
                <div class="emergency-freeze-status">
                    <div class="alert alert-danger">
                        <h4><i class="fas fa-stop-circle me-2"></i>SYSTEM FREEZE ACTIVE</h4>
                        <p>All election operations have been halted nationwide</p>
                    </div>
                    <div class="freeze-details">
                        <p><strong>Activated by:</strong> ${currentUser.name}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Status:</strong> EMERGENCY FREEZE ACTIVE</p>
                        <p><strong>Judicial Notification:</strong> Triggered</p>
                    </div>
                    <div class="alert alert-warning">
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Parliamentary review initiated</li>
                            <li>Judicial oversight activated</li>
                            <li>All polling stations notified</li>
                            <li>Media briefing scheduled</li>
                        </ul>
                    </div>
                </div>
            `);
            
            logExecutiveActivity('EMERGENCY SYSTEM FREEZE ACTIVATED', 'emergency', 'critical');
        }
    }
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'nationwide':
            loadNationwideAnalytics();
            break;
        case 'fraud-risk':
            loadFraudRiskData();
            break;
        case 'legal-overview':
            loadLegalOverviewData();
            break;
        case 'system-performance':
            loadSystemPerformanceData();
            break;
        case 'observer-feedback':
            loadObserverFeedbackData();
            break;
        case 'admin-console':
            // Admin console doesn't need data loading
            break;
        case 'ai-briefings':
            loadAIBriefingsData();
            break;
    }
}

// Load nationwide analytics
function loadNationwideAnalytics() {
    // Simulate real-time nationwide metrics updates
    const metrics = {
        nationalTurnout: (Math.random() * 10 + 65).toFixed(1),
        activeStations: Math.floor(Math.random() * 100) + 1200,
        delayedStations: Math.floor(Math.random() * 30) + 15,
        syncStatus: (Math.random() * 5 + 95).toFixed(1)
    };
    
    // Update metric displays
    if (document.getElementById('national-turnout')) {
        document.getElementById('national-turnout').textContent = metrics.nationalTurnout + '%';
        document.getElementById('active-stations').textContent = metrics.activeStations;
        document.getElementById('delayed-stations').textContent = metrics.delayedStations;
        document.getElementById('sync-status').textContent = metrics.syncStatus + '%';
    }
    
    // Setup turnout map visualization
    setupTurnoutMap();
}

// Setup turnout map
function setupTurnoutMap() {
    const canvas = document.getElementById('turnoutMap');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        // Simple Kenya map simulation with regional data
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw simplified regional map
        const regions = [
            { name: 'Nairobi', x: 200, y: 200, turnout: 68.7, color: '#3498db' },
            { name: 'Central', x: 180, y: 150, turnout: 70.0, color: '#2ecc71' },
            { name: 'Coast', x: 300, y: 250, turnout: 67.8, color: '#f39c12' },
            { name: 'Western', x: 100, y: 180, turnout: 70.0, color: '#e74c3c' },
            { name: 'Nyanza', x: 120, y: 220, turnout: 65.5, color: '#9b59b6' },
            { name: 'Rift Valley', x: 150, y: 100, turnout: 69.2, color: '#1abc9c' }
        ];
        
        regions.forEach(region => {
            // Draw region circle
            ctx.beginPath();
            ctx.arc(region.x, region.y, 30, 0, 2 * Math.PI);
            ctx.fillStyle = region.color;
            ctx.fill();
            
            // Add text
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(region.turnout + '%', region.x, region.y + 5);
            
            // Add region name
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.fillText(region.name, region.x, region.y + 50);
        });
    }
}

// Load fraud risk data
function loadFraudRiskData() {
    const metrics = {
        aiAlerts: Math.floor(Math.random() * 10) + 5,
        flaggedStations: Math.floor(Math.random() * 15) + 8,
        overrideLogs: Math.floor(Math.random() * 5) + 1,
        securityScore: Math.floor(Math.random() * 15) + 80
    };
    
    if (document.getElementById('ai-alerts')) {
        document.getElementById('ai-alerts').textContent = metrics.aiAlerts;
        document.getElementById('flagged-stations').textContent = metrics.flaggedStations;
        document.getElementById('override-logs').textContent = metrics.overrideLogs;
        document.getElementById('security-score').textContent = metrics.securityScore + '%';
    }
}

// Load other section data functions
function loadLegalOverviewData() {
    console.log('Loading legal overview data...');
}

function loadSystemPerformanceData() {
    console.log('Loading system performance data...');
}

function loadObserverFeedbackData() {
    console.log('Loading observer feedback data...');
}

function loadAIBriefingsData() {
    console.log('Loading AI briefings data...');
}

// Start periodic updates
function startPeriodicUpdates() {
    setInterval(() => {
        if (currentUser && currentUser.authenticated) {
            loadSectionData(currentSection);
        }
    }, 45000); // Update every 45 seconds for executive level
}

// Start advanced session monitoring
function startAdvancedSessionMonitoring() {
    // Track all user interactions for security
    let lastActivity = Date.now();
    
    // Update last activity on any interaction
    document.addEventListener('click', () => {
        lastActivity = Date.now();
    });
    
    document.addEventListener('keypress', () => {
        lastActivity = Date.now();
    });
    
    // Check for session timeout every minute
    setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        const maxInactiveTime = 20 * 60 * 1000; // 20 minutes for executive level
        
        if (inactiveTime > maxInactiveTime) {
            showMessage('Executive session expired due to inactivity', 'warning');
            logExecutiveActivity('Session timeout', 'security', 'warning');
            logout();
        }
    }, 60000);
    
    // Monitor for security anomalies
    setInterval(() => {
        detectSecurityAnomalies();
    }, 30000);
}

// Detect security anomalies
function detectSecurityAnomalies() {
    // Simulate security monitoring
    const anomalyChance = Math.random();
    
    if (anomalyChance < 0.05) { // 5% chance of detecting anomaly
        const anomalies = [
            'Unusual access pattern detected',
            'Multiple failed authentication attempts',
            'Suspicious network activity',
            'Unauthorized device access attempt'
        ];
        
        const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
        showMessage(`Security Alert: ${anomaly}`, 'warning');
        logExecutiveActivity(`Security anomaly: ${anomaly}`, 'security', 'warning');
    }
}

// Enable offline storage
function enableOfflineStorage() {
    // Store critical data offline for security
    setInterval(() => {
        if (currentUser) {
            localStorage.setItem('executiveSession', JSON.stringify({
                user: currentUser.name,
                sessionId: sessionId,
                timestamp: new Date(),
                clearance: securityClearance
            }));
        }
    }, 10000); // Save every 10 seconds
}

// Setup session watermarking
function setupSessionWatermarking() {
    // Session watermarking is handled by updateWatermark function
}

// Initialize emergency freeze
function initializeEmergencyFreeze() {
    emergencyFreezeable = true;
}

// Update watermark
function updateWatermark() {
    if (sessionId) document.getElementById('session-id').textContent = sessionId;
    if (currentUser) {
        document.getElementById('watermark-commissioner').textContent = currentUser.name;
        document.getElementById('watermark-clearance').textContent = currentUser.clearance;
    }
}

// Check authentication status
function checkAuthStatus() {
    // Check if user is already authenticated
    const savedAuth = localStorage.getItem('executiveAuth');
    if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.authenticated && new Date() - new Date(authData.loginTime) < 4 * 60 * 60 * 1000) {
            // Session valid for 4 hours only for executive level
            currentUser = authData;
            showExecutiveDashboard();
        } else {
            // Session expired
            localStorage.removeItem('executiveAuth');
        }
    }
}

// Log executive activity
function logExecutiveActivity(action, category, level) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.name : 'Anonymous',
        commissionerId: currentUser ? currentUser.commissionerId : 'Unknown',
        action: action,
        category: category,
        level: level,
        sessionId: sessionId,
        clearance: securityClearance,
        location: 'IEBC HQ',
        ip: '192.168.1.10' // Would be actual IP in production
    };
    
    auditTrail.push(logEntry);
    console.log('Executive Activity Log:', logEntry);
    
    // Store in secure off-site storage (simulation)
    storeSecureLog(logEntry);
}

// Store secure log
function storeSecureLog(logEntry) {
    // In production, this would send to secure off-site storage
    const secureStorage = JSON.parse(localStorage.getItem('secureAuditTrail') || '[]');
    secureStorage.push(logEntry);
    localStorage.setItem('secureAuditTrail', JSON.stringify(secureStorage));
}

// Show message
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.minWidth = '400px';
    messageDiv.style.maxWidth = '600px';
    messageDiv.style.fontWeight = 'bold';
    
    messageDiv.innerHTML = `
        <i class="fas fa-crown me-2"></i><strong>EXECUTIVE:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 6000);
}

// Show modal
function showModal(title, content) {
    // Create modal
    const modalHtml = `
        <div class="modal fade" id="executiveModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-crown me-2"></i>${title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <div class="text-muted small">
                            Classification: ${securityClearance} | Session: ${sessionId}
                        </div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('executiveModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('executiveModal'));
    modal.show();
}

// Logout function
function logout() {
    logExecutiveActivity('Executive logout', 'authentication', 'info');
    
    currentUser = null;
    localStorage.removeItem('executiveAuth');
    
    // Show auth section
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('main-dashboard').classList.add('d-none');
    
    // Reset forms and states
    document.getElementById('executive-login-form').reset();
    fingerprintVerified = false;
    retinaVerified = false;
    voiceVerified = false;
    biometricProgress = 0;
    
    // Reset biometric display
    document.getElementById('biometric-status').style.display = 'none';
    document.getElementById('location-status').style.display = 'none';
    
    // Reset emergency freeze
    emergencyFreezeable = true;
    document.body.style.background = '';
    
    showMessage('Executive session terminated', 'success');
}

// Save authentication state
function saveAuthState() {
    if (currentUser) {
        localStorage.setItem('executiveAuth', JSON.stringify(currentUser));
    }
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, save state
        saveAuthState();
        logExecutiveActivity('Page hidden', 'session', 'info');
    } else {
        // Page is visible, refresh data
        if (currentUser && currentUser.authenticated) {
            loadSectionData(currentSection);
            logExecutiveActivity('Page visible', 'session', 'info');
        }
    }
});

// Handle beforeunload event
window.addEventListener('beforeunload', () => {
    saveAuthState();
    logExecutiveActivity('Page unload', 'session', 'info');
});

// Export functions for global access
window.boardExecutive = {
    logout,
    navigateToSection,
    showMessage,
    logExecutiveActivity,
    getAuditTrail: () => auditTrail,
    getSecurityClearance: () => securityClearance,
    emergencyFreeze
};