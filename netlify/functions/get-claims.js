const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Get the authorization token from the request headers
    const authHeader = event.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Missing or invalid authorization token' 
        })
      };
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
    
    console.log('Fetching claims data with token:', token.substring(0, 10) + '...');
    
    // Call the Zoho API to get claims data with token as URL parameter
    // Zoho doesn't accept custom headers, so we need to pass the token in the URL
    // Make sure to use & for all parameters after the first one (which uses ?)
    const apiUrl = `https://www.zohoapis.eu/crm/v7/functions/cmlportalgetclaims/actions/execute?auth_type=apikey&zapikey=1003.0f6c22c14bf2d30cf7c97fec7729e4a9.1b01e1da86ebfaee8dbd8d022d5a91fb&token=${encodeURIComponent(token)}`;
    
    console.log('Calling Zoho API with URL:', apiUrl.substring(0, 100) + '...');
    console.log('Full URL (for debugging):', apiUrl);
    
    const zohoResponse = await axios.get(apiUrl);
    
    console.log('Zoho API response status:', zohoResponse.status);
    
    // Log the response data structure
    console.log('Zoho API response data type:', typeof zohoResponse.data);
    console.log('Zoho API response data structure:', JSON.stringify(zohoResponse.data).substring(0, 200) + '...');
    
    // Process the response data
    let claimsData = zohoResponse.data;
    
    // Check if the response is a string that looks like multiple JSON objects without array brackets
    if (typeof claimsData === 'string' && claimsData.includes('},{')) {
      console.log('Fixing malformed JSON array in response');
      // Add array brackets around the string and parse it
      try {
        claimsData = JSON.parse(`[${claimsData}]`);
        console.log('Successfully parsed claims data as array');
      } catch (parseError) {
        console.error('Error parsing claims data:', parseError);
        // If parsing fails, return the original data
      }
    }
    
    // Return the claims data with CORS headers
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Array.isArray(claimsData) ? claimsData : [claimsData])
    };
  } catch (error) {
    console.error('Error fetching claims:', error.message);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)).substring(0, 500));
    
    // Check for specific error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error status:', error.response.status);
      console.error('Response error data:', JSON.stringify(error.response.data));
      console.error('Response headers:', JSON.stringify(error.response.headers));
      
      // Return appropriate error based on status code
      if (error.response.status === 401 || error.response.status === 403) {
        return {
          statusCode: error.response.status,
          body: JSON.stringify({
            error: error.response.status === 401 ? 'Unauthorized' : 'Forbidden',
            message: 'Your session has expired or you do not have permission to access this resource'
          })
        };
      }
      
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          error: 'API Error',
          message: error.response.data?.message || 'An error occurred while fetching claims data'
        })
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
      return {
        statusCode: 504,
        body: JSON.stringify({
          error: 'Gateway Timeout',
          message: 'No response received from the claims service'
        })
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred while processing your request'
        })
      };
    }
  }
};
