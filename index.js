// API base URL
const API_URL = 'http://localhost:3000';

// Global state
let currentData = {
    voters: [],
    candidates: [],
    elections: [],
    ballots: [],
    votes: [],
    pollingStations: [],
    observers: [],
    users: [],
    auditLogs: []
};

// Utility functions
const showLoading = (button) => {
    button.classList.add('loading');
    button.disabled = true;
};

const hideLoading = (button) => {
    button.classList.remove('loading');
    button.disabled = false;
};

const showMessage = (message, type = 'success') => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-${type}`;
    messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>${message}`;
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
};

const updateDashboardStats = () => {
    document.getElementById('total-voters').textContent = currentData.voters.length;
    document.getElementById('total-candidates').textContent = currentData.candidates.length;
    document.getElementById('total-elections').textContent = currentData.elections.length;
    document.getElementById('total-votes').textContent = currentData.votes.length;
};

const showModal = (title, content) => {
    document.getElementById('dataModalLabel').textContent = title;
    document.getElementById('dataModalBody').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('dataModal'));
    modal.show();
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const validateForm = (form) => {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
};

// API functions
const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showMessage(`API Error: ${error.message}`, 'error');
        throw error;
    }
};

// Data loading functions
const loadAllData = async () => {
    try {
        const [voters, candidates, elections, ballots, votes, pollingStations, observers, users] = await Promise.all([
            apiCall('/voters'),
            apiCall('/candidates'),
            apiCall('/elections'),
            apiCall('/ballots').catch(() => []),
            apiCall('/votes'),
            apiCall('/pollingStations').catch(() => []),
            apiCall('/observers').catch(() => []),
            apiCall('/users').catch(() => [])
        ]);
        
        currentData = {
            voters: voters || [],
            candidates: candidates || [],
            elections: elections || [],
            ballots: ballots || [],
            votes: votes || [],
            pollingStations: pollingStations || [],
            observers: observers || [],
            users: users || [],
            auditLogs: []
        };
        
        updateDashboardStats();
        populateDropdowns();
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading initial data', 'error');
    }
};

const populateDropdowns = () => {
    // Populate election dropdowns
    const electionSelects = document.querySelectorAll('#ballot-election, #voting-election-id, #results-election-id');
    electionSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Election</option>';
        currentData.elections.forEach(election => {
            select.innerHTML += `<option value="${election.id}">${election.name}</option>`;
        });
    });
    
    // Populate candidate dropdown for voting
    const candidateSelect = document.getElementById('voting-candidate-id');
    candidateSelect.innerHTML = '<option value="">Select Candidate</option>';
    currentData.candidates.forEach(candidate => {
        candidateSelect.innerHTML += `<option value="${candidate.id}">${candidate.name} (${candidate.party})</option>`;
    });
    
    // Populate polling stations for observer assignment
    const stationSelect = document.getElementById('observer-assignment');
    stationSelect.innerHTML = '<option value="">Select Station (Optional)</option>';
    currentData.pollingStations.forEach(station => {
        stationSelect.innerHTML += `<option value="${station.id}">${station.name}</option>`;
    });
};

