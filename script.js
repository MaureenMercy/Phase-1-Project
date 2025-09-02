// E-Ballot Voting System JavaScript
class EBallotSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 6;
        this.voterData = null;
        this.votes = {};
        this.candidates = {};
        this.skippedVotes = 0;
        this.maxSkips = 2; // MCA and Women Rep can be skipped
        
        this.initializeEventListeners();
        this.loadMockData();
    }

    initializeEventListeners() {
        // Login method tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLoginMethod(e.target.dataset.method));
        });

        // Biometric scan
        document.getElementById('biometric-scan').addEventListener('click', () => this.handleBiometricScan());

        // OTP request and verification
        document.getElementById('request-otp').addEventListener('click', () => this.requestOTP());
        document.getElementById('verify-otp').addEventListener('click', () => this.verifyOTP());

        // Proceed to voting
        document.getElementById('proceed-to-voting').addEventListener('click', () => this.proceedToVoting());

        // Voting navigation
        document.getElementById('prev-btn').addEventListener('click', () => this.previousStep());
        document.getElementById('next-btn').addEventListener('click', () => this.nextStep());
        document.getElementById('skip-btn').addEventListener('click', () => this.skipVote());

        // Review and submit
        document.getElementById('edit-votes').addEventListener('click', () => this.editVotes());
        document.getElementById('submit-vote').addEventListener('click', () => this.submitVote());

        // Accessibility controls
        document.getElementById('language-toggle').addEventListener('click', () => this.toggleLanguage());
        document.getElementById('font-size-toggle').addEventListener('click', () => this.toggleFontSize());
        document.getElementById('voice-toggle').addEventListener('click', () => this.toggleVoice());
    }

    switchLoginMethod(method) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // Update method content
        document.querySelectorAll('.method').forEach(method => method.classList.remove('active'));
        document.getElementById(`${method}-method`).classList.add('active');
    }

    handleBiometricScan() {
        const scanBtn = document.getElementById('biometric-scan');
        const scannerIcon = document.querySelector('.scanner-icon');
        
        // Simulate biometric scan
        scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
        scanBtn.disabled = true;
        scannerIcon.style.animation = 'pulse 0.5s infinite';

        setTimeout(() => {
            // Simulate successful scan
            this.voterData = this.getMockVoterData();
            this.displayVoterInfo();
            scanBtn.innerHTML = '<i class="fas fa-check"></i> Scan Complete';
            scanBtn.style.background = '#4CAF50';
            scannerIcon.style.animation = 'none';
        }, 3000);
    }

    requestOTP() {
        const idNumber = document.getElementById('id-number').value;
        const phoneNumber = document.getElementById('phone-number').value;

        if (!idNumber || !phoneNumber) {
            alert('Please fill in all fields');
            return;
        }

        // Simulate OTP request
        const otpBtn = document.getElementById('request-otp');
        otpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
        otpBtn.disabled = true;

        setTimeout(() => {
            document.getElementById('otp-verification').style.display = 'block';
            otpBtn.innerHTML = '<i class="fas fa-paper-plane"></i> OTP Sent';
            otpBtn.style.background = '#4CAF50';
        }, 2000);
    }

    verifyOTP() {
        const otpCode = document.getElementById('otp-code').value;

        if (!otpCode || otpCode.length !== 6) {
            alert('Please enter a valid 6-digit OTP code');
            return;
        }

        // Simulate OTP verification
        const verifyBtn = document.getElementById('verify-otp');
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        verifyBtn.disabled = true;

        setTimeout(() => {
            this.voterData = this.getMockVoterData();
            this.displayVoterInfo();
            verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
            verifyBtn.style.background = '#4CAF50';
        }, 2000);
    }

    displayVoterInfo() {
        if (!this.voterData) return;

        document.getElementById('voter-name').textContent = this.voterData.name;
        document.getElementById('voter-id').textContent = this.voterData.idNumber;
        document.getElementById('voter-county').textContent = this.voterData.county;
        document.getElementById('voter-constituency').textContent = this.voterData.constituency;
        document.getElementById('voter-ward').textContent = this.voterData.ward;

        document.getElementById('voter-info').style.display = 'block';
    }

    proceedToVoting() {
        if (!this.voterData) {
            alert('Please complete verification first');
            return;
        }

        // Hide login page and show voting flow
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('voting-flow').classList.add('active');

        // Load candidates for voter's location
        this.loadCandidatesForVoter();
        this.updateProgress();
        this.showCurrentScreen();
    }

    loadCandidatesForVoter() {
        const { county, constituency, ward } = this.voterData;

        // Filter candidates based on voter's location
        this.candidates = {
            mca: this.candidates.mca.filter(c => c.ward === ward),
            mp: this.candidates.mp.filter(c => c.constituency === constituency),
            womenRep: this.candidates.womenRep.filter(c => c.county === county),
            senator: this.candidates.senator.filter(c => c.county === county),
            governor: this.candidates.governor.filter(c => c.county === county),
            president: this.candidates.president // National ballot
        };

        // Update location displays
        document.getElementById('ward-name').textContent = ward;
        document.getElementById('constituency-name').textContent = constituency;
        document.getElementById('county-name').textContent = county;
        document.getElementById('senator-county-name').textContent = county;
        document.getElementById('governor-county-name').textContent = county;
    }

    showCurrentScreen() {
        // Hide all screens
        document.querySelectorAll('.voting-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show current screen
        const screenNames = ['mca', 'mp', 'women-rep', 'senator', 'governor', 'president'];
        const currentScreen = document.getElementById(`${screenNames[this.currentStep - 1]}-screen`);
        currentScreen.classList.add('active');

        // Load candidates for current screen
        this.loadCandidatesForScreen(screenNames[this.currentStep - 1]);

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    loadCandidatesForScreen(screenType) {
        const container = document.getElementById(`${screenType}-candidates`);
        const candidates = this.candidates[screenType] || [];

        container.innerHTML = '';

        if (candidates.length === 0) {
            container.innerHTML = '<p class="no-candidates">No candidates available for this position.</p>';
            return;
        }

        candidates.forEach(candidate => {
            const card = this.createCandidateCard(candidate, screenType);
            container.appendChild(card);
        });
    }

    createCandidateCard(candidate, screenType) {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.dataset.candidateId = candidate.id;

        const isSelected = this.votes[screenType] === candidate.id;
        if (isSelected) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="candidate-photo">
                ${candidate.photo ? `<img src="${candidate.photo}" alt="${candidate.name}">` : '<i class="fas fa-user"></i>'}
            </div>
            <div class="candidate-name">${candidate.name}</div>
            <div class="party-info">
                <div class="party-logo">${candidate.party.substring(0, 2).toUpperCase()}</div>
                <div class="party-name">${candidate.party}</div>
            </div>
            ${candidate.deputy ? `<div class="deputy-info">Deputy: ${candidate.deputy}</div>` : ''}
            <button class="select-btn ${isSelected ? 'selected' : ''}" onclick="ballotSystem.selectCandidate('${screenType}', '${candidate.id}')">
                ${isSelected ? 'Selected ✓' : 'Select'}
            </button>
        `;

        return card;
    }

    selectCandidate(screenType, candidateId) {
        // Check if already voted for this position
        if (this.votes[screenType] && this.votes[screenType] !== candidateId) {
            if (!confirm('You have already selected a candidate for this position. Do you want to change your selection?')) {
                return;
            }
        }

        // Update vote
        this.votes[screenType] = candidateId;

        // Update UI
        this.loadCandidatesForScreen(screenType);
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const skipBtn = document.getElementById('skip-btn');

        // Previous button
        prevBtn.disabled = this.currentStep === 1;

        // Next button
        const screenNames = ['mca', 'mp', 'women-rep', 'senator', 'governor', 'president'];
        const currentScreenType = screenNames[this.currentStep - 1];
        const hasVote = this.votes[currentScreenType];
        const isOptional = ['mca', 'women-rep'].includes(currentScreenType);

        nextBtn.disabled = !hasVote && !isOptional;

        // Skip button (only for MCA and Women Rep)
        if (isOptional && !hasVote) {
            skipBtn.style.display = 'block';
            skipBtn.disabled = this.skippedVotes >= this.maxSkips;
        } else {
            skipBtn.style.display = 'none';
        }

        // Change next button text for last step
        if (this.currentStep === this.totalSteps) {
            nextBtn.innerHTML = 'Review Votes <i class="fas fa-clipboard-check"></i>';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
            this.showCurrentScreen();
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateProgress();
            this.showCurrentScreen();
        } else {
            this.showReviewPage();
        }
    }

    skipVote() {
        const screenNames = ['mca', 'mp', 'women-rep', 'senator', 'governor', 'president'];
        const currentScreenType = screenNames[this.currentStep - 1];

        if (this.skippedVotes >= this.maxSkips) {
            alert('You have reached the maximum number of skips allowed.');
            return;
        }

        this.skippedVotes++;
        this.votes[currentScreenType] = null;
        this.nextStep();
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        progressFill.style.width = `${progressPercentage}%`;

        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < this.currentStep) {
                step.classList.add('completed');
            } else if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });
    }

    showReviewPage() {
        document.getElementById('voting-flow').classList.remove('active');
        document.getElementById('review-page').classList.add('active');

        this.generateVoteSummary();
    }

    generateVoteSummary() {
        const summaryContainer = document.getElementById('votes-summary');
        const positions = [
            { key: 'mca', name: 'Member of County Assembly (MCA)' },
            { key: 'mp', name: 'Member of National Assembly (MP)' },
            { key: 'womenRep', name: 'County Woman Representative' },
            { key: 'senator', name: 'Senator' },
            { key: 'governor', name: 'Governor' },
            { key: 'president', name: 'President' }
        ];

        let summaryHTML = '<table class="summary-table"><thead><tr><th>Position</th><th>Candidate</th><th>Deputy</th><th>Party</th></tr></thead><tbody>';

        positions.forEach(position => {
            const vote = this.votes[position.key];
            if (vote) {
                const candidate = this.candidates[position.key].find(c => c.id === vote);
                summaryHTML += `
                    <tr>
                        <td>${position.name}</td>
                        <td>${candidate.name}</td>
                        <td>${candidate.deputy || '-'}</td>
                        <td>${candidate.party}</td>
                    </tr>
                `;
            } else {
                summaryHTML += `
                    <tr>
                        <td>${position.name}</td>
                        <td><em>No selection</em></td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                `;
            }
        });

        summaryHTML += '</tbody></table>';
        summaryContainer.innerHTML = summaryHTML;
    }

    editVotes() {
        document.getElementById('review-page').classList.remove('active');
        document.getElementById('voting-flow').classList.add('active');
    }

    submitVote() {
        if (!confirm('Are you sure you want to submit your vote? This action cannot be undone.')) {
            return;
        }

        // Generate vote receipt
        const voteId = this.generateVoteId();
        const timestamp = new Date().toLocaleString();
        const location = `${this.voterData.ward}, ${this.voterData.constituency}, ${this.voterData.county}`;

        // Show confirmation page
        document.getElementById('review-page').classList.remove('active');
        document.getElementById('confirmation-page').classList.add('active');

        // Update confirmation details
        document.getElementById('vote-id').textContent = voteId;
        document.getElementById('vote-timestamp').textContent = timestamp;
        document.getElementById('vote-location').textContent = location;

        // Simulate blockchain entry and server sync
        this.simulateVoteSubmission(voteId);
    }

    generateVoteId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    simulateVoteSubmission(voteId) {
        // Simulate blockchain entry and server sync
        console.log('Vote submitted:', {
            voteId,
            voterId: this.voterData.idNumber,
            votes: this.votes,
            timestamp: new Date().toISOString(),
            location: this.voterData
        });

        // Lock voter account (prevent duplicate voting)
        localStorage.setItem(`voted_${this.voterData.idNumber}`, 'true');
    }

    // Accessibility functions
    toggleLanguage() {
        // Toggle between English and Swahili
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'en' ? 'sw' : 'en';
        document.documentElement.lang = newLang;
        
        // Update UI text based on language
        this.updateLanguageText(newLang);
    }

    updateLanguageText(lang) {
        // This would contain translations for all UI text
        // For demo purposes, we'll just show a message
        alert(`Language switched to ${lang === 'sw' ? 'Swahili' : 'English'}`);
    }

    toggleFontSize() {
        document.body.classList.toggle('large-font');
    }

    toggleVoice() {
        // Toggle voice-over functionality
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Voice assistance activated');
            speechSynthesis.speak(utterance);
        }
    }

    // Mock data for demonstration
    loadMockData() {
        this.candidates = {
            mca: [
                { id: 'mca1', name: 'John Kamau', party: 'UDA', ward: 'Kiambu Central', photo: null },
                { id: 'mca2', name: 'Mary Wanjiku', party: 'ODM', ward: 'Kiambu Central', photo: null },
                { id: 'mca3', name: 'Peter Mwangi', party: 'KANU', ward: 'Kiambu Central', photo: null },
                { id: 'mca4', name: 'Grace Njeri', party: 'Jubilee', ward: 'Kiambu Central', photo: null }
            ],
            mp: [
                { id: 'mp1', name: 'Faith Kamande', party: 'KANU', constituency: 'Kiambu', photo: null },
                { id: 'mp2', name: 'Peter Ndung\'u', party: 'UDA', constituency: 'Kiambu', photo: null },
                { id: 'mp3', name: 'Ann Wangari', party: 'ODM', constituency: 'Kiambu', photo: null }
            ],
            womenRep: [
                { id: 'wr1', name: 'Susan Kariuki', party: 'UDA', county: 'Kiambu', photo: null },
                { id: 'wr2', name: 'Jane Muthoni', party: 'ODM', county: 'Kiambu', photo: null },
                { id: 'wr3', name: 'Grace Wanjiku', party: 'KANU', county: 'Kiambu', photo: null }
            ],
            senator: [
                { id: 'sen1', name: 'James Wanyoike', party: 'KANU', county: 'Kiambu', photo: null },
                { id: 'sen2', name: 'David Kimani', party: 'UDA', county: 'Kiambu', photo: null },
                { id: 'sen3', name: 'Elizabeth Njoki', party: 'ODM', county: 'Kiambu', photo: null }
            ],
            governor: [
                { id: 'gov1', name: 'Faith Kamande', party: 'KANU', county: 'Kiambu', deputy: 'James Wanyoike', photo: null },
                { id: 'gov2', name: 'Peter Ndung\'u', party: 'UDA', county: 'Kiambu', deputy: 'Ann Wangari', photo: null },
                { id: 'gov3', name: 'Miriam Odhiambo', party: 'ODM', county: 'Kiambu', deputy: 'Elijah Kariuki', photo: null }
            ],
            president: [
                { id: 'pres1', name: 'William Ruto', party: 'UDA', deputy: 'Rigathi Gachagua', photo: null },
                { id: 'pres2', name: 'Raila Odinga', party: 'ODM', deputy: 'Martha Karua', photo: null },
                { id: 'pres3', name: 'George Wajackoyah', party: 'Roots Party', deputy: 'Justina Wamae', photo: null }
            ]
        };
    }

    getMockVoterData() {
        return {
            name: 'John Doe Kamau',
            idNumber: '12345678',
            county: 'Kiambu',
            constituency: 'Kiambu',
            ward: 'Kiambu Central'
        };
    }
}

// Initialize the ballot system when the page loads
let ballotSystem;
document.addEventListener('DOMContentLoaded', () => {
    ballotSystem = new EBallotSystem();
});

// Check if voter has already voted
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const voterId = urlParams.get('voterId');
    
    if (voterId && localStorage.getItem(`voted_${voterId}`)) {
        alert('You have already voted in this election. Your account is locked.');
        // Redirect to a "already voted" page or show appropriate message
    }
});