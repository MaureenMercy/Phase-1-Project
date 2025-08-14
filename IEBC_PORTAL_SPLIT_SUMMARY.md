# IEBC Portal Split - Three-Tier Dashboard System

## Overview

The IEBC portal has been successfully split into three distinct dashboards, each designed for different operational levels and access requirements:

1. **Regional IEBC Officers/County Commissions** - Local operations dashboard
2. **IEBC Official Account (Bomas HQ)** - Mid-tier national operations  
3. **IEBC HQ Board & Shareholders** - Top-tier oversight and executive decision-making

---

## 🏛️ Portal 1: Regional IEBC Officers/County Commissions

**File:** `regional-admin-portal.html` + `regional-admin.js`

### Purpose
Manage elections within specific counties/constituencies/wards including clerk coordination, candidate approval, device tracking, and incident escalation.

### Who Uses This
- County IEBC Officers
- Regional IT & logistics teams  
- Ward coordinators (sub-level view only)
- Temporary returning officers (day-of roles)

### Authentication
- **National ID** + biometric verification + OTP
- **County Assignment** (hardcoded restrictions)
- **Optional:** Physical access badge for offline areas
- **Session:** 8 hours validity, auto-refresh

### Key Features

#### 1. Regional Election Setup Overview
- Positions overview (MCA, MP, Senator, Governor, Women Rep, President read-only)
- Candidate viewer for regional candidates
- Ballot approval status by ward
- HQ notices and rule changes

#### 2. Clerk Deployment Manager
- Add/remove clerks with ID and contact info
- Biometric training log tracking
- Device assignment (tablet, printer, biometric scanner)
- Auto-generated deployment checklists

#### 3. Polling Station Monitor
- Real-time heatmap/list view of station status
- Offline buffer status tracking
- Staff check-in logs
- Automated alerts for high-risk or inactive stations

#### 4. Voter Roll Verification
- Search voters by ID, name, or station
- Real-time voting status display
- Disabled voter flags for assisted voting
- Print/export functionality for backup

#### 5. Form 34/35 Upload Monitor
- Track Form 34A (president), 34B (constituency), 35A (other positions)
- Photo match viewer for scanned forms vs typed tallies
- Verification markers for mismatched totals
- Direct HQ notification for audits/recounts

#### 6. Incident Logbook & Escalation
- Report incidents: clerk absence, violence, device failure, material shortage
- Attach photo/video evidence
- AI auto-classification (critical/moderate/info)
- Direct escalation tracker to HQ

#### 7. County Analytics Dashboard
- Live turnout % by ward
- Offline polling station mapping
- Form upload percentage tracking
- Clerk performance logs

---

## 🏢 Portal 2: IEBC Official Account - Bomas HQ Operations

**File:** `bomas-hq-portal.html` + `bomas-hq.js`

### Purpose
Mid-tier national operations and tally center management for real-time results processing and evidence management.

### Who Uses This
- Bomas control room staff
- National tally managers
- IT lead officers
- Evidence reconciliation officers

### Authentication
- **Admin credentials** + 2FA + device assignment verification
- **All changes audited** with name/time/IP/device logs
- **Session watermarking** and access logging
- **Device fingerprinting** for security

### Key Features

#### 1. Real-time Results Map
- Interactive national election map color-coded by winner
- Live constituency-level outcome tracking
- National summary with leading candidates and vote percentages

#### 2. Tallying Engine Access
- Secure Form 34B and 34C number input
- Dual-authorization for critical entries
- Tallying queue with approval workflow
- Constituency-level result verification

#### 3. Evidence Repository
- Upload/view scanned Forms 34A/B/C
- Photo evidence gallery from polling stations
- Document verification and flagging system
- Download and archival capabilities

#### 4. Monitor Flagged Returns
- AI-flagged forms for number mismatches
- Regional officer flagged submissions
- Priority-based review queue
- Investigation and resolution tracking

#### 5. Alert Center
- Security alerts (login attempts, device malfunctions)
- Connectivity alerts (offline stations)
- System status notifications
- Real-time technical dispatch

#### 6. Judiciary Sync
- Read-only form bundles for judicial review
- Access logs for judicial personnel
- Audit trail generation
- Legal compliance tracking

#### 7. Publishing Controls
- Preview results before publication
- Push updates to public dashboard
- Emergency stop functionality
- Publishing history with recall options

---

## 👑 Portal 3: IEBC HQ Board & Shareholders Dashboard

**File:** `board-executive-portal.html` + `board-executive.js`

### Purpose
Top-tier oversight and executive decision-making with strategic analytics and emergency controls.

