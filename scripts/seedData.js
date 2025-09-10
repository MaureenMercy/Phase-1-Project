const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Position = require('../models/Position');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iebc_elections', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedData() {
  try {
    console.log('Starting data seeding...');

    // Create default users
    const users = [
      {
        username: 'admin',
        email: 'admin@iebc.go.ke',
        password: 'admin123',
        role: 'hq_official',
        permissions: ['candidate_approval', 'position_assignment', 'ballot_approval', 'audit_view']
      },
      {
        username: 'regional_nairobi',
        email: 'nairobi@iebc.go.ke',
        password: 'regional123',
        role: 'regional_officer',
        jurisdiction: 'Nairobi',
        permissions: ['candidate_approval', 'position_assignment', 'audit_view']
      },
      {
        username: 'legal_auditor',
        email: 'legal@iebc.go.ke',
        password: 'legal123',
        role: 'legal_auditor',
        permissions: ['ballot_approval', 'audit_view']
      },
      {
        username: 'judiciary_observer',
        email: 'judiciary@iebc.go.ke',
        password: 'judiciary123',
        role: 'judiciary_observer',
        permissions: ['read_only', 'audit_view']
      }
    ];

    console.log('Creating users...');
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.username}`);
      } else {
        console.log(`User already exists: ${userData.username}`);
      }
    }

    // Create positions
    const positions = [
      {
        name: 'President',
        code: 'president',
        level: 'national',
        requirements: {
          minAge: 35,
          maxAge: null,
          educationLevel: 'secondary',
          citizenship: 'kenyan',
          residencyYears: 0
        },
        jurisdictionRules: {
          allowMultipleCandidates: true,
          maxCandidates: null,
          requiresDeputy: true,
          deputyRequirements: {
            minAge: 35,
            educationLevel: 'secondary',
            citizenship: 'kenyan'
          }
        },
        ballotConfig: {
          displayOrder: 1,
          showPartySymbol: true,
          showPartyColor: true,
          showDeputy: true,
          randomizeOrder: false
        },
        description: 'President of the Republic of Kenya'
      },
      {
        name: 'Governor',
        code: 'governor',
        level: 'county',
        requirements: {
          minAge: 18,
          maxAge: null,
          educationLevel: 'secondary',
          citizenship: 'kenyan',
          residencyYears: 0
        },
        jurisdictionRules: {
          allowMultipleCandidates: true,
          maxCandidates: null,
          requiresDeputy: true,
          deputyRequirements: {
            minAge: 18,
            educationLevel: 'secondary',
            citizenship: 'kenyan'
          }
        },
        ballotConfig: {
          displayOrder: 2,
          showPartySymbol: true,
          showPartyColor: true,
          showDeputy: true,
          randomizeOrder: false
        },
        description: 'County Governor'
      },
      {
        name: 'Senator',
        code: 'senator',
        level: 'county',
        requirements: {
          minAge: 18,
          maxAge: null,
          educationLevel: 'secondary',
          citizenship: 'kenyan',
          residencyYears: 0
        },
        jurisdictionRules: {
          allowMultipleCandidates: true,
          maxCandidates: null,
          requiresDeputy: false
        },
        ballotConfig: {
          displayOrder: 3,
          showPartySymbol: true,
          showPartyColor: true,
          showDeputy: false,
          randomizeOrder: false
        },
        description: 'County Senator'
      },
      {
        name: 'Member of Parliament',
        code: 'mp',
        level: 'constituency',
        requirements: {
          minAge: 18,
          maxAge: null,
          educationLevel: 'secondary',
          citizenship: 'kenyan',
          residencyYears: 0
        },
        jurisdictionRules: {
          allowMultipleCandidates: true,
          maxCandidates: null,
          requiresDeputy: false
        },
        ballotConfig: {
          displayOrder: 4,
          showPartySymbol: true,
          showPartyColor: true,
          showDeputy: false,
          randomizeOrder: false
        },
        description: 'Member of Parliament'
      },
      {
        name: 'Woman Representative',
        code: 'woman_rep',
        level: 'county',
        requirements: {
          minAge: 18,
          maxAge: null,
          educationLevel: 'secondary',
          citizenship: 'kenyan',
          residencyYears: 0
        },
        jurisdictionRules: {
          allowMultipleCandidates: true,
          maxCandidates: null,
          requiresDeputy: false
        },
        ballotConfig: {
          displayOrder: 5,
          showPartySymbol: true,
          showPartyColor: true,
          showDeputy: false,
          randomizeOrder: false
        },
        description: 'County Woman Representative'
      },
      {
        name: 'Member of County Assembly',
        code: 'mca',
        level: 'ward',
        requirements: {
          minAge: 18,
          maxAge: null,
          educationLevel: 'primary',
          citizenship: 'kenyan',
          residencyYears: 0
        },
        jurisdictionRules: {
          allowMultipleCandidates: true,
          maxCandidates: null,
          requiresDeputy: false
        },
        ballotConfig: {
          displayOrder: 6,
          showPartySymbol: true,
          showPartyColor: true,
          showDeputy: false,
          randomizeOrder: false
        },
        description: 'Member of County Assembly'
      }
    ];

    console.log('Creating positions...');
    for (const positionData of positions) {
      const existingPosition = await Position.findOne({ code: positionData.code });
      if (!existingPosition) {
        const position = new Position(positionData);
        await position.save();
        console.log(`Created position: ${positionData.name}`);
      } else {
        console.log(`Position already exists: ${positionData.name}`);
      }
    }

    console.log('Data seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('HQ Official: admin@iebc.go.ke / admin123');
    console.log('Regional Officer: nairobi@iebc.go.ke / regional123');
    console.log('Legal Auditor: legal@iebc.go.ke / legal123');
    console.log('Judiciary Observer: judiciary@iebc.go.ke / judiciary123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();