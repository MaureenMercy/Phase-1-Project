// IEBC Electoral Management System
// Official IEBC Application with Multi-Account Type Support

// Global state management
let currentUser = null;
let currentPage = 'home';
let pollingStations = {};
let electionData = {};
let mediaFeeds = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeAuthentication();
    initializeDashboards();
    loadInitialData();
});

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    const quickCards = document.querySelectorAll('.quick-card[data-page]');
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });
    
    // Handle quick access cards
    quickCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const targetPage = card.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });
    
    // Mobile menu toggle (for responsive design)
    if (window.innerWidth <= 992) {
        setupMobileNavigation();
    }
}

function navigateToPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
        
        // Update navigation active state
        updateNavActiveState(pageId);
        
        // Reset authentication state for new page
        if (pageId !== 'home') {
            resetPageAuthentication(pageId);
        }
    }
}

function updateNavActiveState(activePageId) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current nav item
    const activeNavLink = document.querySelector(`[data-page="${activePageId}"]`);
    if (activeNavLink) {
        activeNavLink.closest('.nav-item').classList.add('active');
    }
}

function resetPageAuthentication(pageId) {
    // Hide dashboard and show auth form
    const authSection = document.querySelector(`#${pageId} .auth-section`);
    const dashboardSection = document.querySelector(`#${pageId} .dashboard-section`);
    
    if (authSection) authSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
}

// Authentication System
function initializeAuthentication() {
    setupVoterAuth();
    setupClerkAuth();
    setupOfficialAuth();
    setupMediaAuth();
}

function setupVoterAuth() {
    const voterForm = document.getElementById('voter-login-form');
    const authMethodSelect = document.getElementById('voter-auth-method');
    const otpSection = document.getElementById('otp-section');
    
    authMethodSelect.addEventListener('change', (e) => {
        if (e.target.value === 'otp') {
            otpSection.style.display = 'block';
            // Simulate sending OTP
            showMessage('OTP sent to your registered mobile number', 'success');
        } else {
            otpSection.style.display = 'none';
        }
    });
    
    voterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        authenticateVoter();
    });
}

function setupClerkAuth() {
    const clerkForm = document.getElementById('clerk-login-form');
    
    clerkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        authenticateClerk();
    });
}

function setupOfficialAuth() {
    const officialForm = document.getElementById('official-login-form');
    
    officialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        authenticateOfficial();
    });
}

function setupMediaAuth() {
    const mediaForm = document.getElementById('media-login-form');
    
    mediaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        authenticateMedia();
    });
}

function authenticateVoter() {
    const voterId = document.getElementById('voter-id-login').value;
    const authMethod = document.getElementById('voter-auth-method').value;
    const otp = document.getElementById('voter-otp').value;
    
    if (!voterId || !authMethod) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (authMethod === 'otp' && !otp) {
        showMessage('Please enter the OTP', 'error');
        return;
    }
    
    // Simulate authentication
    setTimeout(() => {
        currentUser = {
            type: 'voter',
            id: voterId,
            name: 'John Doe Voter',
            verified: true
        };
        
        showVoterDashboard();
        showMessage('Authentication successful!', 'success');
    }, 1000);
}

function authenticateClerk() {
    const smartcard = document.getElementById('clerk-smartcard').value;
    const passphrase = document.getElementById('clerk-passphrase').value;
    
    if (!smartcard || !passphrase) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate authentication
    setTimeout(() => {
        currentUser = {
            type: 'clerk',
            id: smartcard,
            name: 'Jane Smith',
            station: 'PS-001 - Kenyatta Primary School'
        };
        
        showClerkDashboard();
        showMessage('Clerk access granted!', 'success');
    }, 1000);
}

function authenticateOfficial() {
    const username = document.getElementById('official-username').value;
    const password = document.getElementById('official-password').value;
    const twoFA = document.getElementById('official-2fa').value;
    
    if (!username || !password || !twoFA) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate authentication
    setTimeout(() => {
        currentUser = {
            type: 'official',
            id: username,
            name: 'Commissioner Mary Johnson',
            level: 'national'
        };
        
        showOfficialDashboard();
        showMessage('Secure access granted!', 'success');
    }, 1500);
}

