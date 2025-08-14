// IEBC Judiciary Portal - Legal & Compliance Access
// Secure, verifiable access to electoral data for legal proceedings

class JudiciaryPortal {
    constructor() {
        this.currentUser = null;
        this.currentSession = null;
        this.socket = null;
        this.selectedConstituency = null;
        this.auditLogs = [];
        this.voterHistory = [];
        this.forms = [];
        this.discrepancies = [];
        
        this.init();
    }

    init() {
        this.initializeSession();
        this.setupEventListeners();
        this.initializeWebSocket();
        this.loadInitialData();
        this.updateSessionInfo();
    }

    initializeSession() {
        // Mock judiciary session - in production, this would come from authentication
        this.currentUser = {
            id: 'judiciary001',
            name: 'Hon. Justice Sarah Wanjiku',
            role: 'judiciary',
            court: 'Supreme Court of Kenya',
            caseNumber: 'PETITION NO. 1 OF 2024',
            permissions: ['read_only', 'audit_access', 'form_verification', 'report_export'],
            accessLevel: 'judiciary'
        };

        this.currentSession = {
            sessionId: 'JUD-2024-001',
            accessToken: 'JUD-TOKEN-' + Date.now(),
            loginTime: new Date(),
            dataExpiry: 'Case Closure',
            biometricVerified: true,
            tokenActive: true,
            permissionsActive: true
        };

        // Log judiciary access
        this.logAuditAction('login', 'Judiciary user logged in via biometric authentication');
    }

    setupEventListeners() {
        // Constituency selection
        document.getElementById('countySelect').addEventListener('change', (e) => {
            this.onCountyChange(e.target.value);
        });

        document.getElementById('constituencySelect').addEventListener('change', (e) => {
            this.onConstituencyChange(e.target.value);
        });

        document.getElementById('wardSelect').addEventListener('change', (e) => {
            this.onWardChange(e.target.value);
        });

        // Audit trail filters
        document.getElementById('dateRange').addEventListener('change', (e) => {
            this.filterAuditTrail();
        });

        document.getElementById('actionType').addEventListener('change', (e) => {
            this.filterAuditTrail();
        });

        // Form verification actions
        this.setupFormVerificationListeners();
    }

