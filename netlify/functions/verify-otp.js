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
    const { email, otp } = requestBody;

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    if (!otp || typeof otp !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'OTP is required' })
      };
    }

    // Determine the channel (email or mobile)
    const channel = email ? 'email' : 'mobile';
    const identifier = email || mobile;
    
    console.log(`Verifying OTP for ${channel}: ${identifier}, OTP: ${otp}`);

    // Call the Zoho API to verify OTP
    const zohoResponse = await axios.post(
      'https://www.zohoapis.eu/crm/v7/functions/cmlportalverifyotp/actions/execute?auth_type=apikey&zapikey=1003.0f6c22c14bf2d30cf7c97fec7729e4a9.1b01e1da86ebfaee8dbd8d022d5a91fb',
      { 
        channel, 
        otp 
      }
    );

    console.log('Zoho API response:', zohoResponse.status, zohoResponse.data);
    
    // Process the response based on status
    const responseData = zohoResponse.data;
    
    if (responseData.status === 'approved') {
      // OTP verified successfully
      console.log('OTP verification successful, user approved');
      
      // Check if the response contains the expected fields
      if (responseData.module) {
        console.log('Module:', responseData.module);
        
        // Use id as session_token if no explicit session_token is provided
        const sessionToken = responseData.session_token || responseData.id;
        console.log('Session token:', sessionToken);
        
        // Return the module and session_token for frontend use
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            status: 'approved',
            module: responseData.module,
            session_token: sessionToken
          })
        };
      } else {
        console.error('Missing required fields in approved response:', responseData);
        return {
          statusCode: 500,
          body: JSON.stringify({
            success: false,
            status: 'error',
            error: 'Missing required authentication data in response'
          })
        };
      }
    } else if (responseData.status === 'expired') {
      // OTP has expired
      console.log('OTP has expired');
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          status: 'expired',
          error: 'Verification code has expired. Please request a new code.'
        })
      };
    } else if (responseData.status === 'used') {
      // OTP has already been used
      console.log('OTP has already been used');
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          status: 'used',
          error: 'This verification code has already been used. Please request a new code.'
        })
      };
    } else {
      // Unknown status
      console.log('Unknown OTP verification status:', responseData.status);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          status: responseData.status || 'unknown',
          error: 'Invalid verification code. Please try again.'
        })
      };
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from API:', error.response.status, error.response.data);
      return {
        statusCode: error.response.status,
        body: JSON.stringify({
          error: 'Failed to verify OTP',
          details: error.response.data
        })
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No response from verification service' })
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
