const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory voter database for testing
const mockVoters = [
  {
    nationalId: "12345678",
    name: "John Doe",
    dateOfBirth: "1990-01-01",
    address: "123 Main Street, Nairobi",
    phone: "+254712345678",
    county: "Nairobi",
    constituency: "Embakasi East",
    ward: "Embakasi East",
    pollingStation: "Kenyatta Primary School",
    status: "Active",
    hasDisability: false,
    disabilityTypes: [],
    hasVoted: false,
    registrationDate: "2024-01-15T00:00:00.000Z",
    accessibilityPreferences: {
      largeText: false,
      highContrast: false,
      voiceGuidance: false,
      screenReader: false,
      oneHandedMode: false,
      simplifiedInterface: false,
      audioInstructions: false
    }
  },
  {
    nationalId: "87654321",
    name: "Jane Smith",
    dateOfBirth: "1985-05-15",
    address: "456 Oak Avenue, Mombasa",
    phone: "+254723456789",
    county: "Mombasa",
    constituency: "Mvita",
    ward: "Mvita",
    pollingStation: "Mombasa Primary School",
    status: "Active",
    hasDisability: true,
    disabilityTypes: ["visual_impairment"],
    hasVoted: false,
    registrationDate: "2024-02-20T00:00:00.000Z",
    accessibilityPreferences: {
      largeText: true,
      highContrast: true,
      voiceGuidance: true,
      screenReader: true,
      oneHandedMode: false,
      simplifiedInterface: false,
      audioInstructions: false
    }
  },
  {
    nationalId: "11223344",
    name: "Michael Johnson",
    dateOfBirth: "1992-12-10",
    address: "789 Pine Street, Kisumu",
    phone: "+254734567890",
    county: "Kisumu",
    constituency: "Kisumu Central",
    ward: "Kisumu Central",
    pollingStation: "Kisumu High School",
    status: "Active",
    hasDisability: false,
    disabilityTypes: [],
    hasVoted: true,
    votingTime: "2024-08-09T10:30:00.000Z",
    registrationDate: "2024-03-10T00:00:00.000Z",
    accessibilityPreferences: {
      largeText: false,
      highContrast: false,
      voiceGuidance: false,
      screenReader: false,
      oneHandedMode: false,
      simplifiedInterface: false,
      audioInstructions: false
    }
  },
  {
    nationalId: "55667788",
    name: "Sarah Wilson",
    dateOfBirth: "1988-07-22",
    address: "321 Elm Street, Nakuru",
    phone: "+254745678901",
    county: "Nakuru",
    constituency: "Nakuru Town East",
    ward: "Nakuru Town East",
    pollingStation: "Nakuru Primary School",
    status: "Suspended",
    hasDisability: true,
    disabilityTypes: ["physical_disability"],
    hasVoted: false,
    registrationDate: "2024-01-05T00:00:00.000Z",
    accessibilityPreferences: {
      largeText: false,
      highContrast: false,
      voiceGuidance: true,
      oneHandedMode: true,
      screenReader: false,
      simplifiedInterface: false,
      audioInstructions: false
    }
  }
];

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to check voter eligibility
function isEligibleToVote(voter) {
  return voter.status === 'Active' && calculateAge(voter.dateOfBirth) >= 18 && !voter.hasVoted;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Voter Status Checker'
  });
});