function authenticateMedia() {
    const company = document.getElementById('media-company').value;
    const accreditation = document.getElementById('media-accreditation').value;
    const conduct = document.getElementById('media-conduct').checked;
    
    if (!company || !accreditation || !conduct) {
        showMessage('Please complete all requirements', 'error');
        return;
    }
    
    // Simulate authentication
    setTimeout(() => {
        currentUser = {
            type: 'media',
            company: company,
            accreditation: accreditation,
            name: 'Media Representative'
        };
        
        showMediaDashboard();
        showMessage('Media access verified!', 'success');
    }, 1000);
}

// Dashboard Display Functions
function showVoterDashboard() {
    document.getElementById('voter-auth').style.display = 'none';
    document.getElementById('voter-dashboard').style.display = 'block';
    
    // Update voter status info
    document.getElementById('voter-status-info').innerHTML = `
        <p class="status-verified"><i class="fas fa-check"></i> Verified Voter</p>
        <p>Registration: Active</p>
        <p>Polling Station: Kenyatta Primary School</p>
        <p>Ward: Embakasi East</p>
    `;
}

function showClerkDashboard() {
    document.getElementById('clerk-auth').style.display = 'none';
    document.getElementById('clerk-dashboard').style.display = 'block';
    
    // Update station info
    document.getElementById('assigned-station').textContent = currentUser.station;
    document.getElementById('staff-count').textContent = '5';
    
    // Initialize clerk timer
    initializePollingTimer();
}

function showOfficialDashboard() {
    document.getElementById('official-auth').style.display = 'none';
    document.getElementById('official-dashboard').style.display = 'block';
    
    // Load national data
    loadNationalElectionData();
}

function showMediaDashboard() {
    document.getElementById('media-auth').style.display = 'none';
    document.getElementById('media-dashboard').style.display = 'block';
    
    // Load media feeds and data
    loadMediaFeeds();
}

// Dashboard Functionality
function initializeDashboards() {
    setupVoterFunctions();
    setupClerkFunctions();
    setupOfficialFunctions();
    setupMediaFunctions();
}

