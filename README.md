# IEBC Electoral Management System

A comprehensive, three-tier electoral management system designed for the Independent Electoral and Boundaries Commission (IEBC) of Kenya. This system provides secure, role-based access control for regional officers, Bomas HQ operations, and executive board members.

## 🏗️ System Architecture

The system is split into three distinct access levels, each with specific responsibilities and permissions:

### 1. Regional IEBC Officers / County Commissions
- **Purpose**: Manage elections within specific counties/constituencies/wards
- **Access Level**: Mid-tier, can manage but not override HQ decisions
- **Authentication**: National ID + Biometric + OTP
- **Scope**: Assigned county and constituency only (hardcoded access)

### 2. IEBC Bomas HQ Operations Dashboard
- **Purpose**: Mid-tier national operations & tally center management
- **Access Level**: National-level credentials
- **Authentication**: Admin password + OTP
- **Scope**: National operations, regional monitoring, form processing

### 3. IEBC Board & Executive Dashboard
- **Purpose**: Strategic oversight and emergency controls
- **Access Level**: Ultra-restricted access for commissioners and executives
- **Authentication**: Biometric + Physical token-based 2FA
- **Scope**: Full system access, emergency controls, final approvals

## 🚀 Features

### Regional Admin Portal
- **Election Setup Overview**: Position management, candidate approval, ballot status
- **Clerk Deployment Manager**: Staff assignment, training tracking, device management
- **Polling Station Monitor**: Real-time status, heat maps, alerts
- **Voter Roll Verification**: Local voter database access, search tools
- **Form 34/35 Monitor**: Upload tracking, verification, discrepancy detection
- **Incident Logbook**: Issue reporting, escalation, evidence attachment
- **County Analytics**: Turnout tracking, performance metrics, charts

### Bomas HQ Dashboard
- **Real-time Results Map**: Live election outcomes visualization
- **Tallying Engine**: Form 34B/34C processing and validation
- **Evidence Repository**: Scanned form management and verification
- **Alert Center**: Security, connectivity, and device monitoring
- **Judiciary Sync**: Legal process integration
- **Public Updates**: Results publishing and communication

### Executive Board Dashboard
- **Nationwide Analytics**: Comprehensive national overview
- **Legal View**: Real-time legal incident monitoring
- **Treasury Monitor**: Budget tracking and fund disbursement
- **Admin Console**: System-wide controls and emergency interventions
- **Final Result Sign-off**: Official result authorization
- **AI Briefings**: Fraud detection and risk assessment

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: JSON Server (development), MongoDB/PostgreSQL (production)
- **Authentication**: JWT, Biometric simulation, OTP
- **Real-time**: WebSocket connections for live updates
- **Charts**: Chart.js for data visualization
- **Security**: Helmet.js, CORS, Role-based access control

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with ES6 support
- Git for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd iebc-electoral-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

This will start both the API server (port 3000) and the static file server (port 8080).

### 4. Access the Portals

- **Regional Admin**: http://localhost:3000/regional-admin-portal.html
- **Bomas HQ**: http://localhost:3000/bomas-hq-portal.html
- **Executive Board**: http://localhost:3000/board-executive-portal.html

## 🔐 Authentication & Access

### Demo Credentials

#### Regional Admin
- **National ID**: `regional001`
- **Password**: Any password (demo mode)
- **OTP**: Any 6-digit code (demo mode)
- **County**: Nairobi
- **Constituency**: Westlands

#### Bomas HQ
- **National ID**: `bomas001`
- **Password**: Any password (demo mode)
- **OTP**: Any 6-digit code (demo mode)

#### Executive Board
- **National ID**: `executive001`
- **Password**: Any password (demo mode)
- **OTP**: Any 6-digit code (demo mode)

### Security Features
- **JWT Tokens**: Secure session management
- **Role-based Access**: Granular permission control
- **Regional Isolation**: County/constituency data separation
- **Audit Logging**: Complete activity tracking
- **Biometric Simulation**: Fingerprint verification simulation
- **OTP Verification**: Two-factor authentication

## 📊 Data Structure

The system uses a comprehensive database structure including:

- **Users**: Role-based user management
- **Voters**: Voter registration and status
- **Candidates**: Political candidate information
- **Elections**: Election configuration and status
- **Polling Stations**: Station management and monitoring
- **Clerks**: Staff assignment and training
- **Devices**: Equipment tracking and status
- **Incidents**: Issue reporting and escalation
- **Forms**: Form 34/35 upload and verification
- **Results**: Election results and tallies
- **Audit Logs**: Complete system activity tracking

## 🔄 Real-time Features

- **WebSocket Connections**: Live updates across all portals
- **Live Monitoring**: Real-time polling station status
- **Instant Alerts**: Critical incident notifications
- **Live Sync**: Continuous data synchronization
- **Status Updates**: Real-time device and system status

## 📱 Responsive Design

All portals are fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Various screen resolutions

## 🚨 Emergency Controls

### Executive Level Controls
- **System Freeze**: Emergency system shutdown
- **Result Recall**: Force ballot recalls
- **User Suspension**: Immediate access revocation
- **Emergency Interventions**: Critical system overrides

### Regional Escalation
- **Critical Incident Reporting**: Immediate HQ notification
- **Evidence Upload**: Photo/video documentation
- **Witness Statements**: Incident documentation
- **AI Classification**: Automatic severity assessment

## 📈 Analytics & Reporting

### Regional Analytics
- County-level turnout tracking
- Ward-by-ward performance
- Clerk performance metrics
- Device status distribution
- Form upload progress

### National Analytics
- Country-wide turnout trends
- Regional performance comparison
- Risk zone identification
- Legal dispute tracking
- System health monitoring

## 🔧 Configuration

### Environment Variables
```bash
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
```

### Database Configuration
The system uses JSON Server for development. For production:
- Replace JSON Server with MongoDB/PostgreSQL
- Implement proper database connections
- Add data validation and sanitization
- Implement backup and recovery procedures

## 🧪 Testing

### Manual Testing
1. **Authentication Flow**: Test login/logout for each portal
2. **Navigation**: Verify all sections load correctly
3. **Data Display**: Check data loading and display
4. **Real-time Updates**: Test WebSocket connections
5. **Responsive Design**: Test on various devices

### Automated Testing
```bash
npm test
```

## 🚀 Production Deployment

### Security Considerations
- Use environment variables for sensitive data
- Implement HTTPS with valid SSL certificates
- Set up proper firewall rules
- Regular security audits and updates
- Implement rate limiting and DDoS protection

### Performance Optimization
- Database indexing and optimization
- CDN for static assets
- Load balancing for high availability
- Caching strategies
- Monitoring and alerting

### Backup & Recovery
- Regular database backups
- Configuration backup
- Disaster recovery procedures
- Data retention policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
3. Add tests if applicable
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **AI Integration**: Advanced fraud detection
- **Mobile Apps**: Native mobile applications
- **Blockchain**: Immutable result storage
- **Machine Learning**: Predictive analytics
- **API Integration**: Third-party system integration
- **Multi-language Support**: Local language interfaces

## 📚 Additional Resources

- [IEBC Official Website](https://www.iebc.or.ke/)
- [Kenya Constitution Article 88](https://www.kenyalaw.org/lex/actview.xql?actid=Const2010)
- [Electoral Laws and Regulations](https://www.iebc.or.ke/legal-framework/)

---

**Note**: This is a demonstration system. For production use, implement proper security measures, database systems, and follow IEBC's official requirements and procedures.
