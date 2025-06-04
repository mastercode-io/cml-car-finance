const axios = require('axios');

/**
 * Netlify Function: portal-signup
 * 
 * This function forwards portal signup requests to the Zoho CRM API.
 * It accepts a POST request with user details and claim types,
 * forwards the request to Zoho, and returns the response.
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
    
    // Log the request (without sensitive data)
    console.log('Processing portal signup request:', {
      timestamp: new Date().toISOString(),
      hasEmail: !!requestBody.email,
      hasMobile: !!requestBody.mobile,
      claimTypesCount: requestBody.claimTypes.length
    });
    
    // Forward the request to Zoho CRM API
    const zohoResponse = await axios.post(
      'https://www.zohoapis.eu/crm/v7/functions/cmlportalsignup/actions/execute?auth_type=apikey&zapikey=1003.0f6c22c14bf2d30cf7c97fec7729e4a9.1b01e1da86ebfaee8dbd8d022d5a91fb',
      requestBody
    );
    
    console.log('Zoho API response status:', zohoResponse.status);
    
    // Return the Zoho API response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(zohoResponse.data)
    };
    
  } catch (error) {
    console.error('Error processing portal signup request:', error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from Zoho API:', error.response.status, error.response.data);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Submission failed. Please try again later.' })
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Zoho API');
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Submission failed. Please try again later.' })
      };
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Submission failed. Please try again later.' })
      };
    }
  }
};
