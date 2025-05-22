const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Mock verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
  console.log('Received OTP verification request:', req.body);
  
  // Always return success for testing
  res.json({
    success: true,
    status: 'approved',
    module: 'Claims',
    session_token: 'test_session_token_123'
  });
});

// Mock send OTP endpoint
app.post('/api/send-otp', (req, res) => {
  console.log('Received send OTP request:', req.body);
  
  // Always return success for testing
  res.json({
    success: true,
    message: 'OTP sent successfully'
  });
});

// Mock get claims endpoint
app.get('/api/get-claims', (req, res) => {
  console.log('Received get claims request');
  
  // Return mock claims data
  res.json({
    success: true,
    claims: [
      { id: 1, title: 'Mock Claim 1', status: 'Pending' },
      { id: 2, title: 'Mock Claim 2', status: 'Approved' },
      { id: 3, title: 'Mock Claim 3', status: 'Rejected' }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