function setupVoterFunctions() {
    // These functions will be called by onclick events in HTML
    window.showPollingMap = function() {
        const mapDiv = document.getElementById('polling-map');
        mapDiv.style.display = 'block';
        mapDiv.innerHTML = `
            <div style="background: #f0f0f0; height: 200px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center;">
                    <i class="fas fa-map-marker-alt" style="font-size: 2rem; color: var(--iebc-primary); margin-bottom: 1rem;"></i>
                    <p><strong>Your Polling Station:</strong></p>
                    <p>Kenyatta Primary School</p>
                    <p>Embakasi East Ward</p>
                    <p class="text-success">Distance: 0.8 km</p>
                </div>
            </div>
        `;
    };
    
    window.showCandidates = function() {
        showModal('Candidate Profiles', `
            <div class="candidates-list">
                <div class="candidate-card mb-4 p-3 border rounded">
                    <h5 class="text-primary mb-3"><i class="fas fa-star me-2"></i>Presidential Candidates</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>William Ruto</strong></h6>
                                <p class="mb-1"><small class="text-muted">Party: UDA</small></p>
                                <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Rigathi Gachagua</small></p>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>Raila Odinga</strong></h6>
                                <p class="mb-1"><small class="text-muted">Party: ODM</small></p>
                                <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Martha Karua</small></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="candidate-card mb-4 p-3 border rounded">
                    <h5 class="text-success mb-3"><i class="fas fa-building me-2"></i>Governor Candidates</h5>
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>Faith Kamande</strong></h6>
                                <p class="mb-1"><small class="text-muted">Party: KANU</small></p>
                                <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: James Wanyoike</small></p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>Johnson Sakaja</strong></h6>
                                <p class="mb-1"><small class="text-muted">Party: UDA</small></p>
                                <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Ann Kananu</small></p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>Polycarp Igathe</strong></h6>
                                <p class="mb-1"><small class="text-muted">Party: ODM</small></p>
                                <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Philip Kisia</small></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="candidate-card mb-4 p-3 border rounded">
                    <h5 class="text-purple mb-3"><i class="fas fa-gavel me-2"></i>Senator Candidates</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>Karen Nyamu</strong></h6>
                                <p class="mb-0"><small class="text-muted">Party: UDA</small></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="candidate-card mb-3 p-3 border rounded">
                    <h5 class="text-warning mb-3"><i class="fas fa-users me-2"></i>Member of Parliament Candidates</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="candidate-profile p-3 border rounded">
                                <h6><strong>Kimani Ichung'wa</strong></h6>
                                <p class="mb-0"><small class="text-muted">Party: UDA</small></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    };
    
    window.showVotingInterface = function() {
        showModal('Cast Your Vote - Electronic Ballot', `
            <div class="voting-interface" style="max-height: 600px; overflow-y: auto;">
                <div class="alert alert-success mb-4">
                    <i class="fas fa-vote-yea me-2"></i>
                    <strong>Voting is now OPEN</strong> - Select your candidates below
                </div>
                
                <!-- Presidential Ballot Section -->
                <div class="ballot-section mb-4 p-3 bg-light rounded">
                    <h5 class="text-center mb-3 text-primary">
                        <i class="fas fa-star me-2"></i>PRESIDENTIAL ELECTION
                        <small class="d-block text-muted">Select ONE candidate</small>
                    </h5>
                    
                    <div class="candidate-card mb-3 p-3 border rounded bg-white" style="border-left: 4px solid #FFD700; cursor: pointer;" onclick="selectCandidate('president', 'CAND005')">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 60px; height: 60px; background: #FFD700; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-star text-white"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>William Ruto</strong></h6>
                                    <p class="mb-1"><small class="text-muted">Party: UDA</small></p>
                                    <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Rigathi Gachagua (Running Mate)</small></p>
                                </div>
                            </div>
                            <div class="vote-selector">
                                <input type="radio" name="president" id="pres1" class="form-check-input" style="transform: scale(1.5);">
                                <label for="pres1" class="btn btn-outline-success btn-sm ms-2">Select</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="candidate-card mb-3 p-3 border rounded bg-white" style="border-left: 4px solid #87CEEB; cursor: pointer;" onclick="selectCandidate('president', 'CAND004')">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 60px; height: 60px; background: #87CEEB; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-hand text-white"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Raila Odinga</strong></h6>
                                    <p class="mb-1"><small class="text-muted">Party: ODM</small></p>
                                    <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Martha Karua (Running Mate)</small></p>
                                </div>
                            </div>
                            <div class="vote-selector">
                                <input type="radio" name="president" id="pres2" class="form-check-input" style="transform: scale(1.5);">
                                <label for="pres2" class="btn btn-outline-success btn-sm ms-2">Select</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Governor Ballot Section -->
                <div class="ballot-section mb-4 p-3 bg-light rounded">
                    <h5 class="text-center mb-3 text-success">
                        <i class="fas fa-building me-2"></i>GOVERNOR ELECTION
                        <small class="d-block text-muted">Select ONE candidate</small>
                    </h5>
                    
                    <div class="candidate-card mb-3 p-3 border rounded bg-white" style="border-left: 4px solid #28a745; cursor: pointer;" onclick="selectCandidate('governor', 'CAND006')">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 60px; height: 60px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-building text-white"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Faith Kamande</strong></h6>
                                    <p class="mb-1"><small class="text-muted">Party: KANU</small></p>
                                    <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: James Wanyoike (Running Mate)</small></p>
                                </div>
                            </div>
                            <div class="vote-selector">
                                <input type="radio" name="governor" id="gov1" class="form-check-input" style="transform: scale(1.5);">
                                <label for="gov1" class="btn btn-outline-success btn-sm ms-2">Select</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="candidate-card mb-3 p-3 border rounded bg-white" style="border-left: 4px solid #17a2b8; cursor: pointer;" onclick="selectCandidate('governor', 'CAND007')">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 60px; height: 60px; background: #17a2b8; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-city text-white"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Johnson Sakaja</strong></h6>
                                    <p class="mb-1"><small class="text-muted">Party: UDA</small></p>
                                    <p class="mb-0"><small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Ann Kananu (Running Mate)</small></p>
                                </div>
                            </div>
                            <div class="vote-selector">
                                <input type="radio" name="governor" id="gov2" class="form-check-input" style="transform: scale(1.5);">
                                <label for="gov2" class="btn btn-outline-success btn-sm ms-2">Select</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Senator Ballot Section -->
                <div class="ballot-section mb-4 p-3 bg-light rounded">
                    <h5 class="text-center mb-3" style="color: #6f42c1;">
                        <i class="fas fa-gavel me-2"></i>SENATOR ELECTION
                        <small class="d-block text-muted">Select ONE candidate</small>
                    </h5>
                    
                    <div class="candidate-card mb-3 p-3 border rounded bg-white" style="border-left: 4px solid #6f42c1; cursor: pointer;" onclick="selectCandidate('senator', 'CAND001')">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 60px; height: 60px; background: #6f42c1; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-gavel text-white"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Karen Nyamu</strong></h6>
                                    <p class="mb-1"><small class="text-muted">Party: UDA</small></p>
                                </div>
                            </div>
                            <div class="vote-selector">
                                <input type="radio" name="senator" id="sen1" class="form-check-input" style="transform: scale(1.5);">
                                <label for="sen1" class="btn btn-outline-success btn-sm ms-2">Select</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- MP Ballot Section -->
                <div class="ballot-section mb-4 p-3 bg-light rounded">
                    <h5 class="text-center mb-3 text-warning">
                        <i class="fas fa-users me-2"></i>MEMBER OF PARLIAMENT
                        <small class="d-block text-muted">Select ONE candidate</small>
                    </h5>
                    
                    <div class="candidate-card mb-3 p-3 border rounded bg-white" style="border-left: 4px solid #fd7e14; cursor: pointer;" onclick="selectCandidate('mp', 'CAND002')">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 60px; height: 60px; background: #fd7e14; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-users text-white"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Kimani Ichung'wa</strong></h6>
                                    <p class="mb-1"><small class="text-muted">Party: UDA</small></p>
                                </div>
                            </div>
                            <div class="vote-selector">
                                <input type="radio" name="mp" id="mp1" class="form-check-input" style="transform: scale(1.5);">
                                <label for="mp1" class="btn btn-outline-success btn-sm ms-2">Select</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-primary btn-lg" onclick="submitVote()">
                        <i class="fas fa-check me-2"></i>SUBMIT VOTE
                    </button>
                    <button class="btn btn-secondary btn-lg ms-2" onclick="resetBallot()">
                        <i class="fas fa-undo me-2"></i>RESET
                    </button>
                </div>
                
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Note:</strong> Deputies/Running Mates are displayed for information only. Your vote is for the main candidate.
                </div>
            </div>
        `);
    };
    
    window.showBallotPreview = function() {
        showModal('Ballot Preview', `
            <div class="ballot-preview">
                <div class="ballot-section mb-4">
                    <h5 class="text-center mb-3" style="color: var(--iebc-secondary);">PRESIDENTIAL ELECTION</h5>
                    <div class="candidate-card mb-3 p-3 border rounded" style="border-left: 4px solid #FFD700;">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 50px; height: 50px; background: #FFD700; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-star"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>William Ruto</strong></h6>
                                    <small class="text-muted">Party: UDA</small><br>
                                    <small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Rigathi Gachagua (Running Mate)</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-check me-1"></i>Select Candidate
                            </button>
                        </div>
                    </div>
                    <div class="candidate-card mb-3 p-3 border rounded" style="border-left: 4px solid #87CEEB;">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 50px; height: 50px; background: #87CEEB; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-hand"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Raila Odinga</strong></h6>
                                    <small class="text-muted">Party: ODM</small><br>
                                    <small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Martha Karua (Running Mate)</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-check me-1"></i>Select Candidate
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="ballot-section mb-4">
                    <h5 class="text-center mb-3" style="color: var(--iebc-secondary);">GOVERNOR ELECTION</h5>
                    <div class="candidate-card mb-3 p-3 border rounded" style="border-left: 4px solid #28a745;">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 50px; height: 50px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Faith Kamande</strong></h6>
                                    <small class="text-muted">Party: KANU</small><br>
                                    <small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: James Wanyoike (Running Mate)</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-check me-1"></i>Select Candidate
                            </button>
                        </div>
                    </div>
                    <div class="candidate-card mb-3 p-3 border rounded" style="border-left: 4px solid #17a2b8;">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 50px; height: 50px; background: #17a2b8; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-city"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Johnson Sakaja</strong></h6>
                                    <small class="text-muted">Party: UDA</small><br>
                                    <small class="text-info"><i class="fas fa-user-tie me-1"></i>Deputy: Ann Kananu (Running Mate)</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-check me-1"></i>Select Candidate
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="ballot-section mb-4">
                    <h5 class="text-center mb-3" style="color: var(--iebc-secondary);">SENATOR ELECTION</h5>
                    <div class="candidate-card mb-3 p-3 border rounded" style="border-left: 4px solid #6f42c1;">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 50px; height: 50px; background: #6f42c1; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-gavel"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Karen Nyamu</strong></h6>
                                    <small class="text-muted">Party: UDA</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-check me-1"></i>Select Candidate
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="ballot-section mb-4">
                    <h5 class="text-center mb-3" style="color: var(--iebc-secondary);">MEMBER OF PARLIAMENT</h5>
                    <div class="candidate-card mb-3 p-3 border rounded" style="border-left: 4px solid #fd7e14;">
                        <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                                <div class="symbol me-3" style="width: 50px; height: 50px; background: #fd7e14; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="candidate-info">
                                    <h6 class="mb-1"><strong>Kimani Ichung'wa</strong></h6>
                                    <small class="text-muted">Party: UDA</small>
                                </div>
                            </div>
                            <button class="btn btn-outline-primary btn-sm">
                                <i class="fas fa-check me-1"></i>Select Candidate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    };
    
    window.startQuiz = function() {
        showMessage('Civic education quiz will be available soon', 'info');
    };
    
    window.watchVideos = function() {
        showMessage('Educational videos will be available soon', 'info');
    };
    
    window.requestAssistance = function() {
        showModal('Request Assistance', `
            <div class="assistance-request">
                <p>Our assistance service is available for voters who need help.</p>
                <div class="mb-3">
                    <label class="form-label">Type of assistance needed:</label>
                    <select class="form-select">
                        <option>Visual impairment assistance</option>
                        <option>Physical disability support</option>
                        <option>Language interpretation</option>
                        <option>General voting guidance</option>
                    </select>
                </div>
                <button class="btn btn-success">
                    <i class="fas fa-video me-1"></i>Request Video Call
                </button>
            </div>
        `);
    };
    
    // Voting Interface Functions
    window.selectCandidate = function(position, candidateId) {
        // Handle candidate selection
        const radioButton = document.querySelector(`input[name="${position}"]`);
        if (radioButton) {
            radioButton.checked = true;
            // Highlight selected candidate
            document.querySelectorAll(`input[name="${position}"]`).forEach(radio => {
                const card = radio.closest('.candidate-card');
                if (card) {
                    card.style.backgroundColor = radio.checked ? '#e8f5e8' : 'white';
                    card.style.borderWidth = radio.checked ? '2px' : '1px';
                }
            });
        }
    };
    
    window.submitVote = function() {
        const selections = {
            president: document.querySelector('input[name="president"]:checked'),
            governor: document.querySelector('input[name="governor"]:checked'),
            senator: document.querySelector('input[name="senator"]:checked'),
            mp: document.querySelector('input[name="mp"]:checked')
        };
        
        const selectedCount = Object.values(selections).filter(s => s).length;
        
        if (selectedCount === 0) {
            showMessage('Please select at least one candidate before submitting', 'warning');
            return;
        }
        
        // Confirm submission
        const confirmModal = `
            <div class="vote-confirmation">
                <h5 class="text-center mb-3"><i class="fas fa-check-circle text-success me-2"></i>Confirm Your Vote</h5>
                <p class="text-center mb-3">You have selected ${selectedCount} candidate(s). Please review and confirm:</p>
                <div class="selections-summary">
                    ${selections.president ? '<p><strong>President:</strong> ' + selections.president.closest('.candidate-card').querySelector('h6').textContent + '</p>' : ''}
                    ${selections.governor ? '<p><strong>Governor:</strong> ' + selections.governor.closest('.candidate-card').querySelector('h6').textContent + '</p>' : ''}
                    ${selections.senator ? '<p><strong>Senator:</strong> ' + selections.senator.closest('.candidate-card').querySelector('h6').textContent + '</p>' : ''}
                    ${selections.mp ? '<p><strong>MP:</strong> ' + selections.mp.closest('.candidate-card').querySelector('h6').textContent + '</p>' : ''}
                </div>
                <div class="text-center mt-4">
                    <button class="btn btn-success btn-lg me-2" onclick="finalizeVote()">
                        <i class="fas fa-check me-1"></i>CONFIRM & SUBMIT
                    </button>
                    <button class="btn btn-secondary btn-lg" onclick="closeModal()">
                        <i class="fas fa-times me-1"></i>Go Back
                    </button>
                </div>
            </div>
        `;
        showModal('Confirm Vote Submission', confirmModal);
    };
    
    window.finalizeVote = function() {
        // Simulate vote submission
        closeModal();
        showMessage('Your vote has been successfully submitted and recorded!', 'success');
        setTimeout(() => {
            closeModal(); // Close the voting interface
        }, 2000);
    };
    
    window.resetBallot = function() {
        // Reset all selections
        document.querySelectorAll('.voting-interface input[type="radio"]').forEach(radio => {
            radio.checked = false;
            const card = radio.closest('.candidate-card');
            if (card) {
                card.style.backgroundColor = 'white';
                card.style.borderWidth = '1px';
            }
        });
        showMessage('Ballot has been reset', 'info');
    };
    
    window.closeModal = function() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    };
}

