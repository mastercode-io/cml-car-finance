exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const requestBody = JSON.parse(event.body);
    console.log('Support request received:', requestBody);

    // Validate that either email or mobile is provided
    if (!requestBody.email && !requestBody.mobile) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Either email or mobile is required' 
        })
      };
    }

    // Mock successful response
    // In a real implementation, this would:
    // 1. Log the support request to a database
    // 2. Send notification to support team
    // 3. Create a ticket in support system
    
    console.log('Processing support request for:', {
      email: requestBody.email || 'N/A',
      mobile: requestBody.mobile || 'N/A',
      reason: 'Multiple records found during login',
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Support request submitted successfully'
      })
    };

  } catch (error) {
    console.error('Error processing support request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error' 
      })
    };
  }
};