// Check voter registration status by National ID
app.get('/api/voters/:nationalId', (req, res) => {
  try {
    const { nationalId } = req.params;
    
    // Validate National ID format
    if (!/^\d{8}$/.test(nationalId)) {
      return res.status(400).json({ 
        error: 'Invalid National ID format. Must be exactly 8 digits.',
        code: 'INVALID_NATIONAL_ID'
      });
    }
    
    // Find voter
    const voter = mockVoters.find(v => v.nationalId === nationalId);
    
    if (!voter) {
      return res.status(404).json({ 
        error: 'Voter not found',
        code: 'VOTER_NOT_FOUND',
        message: 'No voter registered with this National ID'
      });
    }
    
    // Calculate age
    const age = calculateAge(voter.dateOfBirth);
    const eligible = isEligibleToVote(voter);
    
    // Prepare response
    const response = {
      voter: {
        id: voter.nationalId,
        nationalId: voter.nationalId,
        name: voter.name,
        dateOfBirth: voter.dateOfBirth,
        age: age,
        address: voter.address,
        phone: voter.phone,
        county: voter.county,
        constituency: voter.constituency,
        ward: voter.ward,
        pollingStation: voter.pollingStation,
        status: voter.status,
        hasDisability: voter.hasDisability,
        disabilityTypes: voter.disabilityTypes,
        otherDisabilityDescription: voter.otherDisabilityDescription,
        accessibilityPreferences: voter.accessibilityPreferences,
        hasVoted: voter.hasVoted,
        votingTime: voter.votingTime,
        registrationDate: voter.registrationDate,
        eligibleToVote: eligible
      },
      registrationStatus: {
        isRegistered: true,
        status: voter.status,
        eligibleToVote: eligible,
        hasVoted: voter.hasVoted,
        registrationDate: voter.registrationDate,
        pollingStation: voter.pollingStation,
        accessibilityNeeds: voter.hasDisability ? {
          hasDisability: true,
          disabilityTypes: voter.disabilityTypes,
          accessibilityPreferences: voter.accessibilityPreferences
        } : null
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Voter status check error:', error);
    res.status(500).json({ 
      error: 'Server error checking voter status',
      code: 'SERVER_ERROR'
    });
  }
});

// Get voter registration status summary
app.get('/api/voters/:nationalId/status', (req, res) => {
  try {
    const { nationalId } = req.params;
    
    // Validate National ID format
    if (!/^\d{8}$/.test(nationalId)) {
      return res.status(400).json({ 
        error: 'Invalid National ID format. Must be exactly 8 digits.',
        code: 'INVALID_NATIONAL_ID'
      });
    }
    
    // Find voter
    const voter = mockVoters.find(v => v.nationalId === nationalId);
    
    if (!voter) {
      return res.status(404).json({ 
        error: 'Voter not found',
        code: 'VOTER_NOT_FOUND',
        message: 'No voter registered with this National ID'
      });
    }
    
    const age = calculateAge(voter.dateOfBirth);
    const eligible = isEligibleToVote(voter);
    
    res.json({
      nationalId: voter.nationalId,
      name: voter.name,
      isRegistered: true,
      status: voter.status,
      eligibleToVote: eligible,
      hasVoted: voter.hasVoted,
      age: age,
      pollingStation: voter.pollingStation,
      county: voter.county,
      constituency: voter.constituency,
      ward: voter.ward,
      registrationDate: voter.registrationDate,
      accessibilityNeeds: voter.hasDisability,
      message: eligible ? 
        (voter.hasVoted ? 'Voter has already voted' : 'Voter is eligible to vote') :
        'Voter is not eligible to vote'
    });
  } catch (error) {
    console.error('Voter status summary error:', error);
    res.status(500).json({ 
      error: 'Server error checking voter status',
      code: 'SERVER_ERROR'
    });
  }
});

// Get all voters (for testing)
app.get('/api/voters', (req, res) => {
  try {
    const { status, county, hasDisability } = req.query;
    
    let filteredVoters = [...mockVoters];
    
    // Apply filters
    if (status) {
      filteredVoters = filteredVoters.filter(v => v.status === status);
    }
    
    if (county) {
      filteredVoters = filteredVoters.filter(v => 
        v.county.toLowerCase().includes(county.toLowerCase())
      );
    }
    
    if (hasDisability !== undefined) {
      const hasDisabilityBool = hasDisability === 'true';
      filteredVoters = filteredVoters.filter(v => v.hasDisability === hasDisabilityBool);
    }
    
    res.json({
      voters: filteredVoters.map(voter => ({
        nationalId: voter.nationalId,
        name: voter.name,
        county: voter.county,
        constituency: voter.constituency,
        ward: voter.ward,
        pollingStation: voter.pollingStation,
        status: voter.status,
        hasDisability: voter.hasDisability,
        hasVoted: voter.hasVoted,
        eligibleToVote: isEligibleToVote(voter)
      })),
      total: filteredVoters.length,
      filters: { status, county, hasDisability }
    });
  } catch (error) {
    console.error('Get voters error:', error);
    res.status(500).json({ 
      error: 'Server error fetching voters',
      code: 'SERVER_ERROR'
    });
  }
});

// Get voter statistics
app.get('/api/voters/stats/summary', (req, res) => {
  try {
    const totalVoters = mockVoters.length;
    const activeVoters = mockVoters.filter(v => v.status === 'Active').length;
    const votersWithDisabilities = mockVoters.filter(v => v.hasDisability).length;
    const votersWhoHaveVoted = mockVoters.filter(v => v.hasVoted).length;
    const eligibleVoters = mockVoters.filter(v => isEligibleToVote(v)).length;
    
    // County breakdown
    const countyStats = mockVoters.reduce((acc, voter) => {
      if (!acc[voter.county]) {
        acc[voter.county] = { total: 0, active: 0, withDisabilities: 0 };
      }
      acc[voter.county].total++;
      if (voter.status === 'Active') acc[voter.county].active++;
      if (voter.hasDisability) acc[voter.county].withDisabilities++;
      return acc;
    }, {});
    
    res.json({
      summary: {
        totalVoters,
        activeVoters,
        votersWithDisabilities,
        votersWhoHaveVoted,
        eligibleVoters,
        inactiveVoters: totalVoters - activeVoters
      },
      percentages: {
        activePercentage: ((activeVoters / totalVoters) * 100).toFixed(2),
        disabilityPercentage: ((votersWithDisabilities / totalVoters) * 100).toFixed(2),
        votedPercentage: ((votersWhoHaveVoted / totalVoters) * 100).toFixed(2),
        eligiblePercentage: ((eligibleVoters / totalVoters) * 100).toFixed(2)
      },
      countyBreakdown: countyStats
    });
  } catch (error) {
    console.error('Voter statistics error:', error);
    res.status(500).json({ 
      error: 'Server error fetching voter statistics',
      code: 'SERVER_ERROR'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Voter Status Checker Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/health - Health check`);
  console.log(`  GET /api/voters/:nationalId - Check voter registration status`);
  console.log(`  GET /api/voters/:nationalId/status - Get voter status summary`);
  console.log(`  GET /api/voters - Get all voters (with filters)`);
  console.log(`  GET /api/voters/stats/summary - Get voter statistics`);
});

module.exports = app;