function setupClerkFunctions() {
    window.simulateBiometric = function() {
        showMessage('Biometric scan simulated successfully', 'success');
    };
    
    window.openPoll = function() {
        document.getElementById('open-poll-btn').style.display = 'none';
        document.getElementById('close-poll-btn').style.display = 'inline-block';
        document.getElementById('poll-timer').textContent = 'Polling open - 12:00:00 remaining';
        showMessage('Polling station opened successfully', 'success');
        
        // Start countdown timer
        startPollingTimer();
    };
    
    window.closePoll = function() {
        document.getElementById('open-poll-btn').style.display = 'inline-block';
        document.getElementById('close-poll-btn').style.display = 'none';
        document.getElementById('poll-timer').textContent = 'Polling closed';
        showMessage('Polling station closed', 'info');
    };
    
    window.verifyInventory = function() {
        showMessage('Ballot inventory verified and matches', 'success');
    };
    
    window.reportIrregularity = function(type) {
        let message = '';
        switch(type) {
            case 'violence':
                message = 'Violence reported to authorities';
                break;
            case 'machine_failure':
                message = 'Machine failure reported for technical support';
                break;
            case 'impersonation':
                message = 'Voter impersonation reported to security';
                break;
        }
        showMessage(message, 'warning');
    };
    
    window.submitFinalCount = function() {
        showModal('Submit Final Count', `
            <div class="final-count-form">
                <h5>Final Vote Count Submission</h5>
                <div class="mb-3">
                    <label class="form-label">Total Votes Cast:</label>
                    <input type="number" class="form-control" value="1247" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Spoiled Ballots:</label>
                    <input type="number" class="form-control" value="12">
                </div>
                <div class="mb-3">
                    <label class="form-label">Digital Signature:</label>
                    <input type="password" class="form-control" placeholder="Enter secure passphrase">
                </div>
                <button class="btn btn-success">
                    <i class="fas fa-upload me-1"></i>Submit to Bomas
                </button>
            </div>
        `);
    };
}

