# IEBC Election Management System

A comprehensive election management system for the Independent Electoral and Boundaries Commission (IEBC) of Kenya, providing full control over candidate approvals, position assignments, and ballot configuration workflows down to the ward level.

## Features

### 🗳️ Candidate Registration
- Complete candidate data management with validation
- Document uploads (passport photos, academic certificates, nomination documents)
- Deputy attachment for Governor and President positions
- Party symbol, slogan, and color management
- Status tracking (Pending Verification, Approved, Rejected)
- Appeals window management for rejected applications

### 📋 Position Assignment
- Automatic position eligibility detection
- Manual assignment with override capabilities
- Support for all electoral positions:
  - MCA (Ward level)
  - Woman Rep (County level)
  - MP (Constituency level)
  - Senator (County level)
  - Governor (County level)
  - President (National level)
- Duplicate candidate prevention
- Jurisdiction validation

### 🗂️ Ballot Approval Workflow
- Multi-stage approval process:
  1. Regional Officer submission
  2. HQ review and confirmation
  3. Legal Auditor compliance check
  4. HQ final sign-off and lock
- Real-time ballot preview generation
- Candidate order and party information validation
- Deputy attachment verification
- Post-approval read-only access

### 🔐 Security Features
- JWT-based authentication
- Role-based access control (HQ Officials, Regional Officers, Legal Auditors, Judiciary Observers)
- Comprehensive audit logging with tamper-proof chain of custody
- Multi-user approval requirements
- IP address and session tracking
- Password hashing with bcrypt

### 📊 Dashboard & Analytics
- Real-time metrics and statistics
- Candidate registration overview
- Position assignment tracking
- Ballot approval status
- System activity monitoring
- Security event tracking
- Jurisdiction-specific data views

## User Roles

### IEBC HQ Officials
- Full system access
- Candidate approval/rejection
- Position assignment
- Ballot approval and locking
- User management
- System configuration

### Regional Electoral Officers
- Candidate registration and verification
- Position assignment for their jurisdiction
- Ballot draft submission
- Audit log access

### Legal Auditors
- Ballot compliance verification
- Legal requirement validation
- Audit trail access

### Judiciary Observers
- Read-only access to all data
- Audit log viewing
- Ballot preview access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (HQ only)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Candidates
- `GET /api/candidates` - List candidates with filtering
- `GET /api/candidates/:id` - Get single candidate
- `POST /api/candidates` - Create new candidate
- `PUT /api/candidates/:id` - Update candidate
- `PUT /api/candidates/:id/approve` - Approve candidate
- `PUT /api/candidates/:id/reject` - Reject candidate
- `POST /api/candidates/:id/notes` - Add note to candidate
- `GET /api/candidates/stats/overview` - Get candidate statistics

### Positions
- `GET /api/positions` - List all positions
- `GET /api/positions/:id` - Get single position
- `POST /api/positions` - Create new position (HQ only)
- `PUT /api/positions/:id` - Update position
- `POST /api/positions/auto-assign` - Auto-assign candidates
- `POST /api/positions/assign` - Manual position assignment
- `GET /api/positions/stats/assignments` - Get assignment statistics
- `POST /api/positions/validate` - Validate assignments

### Ballots
- `GET /api/ballots` - List ballots with filtering
- `GET /api/ballots/:id` - Get single ballot
- `POST /api/ballots` - Create new ballot
- `PUT /api/ballots/:id` - Update ballot configuration
- `PUT /api/ballots/:id/submit` - Submit ballot for review
- `PUT /api/ballots/:id/review` - Review ballot (HQ)
- `PUT /api/ballots/:id/legal-audit` - Legal audit (Legal Auditor)
- `PUT /api/ballots/:id/lock` - Lock ballot (Final approval)
- `POST /api/ballots/:id/preview` - Generate ballot preview
- `GET /api/ballots/stats/overview` - Get ballot statistics

### Audit & Dashboard
- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/trail/:entityType/:entityId` - Get entity audit trail
- `GET /api/audit/summary` - Get audit summary
- `GET /api/audit/security` - Get security events
- `GET /api/audit/export` - Export audit logs
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/candidates/stats` - Candidate statistics
- `GET /api/dashboard/ballots/stats` - Ballot statistics
- `GET /api/dashboard/activity` - System activity
- `GET /api/dashboard/security` - Security dashboard

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iebc-election-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

5. **Seed initial data**
   ```bash
   node scripts/seedData.js
   ```

6. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Default Login Credentials

After running the seed script, you can use these credentials:

- **HQ Official**: `admin@iebc.go.ke` / `admin123`
- **Regional Officer**: `nairobi@iebc.go.ke` / `regional123`
- **Legal Auditor**: `legal@iebc.go.ke` / `legal123`
- **Judiciary Observer**: `judiciary@iebc.go.ke` / `judiciary123`

## Database Schema

### Users
- Authentication and authorization
- Role-based permissions
- Jurisdiction assignments

### Candidates
- Personal information
- Political party details
- Document uploads
- Status tracking
- Audit trail

### Positions
- Electoral position definitions
- Eligibility requirements
- Ballot configuration
- Jurisdiction rules

### Ballots
- Position and jurisdiction mapping
- Candidate assignments
- Approval workflow
- Validation results
- Chain of custody

### Audit Logs
- Comprehensive activity tracking
- Tamper-proof integrity
- Security event monitoring
- Export capabilities

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- File upload restrictions
- Audit logging for compliance
- Role-based access control

## Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Migrations
```bash
# Add new migration scripts as needed
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions, please contact the IEBC Technical Team.

## Changelog

### Version 1.0.0
- Initial release
- Complete candidate management system
- Position assignment workflow
- Ballot approval process
- Comprehensive audit logging
- Role-based access control
- Dashboard and analytics