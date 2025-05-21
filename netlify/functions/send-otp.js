const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { email } = requestBody;

    // Validate email
    if (!email || typeof email !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log(`Sending OTP to email: ${email}`);

    // Call the Zoho API to send OTP
    const zohoResponse = await axios.post(
      'https://www.zohoapis.eu/crm/v7/functions/cmlportalotp/actions/execute?auth_type=apikey&zapikey=1003.0f6c22c14bf2d30cf7c97fec7729e4a9.1b01e1da86ebfaee8dbd8d022d5a91fb',
      { email }
    );

    console.log('Zoho API response:', zohoResponse.status, zohoResponse.data);

    // Return the response from Zoho
    return {
      statusCode: zohoResponse.status,
      body: JSON.stringify(zohoResponse.data)
    };
  } catch (error) {
    console.error('Error sending OTP:', error);

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from Zoho API:', error.response.status, error.response.data);
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          error: 'Failed to send OTP',
          details: error.response.data
        })
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Zoho API');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No response from authentication service' })
      };
    } else if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
      console.error('Error parsing JSON:', error.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    } else if (error instanceof TypeError) {
      // Handle type errors
      console.error('Type error:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to process request' })
      };
    }
  }
};