function setupOfficialFunctions() {
    window.showAnomalies = function() {
        showModal('Polling Station Anomalies', `
            <div class="anomalies-list">
                <div class="alert alert-warning">
                    <strong>PS-045:</strong> Delayed opening (30 minutes) - Resolved
                </div>
                <div class="alert alert-danger">
                    <strong>PS-123:</strong> Internet connectivity issues - In Progress
                </div>
                <div class="alert alert-info">
                    <strong>PS-089:</strong> High voter turnout causing queues - Monitoring
                </div>
            </div>
        `);
    };
    
    window.accessTallying = function() {
        showMessage('Accessing secure tallying system...', 'info');
    };
    
    window.reviewResults = function() {
        showMessage('Results review queue accessed', 'info');
    };
    
    window.accessEvidence = function() {
        showMessage('Evidence repository accessed', 'info');
    };
    
    window.assignClerks = function() {
        showMessage('Clerk assignment interface loaded', 'info');
    };
    
    window.publishResults = function() {
        showMessage('Results publication interface loaded', 'info');
    };
    
    window.lockSystem = function() {
        showMessage('System lock/unlock controls accessed', 'info');
    };
}

function setupMediaFunctions() {
    window.viewFeeds = function() {
        showMessage('Polling station feeds interface loaded', 'info');
    };
    
    window.viewCandidateData = function() {
        showMessage('Candidate analytics dashboard loaded', 'info');
    };
    
    window.generateEmbed = function(type) {
        showModal('Embed Code Generator', `
            <div class="embed-generator">
                <h5>Generated Embed Code - ${type.toUpperCase()}</h5>
                <textarea class="form-control" rows="4" readonly>&lt;iframe src="https://iebc.or.ke/embed/${type}" width="100%" height="400"&gt;&lt;/iframe&gt;</textarea>
                <button class="btn btn-primary mt-2" onclick="copyToClipboard()">
                    <i class="fas fa-copy me-1"></i>Copy Code
                </button>
            </div>
        `);
    };
    
    window.downloadData = function(type) {
        showMessage(`${type} data pack download initiated`, 'success');
    };
    
    window.requestInterview = function(type) {
        showMessage(`Interview request submitted for ${type}`, 'info');
    };
    
    window.reportMisinformation = function() {
        showModal('Report Misinformation', `
            <div class="misinformation-report">
                <div class="mb-3">
                    <label class="form-label">Source/Platform:</label>
                    <input type="text" class="form-control" placeholder="e.g., Facebook, Twitter, WhatsApp">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description:</label>
                    <textarea class="form-control" rows="3" placeholder="Describe the false information"></textarea>
                </div>
                <button class="btn btn-warning">
                    <i class="fas fa-flag me-1"></i>Submit Report
                </button>
            </div>
        `);
    };
}