// Voter Management
const setupVoterManagement = () => {
    const voterForm = document.getElementById('voter-form');
    const searchButton = document.getElementById('search-voter');
    const searchDiv = document.getElementById('voter-search');
    const searchInput = document.getElementById('voter-search-input');
    
    voterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(voterForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = voterForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const voter = {
            id: document.getElementById('voter-id').value,
            name: document.getElementById('voter-name').value,
            dob: document.getElementById('voter-dob').value,
            address: document.getElementById('voter-address').value,
            phone: document.getElementById('voter-phone').value,
            status: 'Active',
            registrationDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/voters', 'POST', voter);
            voterForm.reset();
            showMessage('Voter registered successfully!');
            await loadAllData();
            updateAuditLog(`Voter registered: ${voter.name}`);
        } catch (error) {
            showMessage('Failed to register voter', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    searchButton.addEventListener('click', () => {
        searchDiv.style.display = searchDiv.style.display === 'none' ? 'block' : 'none';
    });
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredVoters = currentData.voters.filter(voter => 
            voter.name.toLowerCase().includes(query) || 
            voter.id.includes(query)
        );
        displayVotersList(filteredVoters);
    });
    
    document.getElementById('view-voters').addEventListener('click', () => {
        displayVotersList(currentData.voters);
    });
    
    document.getElementById('verify-voter').addEventListener('click', verifyVoter);
};

const displayVotersList = (voters) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date of Birth</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${voters.map(voter => `
                        <tr>
                            <td>${voter.id}</td>
                            <td>${voter.name}</td>
                            <td>${formatDate(voter.dob)}</td>
                            <td>${voter.phone || 'N/A'}</td>
                            <td><span class="badge bg-success">${voter.status || 'Active'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editVoter('${voter.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteVoter('${voter.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('Registered Voters', content);
};

const verifyVoter = async () => {
    const voterId = document.getElementById('voting-voter-id').value;
    if (!voterId) {
        showMessage('Please enter a voter ID', 'error');
        return;
    }
    
    const voter = currentData.voters.find(v => v.id === voterId);
    if (voter) {
        const verificationDiv = document.getElementById('voter-verification');
        const detailsDiv = document.getElementById('voter-details');
        
        detailsDiv.innerHTML = `
            <p><strong>Name:</strong> ${voter.name}</p>
            <p><strong>ID:</strong> ${voter.id}</p>
            <p><strong>Date of Birth:</strong> ${formatDate(voter.dob)}</p>
            <p><strong>Status:</strong> <span class="status-active">${voter.status || 'Active'}</span></p>
        `;
        
        verificationDiv.style.display = 'block';
        showMessage('Voter verified successfully!');
    } else {
        showMessage('Voter not found', 'error');
    }
};

// Candidate Management
const setupCandidateManagement = () => {
    const candidateForm = document.getElementById('candidate-form');
    
    candidateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(candidateForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = candidateForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const candidate = {
            id: document.getElementById('candidate-id').value,
            name: document.getElementById('candidate-name').value,
            party: document.getElementById('candidate-party').value,
            position: document.getElementById('candidate-position').value,
            registrationDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/candidates', 'POST', candidate);
            candidateForm.reset();
            showMessage('Candidate added successfully!');
            await loadAllData();
            updateAuditLog(`Candidate added: ${candidate.name}`);
        } catch (error) {
            showMessage('Failed to add candidate', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    document.getElementById('view-candidates').addEventListener('click', () => {
        displayCandidatesList(currentData.candidates);
    });
};

const displayCandidatesList = (candidates) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Party</th>
                        <th>Position</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${candidates.map(candidate => `
                        <tr>
                            <td>${candidate.id}</td>
                            <td>${candidate.name}</td>
                            <td>${candidate.party}</td>
                            <td>${candidate.position || 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editCandidate('${candidate.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate('${candidate.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('Candidates', content);
};

// Election Management
const setupElectionManagement = () => {
    const electionForm = document.getElementById('election-form');
    
    electionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(electionForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = electionForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const election = {
            id: document.getElementById('election-id').value,
            name: document.getElementById('election-name').value,
            date: document.getElementById('election-date').value,
            type: document.getElementById('election-type').value,
            constituency: document.getElementById('election-constituency').value,
            status: 'Upcoming',
            createdDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/elections', 'POST', election);
            electionForm.reset();
            showMessage('Election created successfully!');
            await loadAllData();
            updateAuditLog(`Election created: ${election.name}`);
        } catch (error) {
            showMessage('Failed to create election', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    document.getElementById('view-elections').addEventListener('click', () => {
        displayElectionsList(currentData.elections);
    });
};

const displayElectionsList = (elections) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Constituency</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${elections.map(election => `
                        <tr>
                            <td>${election.id}</td>
                            <td>${election.name}</td>
                            <td>${formatDate(election.date)}</td>
                            <td>${election.type || 'N/A'}</td>
                            <td>${election.constituency || 'N/A'}</td>
                            <td><span class="badge bg-warning">${election.status || 'Upcoming'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editElection('${election.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteElection('${election.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('Elections', content);
};

// Ballot Management
const setupBallotManagement = () => {
    const ballotForm = document.getElementById('ballot-form');
    
    ballotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(ballotForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = ballotForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const ballot = {
            id: document.getElementById('ballot-id').value,
            electionId: document.getElementById('ballot-election').value,
            title: document.getElementById('ballot-title').value,
            instructions: document.getElementById('ballot-instructions').value,
            createdDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/ballots', 'POST', ballot);
            ballotForm.reset();
            showMessage('Ballot created successfully!');
            await loadAllData();
            updateAuditLog(`Ballot created: ${ballot.title}`);
        } catch (error) {
            showMessage('Failed to create ballot', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    document.getElementById('view-ballots').addEventListener('click', () => {
        displayBallotsList(currentData.ballots);
    });
};

const displayBallotsList = (ballots) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Election</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${ballots.map(ballot => {
                        const election = currentData.elections.find(e => e.id === ballot.electionId);
                        return `
                            <tr>
                                <td>${ballot.id}</td>
                                <td>${ballot.title}</td>
                                <td>${election ? election.name : 'Unknown'}</td>
                                <td>${formatDate(ballot.createdDate)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="previewBallot('${ballot.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editBallot('${ballot.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBallot('${ballot.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('Ballots', content);
};

// Vote Casting
const setupVoteCasting = () => {
    const voteForm = document.getElementById('vote-form');
    
    voteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(voteForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const confirmCheckbox = document.getElementById('confirm-vote');
        if (!confirmCheckbox.checked) {
            showMessage('Please confirm your vote before submitting', 'error');
            return;
        }
        
        const submitBtn = voteForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const vote = {
            id: Date.now().toString(),
            voterId: document.getElementById('voting-voter-id').value,
            electionId: document.getElementById('voting-election-id').value,
            candidateId: document.getElementById('voting-candidate-id').value,
            timestamp: new Date().toISOString(),
            pollingStation: 'Station-001' // This would be dynamic in a real system
        };
        
        try {
            await apiCall('/votes', 'POST', vote);
            voteForm.reset();
            document.getElementById('voter-verification').style.display = 'none';
            showMessage('Vote cast successfully!');
            await loadAllData();
            updateAuditLog(`Vote cast by voter ID: ${vote.voterId}`);
        } catch (error) {
            showMessage('Failed to cast vote', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
};

// Polling Station Management
const setupPollingStationManagement = () => {
    const stationForm = document.getElementById('polling-station-form');
    
    stationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(stationForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = stationForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const station = {
            id: document.getElementById('station-id').value,
            name: document.getElementById('station-name').value,
            location: document.getElementById('station-location').value,
            capacity: parseInt(document.getElementById('station-capacity').value),
            status: document.getElementById('station-status').value,
            createdDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/pollingStations', 'POST', station);
            stationForm.reset();
            showMessage('Polling station added successfully!');
            await loadAllData();
            updateAuditLog(`Polling station added: ${station.name}`);
        } catch (error) {
            showMessage('Failed to add polling station', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    document.getElementById('view-stations').addEventListener('click', () => {
        displayStationsList(currentData.pollingStations);
    });
};

const displayStationsList = (stations) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${stations.map(station => `
                        <tr>
                            <td>${station.id}</td>
                            <td>${station.name}</td>
                            <td>${station.location}</td>
                            <td>${station.capacity}</td>
                            <td><span class="badge ${station.status === 'Active' ? 'bg-success' : station.status === 'Inactive' ? 'bg-danger' : 'bg-warning'}">${station.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editStation('${station.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteStation('${station.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('Polling Stations', content);
};

// Observer Management
const setupObserverManagement = () => {
    const observerForm = document.getElementById('observer-form');
    
    observerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(observerForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = observerForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const observer = {
            id: document.getElementById('observer-id').value,
            name: document.getElementById('observer-name').value,
            organization: document.getElementById('observer-organization').value,
            type: document.getElementById('observer-type').value,
            assignment: document.getElementById('observer-assignment').value,
            registrationDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/observers', 'POST', observer);
            observerForm.reset();
            showMessage('Observer registered successfully!');
            await loadAllData();
            updateAuditLog(`Observer registered: ${observer.name}`);
        } catch (error) {
            showMessage('Failed to register observer', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    document.getElementById('view-observers').addEventListener('click', () => {
        displayObserversList(currentData.observers);
    });
};

const displayObserversList = (observers) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Organization</th>
                        <th>Type</th>
                        <th>Assignment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${observers.map(observer => {
                        const station = currentData.pollingStations.find(s => s.id === observer.assignment);
                        return `
                            <tr>
                                <td>${observer.id}</td>
                                <td>${observer.name}</td>
                                <td>${observer.organization}</td>
                                <td>${observer.type}</td>
                                <td>${station ? station.name : observer.assignment || 'Unassigned'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editObserver('${observer.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteObserver('${observer.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('Observers', content);
};

// Results Management
const setupResultsManagement = () => {
    const resultsForm = document.getElementById('results-form');
    
    resultsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const electionId = document.getElementById('results-election-id').value;
        if (!electionId) {
            showMessage('Please select an election', 'error');
            return;
        }
        
        displayElectionResults(electionId);
    });
    
    document.getElementById('export-results').addEventListener('click', exportResults);
    document.getElementById('real-time-results').addEventListener('click', toggleRealTimeResults);
};

const displayElectionResults = (electionId) => {
    const election = currentData.elections.find(e => e.id === electionId);
    const electionVotes = currentData.votes.filter(v => v.electionId === electionId);
    
    // Calculate results
    const results = {};
    electionVotes.forEach(vote => {
        const candidate = currentData.candidates.find(c => c.id === vote.candidateId);
        const candidateName = candidate ? candidate.name : vote.candidateId;
        results[candidateName] = (results[candidateName] || 0) + 1;
    });
    
    const totalVotes = electionVotes.length;
    const sortedResults = Object.entries(results).sort((a, b) => b[1] - a[1]);
    
    const resultsHTML = `
        <div class="results-container">
            <h4>${election ? election.name : 'Election'} Results</h4>
            <p class="text-muted">Total Votes Cast: ${totalVotes}</p>
            
            <div class="results-chart">
                ${sortedResults.map(([candidate, votes], index) => {
                    const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
                    return `
                        <div class="result-item mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="fw-bold">${candidate}</span>
                                <span class="badge ${index === 0 ? 'bg-success' : 'bg-secondary'}">${votes} votes (${percentage}%)</span>
                            </div>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar ${index === 0 ? 'bg-success' : 'bg-secondary'}" 
                                     style="width: ${percentage}%" 
                                     aria-valuenow="${percentage}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${sortedResults.length > 0 ? `
                <div class="mt-4 p-3 bg-light rounded">
                    <h5 class="text-success">Winner: ${sortedResults[0][0]}</h5>
                    <p class="mb-0">Total Votes: ${sortedResults[0][1]} (${totalVotes > 0 ? ((sortedResults[0][1] / totalVotes) * 100).toFixed(1) : 0}%)</p>
                </div>
            ` : '<p class="text-muted">No votes cast yet.</p>'}
        </div>
    `;
    
    document.getElementById('results-display').innerHTML = resultsHTML;
};

// User Management
const setupUserManagement = () => {
    const userForm = document.getElementById('user-form');
    
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(userForm)) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        const submitBtn = userForm.querySelector('button[type="submit"]');
        showLoading(submitBtn);
        
        const permissions = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            if (checkbox.value) permissions.push(checkbox.value);
        });
        
        const user = {
            id: document.getElementById('user-id').value,
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            permissions: permissions,
            createdDate: new Date().toISOString()
        };
        
        try {
            await apiCall('/users', 'POST', user);
            userForm.reset();
            showMessage('User added successfully!');
            await loadAllData();
            updateAuditLog(`User added: ${user.name}`);
        } catch (error) {
            showMessage('Failed to add user', 'error');
        } finally {
            hideLoading(submitBtn);
        }
    });
    
    document.getElementById('view-users').addEventListener('click', () => {
        displayUsersList(currentData.users);
    });
};

const displayUsersList = (users) => {
    const content = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td><span class="badge bg-primary">${user.role}</span></td>
                            <td>${user.permissions ? user.permissions.join(', ') : 'None'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    showModal('System Users', content);
};

// Audit Logs
const setupAuditLogs = () => {
    document.getElementById('view-logs').addEventListener('click', viewAuditLogs);
    document.getElementById('filter-logs').addEventListener('click', () => {
        const filterDiv = document.getElementById('log-filters');
        filterDiv.style.display = filterDiv.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('export-logs').addEventListener('click', exportAuditLogs);
    document.getElementById('apply-filters').addEventListener('click', applyLogFilters);
};

const updateAuditLog = (action) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        user: 'System Admin', // This would be dynamic based on logged-in user
        ip: '127.0.0.1' // This would be actual IP in real system
    };
    currentData.auditLogs.push(logEntry);
};

const viewAuditLogs = () => {
    const logsHTML = currentData.auditLogs.map(log => `
        <div class="data-item">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${log.action}</strong>
                    <p class="mb-1 text-muted">User: ${log.user} | IP: ${log.ip}</p>
                </div>
                <small class="text-muted">${formatDate(log.timestamp)}</small>
            </div>
        </div>
    `).join('');
    
    document.getElementById('logs-display').innerHTML = logsHTML || '<p class="text-muted text-center">No audit logs available</p>';
};

// Helper functions for edit/delete operations
window.editVoter = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteVoter = (id) => showMessage('Delete functionality will be implemented', 'info');
window.editCandidate = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteCandidate = (id) => showMessage('Delete functionality will be implemented', 'info');
window.editElection = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteElection = (id) => showMessage('Delete functionality will be implemented', 'info');
window.previewBallot = (id) => showMessage('Ballot preview will be implemented', 'info');
window.editBallot = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteBallot = (id) => showMessage('Delete functionality will be implemented', 'info');
window.editStation = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteStation = (id) => showMessage('Delete functionality will be implemented', 'info');
window.editObserver = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteObserver = (id) => showMessage('Delete functionality will be implemented', 'info');
window.editUser = (id) => showMessage('Edit functionality will be implemented', 'info');
window.deleteUser = (id) => showMessage('Delete functionality will be implemented', 'info');

const exportResults = () => showMessage('Export functionality will be implemented', 'info');
const toggleRealTimeResults = () => showMessage('Real-time results will be implemented', 'info');
const exportAuditLogs = () => showMessage('Export functionality will be implemented', 'info');
const applyLogFilters = () => showMessage('Filter functionality will be implemented', 'info');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Set up all event listeners
    setupVoterManagement();
    setupCandidateManagement();
    setupElectionManagement();
    setupBallotManagement();
    setupVoteCasting();
    setupPollingStationManagement();
    setupObserverManagement();
    setupResultsManagement();
    setupUserManagement();
    setupAuditLogs();
    
    // Load initial data
    loadAllData();
    
    // Set up smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    showMessage('Electoral System Management loaded successfully!');
});