    initializeWebSocket() {
        // Connect to WebSocket for real-time updates
        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('Connected to IEBC WebSocket server');
            this.socket.emit('join-judiciary', { userId: this.currentUser.id });
        });

        this.socket.on('judiciary-update', (data) => {
            this.handleJudiciaryUpdate(data);
        });

        this.socket.on('audit-log-update', (data) => {
            this.addAuditLog(data);
        });

        this.socket.on('form-update', (data) => {
            this.updateFormVerification(data);
        });
    }

    loadInitialData() {
        this.loadConstituencyData();
        this.loadAuditTrail();
        this.loadFormVerification();
        this.loadDiscrepancyAnalysis();
    }

    updateSessionInfo() {
        document.getElementById('currentUser').textContent = this.currentUser.name;
        document.getElementById('sessionId').textContent = this.currentSession.sessionId;
        document.getElementById('accessToken').textContent = this.currentSession.accessToken;
        document.getElementById('loginTime').textContent = this.currentSession.loginTime.toLocaleString();
        document.getElementById('dataExpiry').textContent = this.currentSession.dataExpiry;
    }

    // Constituency Selection Methods
    onCountyChange(county) {
        if (!county) {
            this.resetConstituencyData();
            return;
        }

        this.loadConstituenciesForCounty(county);
        this.logAuditAction('data_access', `Accessed ${county} County data`);
    }

    onConstituencyChange(constituency) {
        if (!constituency) {
            this.resetConstituencyData();
            return;
        }

        this.selectedConstituency = constituency;
        this.loadWardsForConstituency(constituency);
        this.loadConstituencyMetrics(constituency);
        this.loadPollingStations(constituency);
        this.logAuditAction('data_access', `Accessed ${constituency} Constituency data`);
    }

    onWardChange(ward) {
        if (!ward) return;
        
        this.loadWardMetrics(ward);
        this.logAuditAction('data_access', `Accessed ${ward} Ward data`);
    }

    loadConstituenciesForCounty(county) {
        const constituencies = this.getConstituenciesByCounty(county);
        const constituencySelect = document.getElementById('constituencySelect');
        
        constituencySelect.innerHTML = '<option value="">Choose Constituency...</option>';
        constituencies.forEach(constituency => {
            const option = document.createElement('option');
            option.value = constituency.value;
            option.textContent = constituency.name;
            constituencySelect.appendChild(option);
        });

        // Reset ward selection
        document.getElementById('wardSelect').innerHTML = '<option value="">Choose Ward...</option>';
    }

    loadWardsForConstituency(constituency) {
        const wards = this.getWardsByConstituency(constituency);
        const wardSelect = document.getElementById('wardSelect');
        
        wardSelect.innerHTML = '<option value="">Choose Ward...</option>';
        wards.forEach(ward => {
            const option = document.createElement('option');
            option.value = ward.value;
            option.textContent = ward.name;
            wardSelect.appendChild(option);
        });
    }

    loadConstituencyMetrics(constituency) {
        const metrics = this.getConstituencyMetrics(constituency);
        
        document.getElementById('totalVoters').textContent = metrics.totalVoters.toLocaleString();
        document.getElementById('castVotes').textContent = metrics.castVotes.toLocaleString();
        document.getElementById('turnout').textContent = metrics.turnout.toFixed(1) + '%';
        document.getElementById('pollingStations').textContent = metrics.pollingStations;
    }

    loadPollingStations(constituency) {
        const stations = this.getPollingStations(constituency);
        const tbody = document.getElementById('pollingStationsTable');
        
        if (stations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No polling stations found for this constituency</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        stations.forEach(station => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${station.name}</strong><br><small class="text-muted">${station.address}</small></td>
                <td><span class="status-badge status-${station.status}">${station.status}</span></td>
                <td>${station.totalVoters.toLocaleString()}</td>
                <td>${station.castVotes.toLocaleString()}</td>
                <td>${station.turnout.toFixed(1)}%</td>
                <td>${station.lastSync ? new Date(station.lastSync).toLocaleString() : 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="judiciaryPortal.viewStationDetails('${station.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="judiciaryPortal.viewStationAudit('${station.id}')">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    resetConstituencyData() {
        document.getElementById('totalVoters').textContent = '0';
        document.getElementById('castVotes').textContent = '0';
        document.getElementById('turnout').textContent = '0%';
        document.getElementById('pollingStations').textContent = '0';
        
        document.getElementById('pollingStationsTable').innerHTML = 
            '<tr><td colspan="7" class="text-center text-muted">Select a constituency to view polling station data</td></tr>';
    }

    // Audit Trail Methods
    loadAuditTrail() {
        this.auditLogs = this.getAuditLogs();
        this.renderAuditTimeline();
    }

    filterAuditTrail() {
        const dateRange = document.getElementById('dateRange').value;
        const actionType = document.getElementById('actionType').value;
        
        const filteredLogs = this.auditLogs.filter(log => {
            let dateMatch = true;
            let actionMatch = true;

            if (dateRange !== 'all') {
                dateMatch = this.matchesDateRange(log.timestamp, dateRange);
            }

            if (actionType !== 'all') {
                actionMatch = log.action === actionType;
            }

            return dateMatch && actionMatch;
        });

        this.renderAuditTimeline(filteredLogs);
    }

    renderAuditTimeline(logs = null) {
        const timeline = document.getElementById('auditTimeline');
        const logsToRender = logs || this.auditLogs;

        if (logsToRender.length === 0) {
            timeline.innerHTML = '<div class="text-center text-muted">No audit logs found for the selected criteria</div>';
            return;
        }

        timeline.innerHTML = '';
        logsToRender.forEach(log => {
            const auditItem = document.createElement('div');
            auditItem.className = 'audit-item';
            auditItem.innerHTML = `
                <div class="audit-time">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="audit-action">${this.formatAuditAction(log.action)}</div>
                <div class="audit-details">${log.details}</div>
            `;
            timeline.appendChild(auditItem);
        });
    }

    addAuditLog(log) {
        this.auditLogs.unshift(log);
        this.renderAuditTimeline();
    }

    logAuditAction(action, details) {
        const log = {
            id: 'AUD-' + Date.now(),
            timestamp: new Date().toISOString(),
            user: this.currentUser.id,
            action: action,
            details: details,
            ipAddress: '192.168.1.100', // Mock IP
            userAgent: navigator.userAgent
        };

        this.addAuditLog(log);
        
        // Send to server
        if (this.socket) {
            this.socket.emit('judiciary-audit-log', log);
        }
    }

    // Voter History Methods
    searchVoterHistory() {
        const caseNumber = document.getElementById('caseNumber').value.trim();
        const voterId = document.getElementById('voterId').value.trim();

        if (!caseNumber) {
            this.showAlert('Please enter a valid case number', 'warning');
            return;
        }

        if (!voterId) {
            this.showAlert('Please enter a voter ID or national ID', 'warning');
            return;
        }

        this.showLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            const voterHistory = this.getVoterHistory(voterId, caseNumber);
            this.displayVoterHistory(voterHistory);
            this.showLoading(false);
            this.logAuditAction('voter_lookup', `Searched voter history for ID: ${voterId}, Case: ${caseNumber}`);
        }, 1500);
    }

    displayVoterHistory(voterHistory) {
        const resultsDiv = document.getElementById('voterHistoryResults');
        const tableBody = document.getElementById('voterHistoryTable');

        if (voterHistory.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No voter history found</td></tr>';
            resultsDiv.style.display = 'block';
            return;
        }

        tableBody.innerHTML = '';
        voterHistory.forEach(voter => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${voter.id}</td>
                <td><strong>${voter.name}</strong></td>
                <td>${voter.registrationLocation}</td>
                <td><span class="status-badge status-${voter.voteStatus}">${voter.voteStatus}</span></td>
                <td>${voter.votingTime ? new Date(voter.votingTime).toLocaleString() : 'Not voted'}</td>
                <td>${voter.objections ? voter.objections.join(', ') : 'None'}</td>
            `;
            tableBody.appendChild(row);
        });

        resultsDiv.style.display = 'block';
    }

    // Form Verification Methods
    loadFormVerification() {
        this.forms = this.getForms();
        this.renderFormVerification();
    }

    renderFormVerification() {
        const container = document.getElementById('formVerification');
        container.innerHTML = '';

        this.forms.forEach(form => {
            const formCard = this.createFormCard(form);
            container.appendChild(formCard);
        });
    }

    createFormCard(form) {
        const card = document.createElement('div');
        card.className = 'form-card';
        card.innerHTML = `
            <div class="form-header">
                <span class="form-type">${form.type}</span>
                <span class="form-status status-${form.status}">${form.status}</span>
            </div>
            <h6>${form.stationName}</h6>
            <p><strong>Uploaded:</strong> ${new Date(form.uploadTime).toLocaleString()}</p>
            <p><strong>Clerk ID:</strong> ${form.clerkId} (${form.clerkName})</p>
            <p><strong>Device ID:</strong> ${form.deviceId}</p>
            <p><strong>Total Votes:</strong> ${form.totalVotes.toLocaleString()}</p>
            <p><strong>Valid Votes:</strong> ${form.validVotes.toLocaleString()}</p>
            <p><strong>Rejected:</strong> ${form.rejectedVotes.toLocaleString()}</p>
            <div class="mt-3">
                <button class="btn btn-sm btn-outline-primary me-2" onclick="judiciaryPortal.viewForm('${form.id}')">
                    <i class="fas fa-eye me-1"></i> View
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="judiciaryPortal.downloadForm('${form.id}')">
                    <i class="fas fa-download me-1"></i> Download
                </button>
            </div>
        `;
        return card;
    }

    setupFormVerificationListeners() {
        // Add event listeners for form actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="viewForm"]')) {
                const formId = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.viewForm(formId);
            }
        });
    }

    viewForm(formId) {
        const form = this.forms.find(f => f.id === formId);
        if (form) {
            this.logAuditAction('form_view', `Viewed Form ${form.type} from ${form.stationName}`);
            this.showFormDetails(form);
        }
    }

    downloadForm(formId) {
        const form = this.forms.find(f => f.id === formId);
        if (form) {
            this.logAuditAction('form_download', `Downloaded Form ${form.type} from ${form.stationName}`);
            this.downloadFormFile(form);
        }
    }

    // Discrepancy Analysis Methods
    loadDiscrepancyAnalysis() {
        this.discrepancies = this.getDiscrepancies();
        this.renderDiscrepancyAnalysis();
    }

    renderDiscrepancyAnalysis() {
        // AI insights are already rendered in HTML
        // This method can be used to update insights dynamically
    }

    runDiscrepancyAnalysis() {
        this.showLoading(true);
        this.logAuditAction('discrepancy_analysis', 'Initiated full discrepancy analysis');

        // Simulate AI analysis
        setTimeout(() => {
            const newDiscrepancies = this.runAIAnalysis();
            this.updateDiscrepancyInsights(newDiscrepancies);
            this.showLoading(false);
            this.showAlert('Discrepancy analysis completed successfully', 'success');
        }, 3000);
    }

    generateDiscrepancyReport() {
        this.showLoading(true);
        this.logAuditAction('report_generation', 'Generated discrepancy analysis report');

        setTimeout(() => {
            this.downloadDiscrepancyReport();
            this.showLoading(false);
        }, 2000);
    }

    // Report Export Methods
    exportAuditLogs() {
        this.showLoading(true);
        this.logAuditAction('report_export', 'Exported audit logs');

        setTimeout(() => {
            this.downloadReport('audit_logs', 'Audit Logs Report');
            this.showLoading(false);
        }, 1500);
    }

    exportVoteLogs() {
        this.showLoading(true);
        this.logAuditAction('report_export', 'Exported vote logs');

        setTimeout(() => {
            this.downloadReport('vote_logs', 'Vote Logs Report');
            this.showLoading(false);
        }, 1500);
    }

    exportFullReport() {
        this.showLoading(true);
        this.logAuditAction('report_export', 'Exported full report pack');

        setTimeout(() => {
            this.downloadReport('full_report', 'Full Electoral Report Pack');
            this.showLoading(false);
        }, 3000);
    }

    exportCustomReport() {
        this.showCustomReportBuilder();
    }

    // Utility Methods
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'block' : 'none';
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.main-container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    formatAuditAction(action) {
        const actionMap = {
            'login': 'System Access',
            'data_access': 'Data Access',
            'form_view': 'Form Review',
            'voter_lookup': 'Voter History Lookup',
            'report_export': 'Report Export',
            'discrepancy_analysis': 'Discrepancy Analysis'
        };
        return actionMap[action] || action;
    }

    matchesDateRange(timestamp, range) {
        const date = new Date(timestamp);
        const now = new Date();
        
        switch (range) {
            case 'today':
                return date.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return date >= monthAgo;
            default:
                return true;
        }
    }

    // Mock Data Methods (replace with real API calls)
    getConstituenciesByCounty(county) {
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

    getWardsByConstituency(constituency) {
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

    getConstituencyMetrics(constituency) {
        const metrics = {
            'westlands': { totalVoters: 45000, castVotes: 38000, turnout: 84.4, pollingStations: 15 },
            'mvita': { totalVoters: 32000, castVotes: 26800, turnout: 83.8, pollingStations: 12 }
        };
        return metrics[constituency] || { totalVoters: 0, castVotes: 0, turnout: 0, pollingStations: 0 };
    }

    getPollingStations(constituency) {
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

    getAuditLogs() {
        return [
            {
                id: 'AUD001',
                timestamp: '2024-08-09T08:00:00.000Z',
                user: 'judiciary001',
                action: 'login',
                details: 'Judiciary user logged in via biometric authentication'
            },
            {
                id: 'AUD002',
                timestamp: '2024-08-09T08:05:00.000Z',
                user: 'judiciary001',
                action: 'data_access',
                details: 'Accessed Nairobi County voter registration data'
            },
            {
                id: 'AUD003',
                timestamp: '2024-08-09T08:10:00.000Z',
                user: 'judiciary001',
                action: 'form_view',
                details: 'Reviewed Form 34A from Westlands Primary School'
            }
        ];
    }

    getVoterHistory(voterId, caseNumber) {
        // Mock voter history data
        return [
            {
                id: voterId,
                name: 'John Doe',
                registrationLocation: 'Westlands Primary School',
                voteStatus: 'cast',
                votingTime: '2024-08-09T10:30:00.000Z',
                objections: []
            }
        ];
    }

    getForms() {
        return [
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
            },
            {
                id: 'FORM002',
                type: '34B',
                stationName: 'Parklands High School',
                uploadTime: '2024-08-09T17:45:00.000Z',
                clerkId: 'CLK004',
                clerkName: 'John Mwangi',
                deviceId: 'TAB002',
                totalVotes: 1350,
                validVotes: 1320,
                rejectedVotes: 30,
                status: 'pending'
            }
        ];
    }

    getDiscrepancies() {
        return [
            {
                type: 'vote_count_mismatch',
                priority: 'high',
                description: 'Discrepancy detected in Form 34B from Parklands High School - vote count mismatch of 15 votes',
                station: 'Parklands High School',
                formId: 'FORM002'
            }
        ];
    }

    runAIAnalysis() {
        // Mock AI analysis results
        return [
            {
                type: 'delayed_sync',
                priority: 'medium',
                description: 'Delayed syncing detected in 3 polling stations - average delay of 45 minutes'
            }
        ];
    }

    // Action Methods
    viewStationDetails(stationId) {
        this.logAuditAction('station_view', `Viewed details for station ${stationId}`);
        this.showAlert(`Viewing details for station ${stationId}`, 'info');
    }

    viewStationAudit(stationId) {
        this.logAuditAction('station_audit', `Viewed audit trail for station ${stationId}`);
        this.showAlert(`Viewing audit trail for station ${stationId}`, 'info');
    }

    showFormDetails(form) {
        this.showAlert(`Viewing Form ${form.type} details`, 'info');
    }

    downloadFormFile(form) {
        this.showAlert(`Downloading Form ${form.type}`, 'success');
    }

    updateDiscrepancyInsights(discrepancies) {
        // Update AI insights dynamically
        this.showAlert('Discrepancy analysis updated with new insights', 'success');
    }

    downloadDiscrepancyReport() {
        this.showAlert('Discrepancy report downloaded successfully', 'success');
    }

    downloadReport(type, title) {
        this.showAlert(`${title} downloaded successfully`, 'success');
    }

    showCustomReportBuilder() {
        this.showAlert('Custom report builder feature coming soon', 'info');
    }

    handleJudiciaryUpdate(data) {
        console.log('Received judiciary update:', data);
        // Handle real-time updates from server
    }

    updateFormVerification(data) {
        console.log('Form verification update:', data);
        // Update form verification data
    }

    logout() {
        this.logAuditAction('logout', 'Judiciary user logged out');
        
        // Clear session
        this.currentSession = null;
        this.currentUser = null;
        
        // Redirect to login
        window.location.href = '/';
    }
}

// Initialize the portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.judiciaryPortal = new JudiciaryPortal();
});

// Global functions for onclick handlers
function logout() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.logout();
    }
}

function searchVoterHistory() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.searchVoterHistory();
    }
}

function runDiscrepancyAnalysis() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.runDiscrepancyAnalysis();
    }
}

function generateDiscrepancyReport() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.generateDiscrepancyReport();
    }
}

function exportAuditLogs() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.exportAuditLogs();
    }
}

function exportVoteLogs() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.exportVoteLogs();
    }
}

function exportFullReport() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.exportFullReport();
    }
}

function exportCustomReport() {
    if (window.judiciaryPortal) {
        window.judiciaryPortal.exportCustomReport();
    }
}