// Utility Functions
function showMessage(message, type = 'success') {
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

function showModal(title, content) {
    document.getElementById('dynamicModalLabel').textContent = title;
    document.getElementById('dynamicModalBody').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
    modal.show();
}

function startPollingTimer() {
    let timeLeft = 12 * 60 * 60; // 12 hours in seconds
    
    const timer = setInterval(() => {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('poll-timer').textContent = 
            `Polling open - ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} remaining`;
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            window.closePoll();
        }
    }, 1000);
}

function initializePollingTimer() {
    document.getElementById('poll-timer').textContent = 'Polling closed';
}

function loadInitialData() {
    // Simulate loading initial election data
    electionData = {
        totalStations: 1250,
        activeStations: 1247,
        totalVoters: 12500000,
        registeredVoters: 22120000
    };
    
    // Update any dashboard stats
    setTimeout(() => {
        const resultsReceived = document.getElementById('results-received');
        const resultsVerified = document.getElementById('results-verified');
        
        if (resultsReceived) resultsReceived.textContent = '234';
        if (resultsVerified) resultsVerified.textContent = '220';
    }, 1000);
}

function loadNationalElectionData() {
    // Simulate loading national election monitoring data
    showMessage('Loading national election data...', 'info');
}

function loadMediaFeeds() {
    // Simulate loading media feeds and data
    showMessage('Loading live media feeds...', 'info');
}