### Who Uses This
- IEBC Commissioners
- Chairperson
- IEBC CEO
- Legal Affairs Office
- National Treasury/AG (read-only access)

### Authentication
- **Biometric + smart token** (fingerprint, retina, voice)
- **Geo-locking** (HQ building only)
- **Session watermarking** and access logging
- **Off-site audit trail** storage
- **Emergency freeze** capability

### Key Features

#### 1. Nationwide Analytics
- National turnout with regional breakdown
- Active/delayed/offline station monitoring
- Device sync status nationwide
- Predictive analytics and completion estimates

#### 2. Fraud & Risk Monitoring
- Real-time AI engine alerts
- Flagged polling stations
- Security score monitoring
- Pattern detection and anomaly alerts

#### 3. Legal & Petition Overview
- Legal disputes filed by county
- Form 34/35 upload rates
- Observer reports compilation
- Case priority and status tracking

#### 4. System Performance Logs
- Server uptime and response times
- Downtime event tracking
- Critical system event logs
- Performance optimization insights

#### 5. Observer Feedback Summary
- International observer reports
- Regional feedback compilation
- Overall credibility ratings
- Areas for improvement identification

#### 6. Admin Command Console
- **Emergency Controls:**
  - Suspend users
  - Force ballot recalls
  - Override results (dual-approval)
  - Lock constituencies
  - Generate official reports
  - Certify final results

#### 7. AI Intelligence Briefings
- Voter behavior predictions
- Fraud pattern alerts
- Treasury monitoring (optional)
- Advanced analytics and insights

### 🚨 Emergency System Freeze
- **Ultimate safeguard** to halt all operations nationwide
- Requires dual confirmation
- Triggers judicial and parliamentary notification
- Only for critical security threats

---

## 🔐 Security & Access Control

### Three-Tier Security Model

| Portal | Security Level | Access Duration | Authentication |
|--------|---------------|-----------------|----------------|
| Regional | Mid-tier | 8 hours | ID + Biometric + OTP |
| Bomas HQ | High | 8 hours | Admin + 2FA + Device |
| Executive | TOP SECRET | 4 hours | Biometric + Token + Geo |

### Data Separation
- **Regional:** County-specific data only, cannot access other regions
- **Bomas:** National aggregation, cannot override executive decisions  
- **Executive:** Full system access with audit trails and dual-approval mechanisms

### Audit & Compliance
- All actions logged with timestamps, user IDs, and IP addresses
- Off-site storage for executive-level activities
- Real-time security monitoring and anomaly detection
- Compliance with judicial oversight requirements

---

## 🚀 Implementation Benefits

### Clear Operational Hierarchy
- Defined roles and responsibilities at each level
- Appropriate access controls for each user type
- Streamlined decision-making processes

### Enhanced Security
- Multi-factor authentication at all levels
- Geo-location restrictions for sensitive access
- Real-time monitoring and threat detection
- Emergency response capabilities

### Improved Accountability
- Comprehensive audit trails
- Dual-approval mechanisms for critical actions
- Clear escalation paths
- Legal compliance tracking

### Better Data Management
- Contained access based on jurisdiction
- Reduced data exposure risks
- Optimized performance for specific use cases
- Real-time synchronization between levels

---

## 📁 File Structure

```
├── regional-admin-portal.html      # Regional officers dashboard
├── regional-admin.js               # Regional functionality
├── bomas-hq-portal.html           # Bomas operations center
├── bomas-hq.js                    # Bomas functionality  
├── board-executive-portal.html    # Executive oversight
├── board-executive.js             # Executive functionality
├── index.css                      # Shared styling
├── electoral-system-api/          # Backend API
└── IEBC_PORTAL_SPLIT_SUMMARY.md  # This documentation
```

---

## 🔧 Technical Requirements

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Styling:** Bootstrap 5.3.3, FontAwesome 6.0
- **Backend:** JSON Server (existing API structure)
- **Browser:** Modern browsers with Canvas support
- **Security:** HTTPS required for production deployment

---

## 🎯 Next Steps

1. **Database Integration:** Connect to secure IEBC database systems
2. **Real-time Sync:** Implement WebSocket connections for live updates
3. **Mobile Optimization:** Ensure responsive design for tablet access
4. **Security Hardening:** Implement production-grade encryption and access controls
5. **Load Testing:** Verify performance under election day traffic
6. **Judicial Integration:** Connect with court systems for legal oversight
7. **Backup Systems:** Implement redundancy and disaster recovery

This three-tier system provides the necessary separation of concerns while maintaining operational efficiency and security compliance for Kenya's electoral processes.