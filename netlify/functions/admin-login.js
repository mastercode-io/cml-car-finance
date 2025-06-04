const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { login, password, email, mobile } = requestBody;

    // Validate required fields
    if (!login || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Login and password are required' })
      };
    }

    // Validate that either email or mobile is provided, but not both
    if ((!email && !mobile) || (email && mobile)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Either email or mobile is required, but not both' })
      };
    }

    // Forward the payload to Zoho CRM function
    const zohoResponse = await axios.post(
      'https://www.zohoapis.eu/crm/v7/functions/cmlportaladminlogin/actions/execute?auth_type=apikey&zapikey=1003.0f6c22c14bf2d30cf7c97fec7729e4a9.1b01e1da86ebfaee8dbd8d022d5a91fb',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Zoho API response:', zohoResponse.status, zohoResponse.data);

    // Handle successful response from Zoho
    return {
      statusCode: 200,
      body: JSON.stringify(zohoResponse.data)
    };

  } catch (error) {
    console.error('Error in admin login:', error);

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      const { status, data } = error.response;
      console.error('Error response from Zoho API:', status, data);

      // Handle specific error cases based on Zoho's response
      if (data && data.details && data.details.output) {
        const output = data.details.output;
        
        // Case: Client not found
        if (output.status === 'NOT_FOUND' || output.code === 404) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Client with these details was not found.' })
          };
        }
        
        // Case: Multiple clients found
        if (output.status === 'CONFLICT' || output.code === 409) {
          return {
            statusCode: 409,
            body: JSON.stringify({
              message: 'Multiple clients found.',
              records: output.records || []
            })
          };
        }
      }

      // Default error response for other status codes
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error. Please try again later.' })
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Zoho API');
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error. Please try again later.' })
      };
    } else if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
      console.error('Error parsing JSON:', error.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request format' })
      };
    } else {
      // Something else happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error. Please try again later.' })
      };
    }
  }
};