function setupMobileNavigation() {
    // Add mobile menu toggle functionality if needed
    const sidebar = document.querySelector('.iebc-sidebar');
    
    // Create mobile menu button
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'btn btn-primary position-fixed';
    mobileMenuBtn.style.cssText = 'top: 20px; left: 20px; z-index: 1001; display: none;';
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    document.body.appendChild(mobileMenuBtn);
    
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Show mobile menu button on small screens
    if (window.innerWidth <= 992) {
        mobileMenuBtn.style.display = 'block';
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// Form handling for clerk voter check-in
document.addEventListener('DOMContentLoaded', () => {
    const checkinForm = document.getElementById('voter-checkin-form');
    if (checkinForm) {
        checkinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const voterId = document.getElementById('checkin-voter-id').value;
            if (voterId) {
                showMessage('Voter checked in successfully', 'success');
                document.getElementById('checkin-voter-id').value = '';
                
                // Update checkin count
                const countElement = document.getElementById('checkin-count');
                if (countElement) {
                    const currentCount = parseInt(countElement.textContent) || 0;
                    countElement.textContent = currentCount + 1;
                }
            }
        });
    }
});

// Copy to clipboard function
window.copyToClipboard = function() {
    const textarea = document.querySelector('#dynamicModal textarea');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showMessage('Code copied to clipboard', 'success');
    }
};