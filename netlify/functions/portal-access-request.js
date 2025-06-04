/**
 * Netlify Function: portal-access-request
 * 
 * This function handles portal access requests from new users.
 * It will eventually integrate with Zoho CRM API to create leads,
 * but currently returns a mock success response.
 */

exports.handler = async (event, context) => {
  // Set up CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle OPTIONS request (preflight CORS check)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    
    // Validate required fields
    if (!requestBody.firstName || !requestBody.lastName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'First name and last name are required' })
      };
    }
    
    if (!requestBody.email && !requestBody.mobile) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Either email or mobile is required' })
      };
    }
    
    if (!requestBody.claimTypes || requestBody.claimTypes.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'At least one claim type must be selected' })
      };
    }
    
    // Log the request for debugging (would be replaced with actual API call to Zoho)
    console.log('Processing portal access request:', {
      firstName: requestBody.firstName,
      lastName: requestBody.lastName,
      email: requestBody.email || 'Not provided',
      mobile: requestBody.mobile || 'Not provided',
      claimTypes: requestBody.claimTypes,
      timestamp: new Date().toISOString()
    });
    
    // Mock successful response
    // In the future, this would call the Zoho CRM API to create a lead
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Portal access request submitted successfully'
      })
    };
  } catch (error) {
    console.error('Error processing portal access request:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
