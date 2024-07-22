// API base URL
const API_URL = 'http://localhost:3000';

// DOM elements
const voterForm = document.querySelector('#voter-registration form');
const candidateForm = document.querySelector('#candidate-management form');
const electionForm = document.querySelector('#election-setup form');
const voteForm = document.querySelector('#vote-casting form');

// Event listeners for form submissions
voterForm.addEventListener('submit', registerVoter);
candidateForm.addEventListener('submit', addCandidate);
electionForm.addEventListener('submit', createElection);
voteForm.addEventListener('submit', castVote);

// Event listeners for view buttons
document.getElementById('view-voters').addEventListener('click', viewVoters);
document.getElementById('view-candidates').addEventListener('click', viewCandidates);
document.getElementById('view-elections').addEventListener('click', viewElections);
document.getElementById('view-logs').addEventListener('click', viewAuditLogs);

// Voter Registration
async function registerVoter(e) {
    e.preventDefault();
    const voter = {
        id: document.getElementById('voter-id').value,
        name: document.getElementById('voter-name').value,
        dob: document.getElementById('voter-dob').value
    };
    try {
        const response = await fetch(`${API_URL}/voters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voter)
        });
        if (response.ok) {
            voterForm.reset();
            alert('Voter registered successfully!');
            updateAuditLog(`Voter registered: ${voter.name}`);
            viewVoters();
        } else {
            throw new Error('Failed to register voter');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to register voter');
    }
}

// Candidate Management
async function addCandidate(e) {
    e.preventDefault();
    const candidate = {
        id: document.getElementById('candidate-id').value,
        name: document.getElementById('candidate-name').value,
        party: document.getElementById('candidate-party').value
    };
    try {
        const response = await fetch(`${API_URL}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(candidate)
        });
        if (response.ok) {
            candidateForm.reset();
            alert('Candidate added successfully!');
            updateAuditLog(`Candidate added: ${candidate.name}`);
            viewCandidates();
        } else {
            throw new Error('Failed to add candidate');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add candidate');
    }
}

// Election Setup
async function createElection(e) {
    e.preventDefault();
    const election = {
        id: document.getElementById('election-id').value,
        name: document.getElementById('election-name').value,
        date: document.getElementById('election-date').value
    };
    try {
        const response = await fetch(`${API_URL}/elections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(election)
        });
        if (response.ok) {
            electionForm.reset();
            alert('Election created successfully!');
            updateAuditLog(`Election created: ${election.name}`);
            viewElections();
        } else {
            throw new Error('Failed to create election');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create election');
    }
}

// Vote Casting
async function castVote(e) {
    e.preventDefault();
    const vote = {
        voterId: document.getElementById('voting-voter-id').value,
        electionId: document.getElementById('voting-election-id').value,
        candidateId: document.getElementById('voting-candidate-id').value
    };
    try {
        const response = await fetch(`${API_URL}/votes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vote)
        });
        if (response.ok) {
            voteForm.reset();
            alert('Vote cast successfully!');
            updateAuditLog(`Vote cast by voter ID: ${vote.voterId}`);
        } else {
            throw new Error('Failed to cast vote');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to cast vote');
    }
}

// View functions
async function viewVoters() {
    try {
        const response = await fetch(`${API_URL}/voters`);
        const voters = await response.json();
        displayList('Registered Voters', voters);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to fetch voters');
    }
}

async function viewCandidates() {
    try {
        const response = await fetch(`${API_URL}/candidates`);
        const candidates = await response.json();
        displayList('Candidates', candidates);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to fetch candidates');
    }
}

async function viewElections() {
    try {
        const response = await fetch(`${API_URL}/elections`);
        const elections = await response.json();
        displayList('Elections', elections);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to fetch elections');
    }
}

function displayList(title, list) {
    let output = `<h3>${title}</h3><ul>`;
    list.forEach(item => {
        output += `<li>${JSON.stringify(item)}</li>`;
    });
    output += '</ul>';
    document.getElementById('results-display').innerHTML = output;
}

// Audit log
let auditLog = [];

function updateAuditLog(action) {
    const logEntry = `${new Date().toLocaleString()}: ${action}`;
    auditLog.push(logEntry);
    // In a real application, you might want to send this to the server as well
}

function viewAuditLogs() {
    let output = '<h3>Audit Logs</h3><ul>';
    auditLog.forEach(log => {
        output += `<li>${log}</li>`;
    });
    output += '</ul>';
    document.getElementById('logs-display').innerHTML = output;
}

// Load initial data
window.addEventListener('load', () => {
    viewVoters();
    viewCandidates();
    viewElections();
});