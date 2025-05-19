exports.handler = async function(event) {
  console.log('Function invoked with event:', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body
  });

  // Allow CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    // Parse the request body
    console.log('Parsing request body:', event.body);
    const requestBody = JSON.parse(event.body || '{}');
    
    // Validate required fields - either leadID or contactID must be present
    if ((!requestBody.leadID && !requestBody.contactID) || !Array.isArray(requestBody.carClaimIDs) || requestBody.carClaimIDs.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Missing required fields", 
          details: "leadID, contactID, and carClaimIDs are required" 
        })
      };
    }
    
    console.log('Making request to Zoho API with data:', requestBody);
    
    // Make request to Zoho API
    const url = 'https://www.zohoapis.eu/crm/v7/functions/contactsendcarclaimpack/actions/execute?auth_type=apikey&zapikey=1003.0f6c22c14bf2d30cf7c97fec7729e4a9.1b01e1da86ebfaee8dbd8d022d5a91fb';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        leadID: requestBody.leadID,
        contactID: requestBody.contactID,
        carClaimIDs: requestBody.carClaimIDs
      })
    });

    console.log('Zoho API response status:', response.status);
    
    // Get the response text first
    const responseText = await response.text();
    console.log('Zoho API raw response:', responseText);
    
    // Parse the response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Zoho API parsed response:', data);
    } catch (parseError) {
      console.error('Failed to parse Zoho API response as JSON:', parseError);
      // Return error for parsing errors
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to parse API response',
          details: parseError.message
        })
      };
    }

    // Check if the response indicates an error
    if (data.error) {
      console.error('Zoho API returned an error:', data.error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: data.error,
          details: data.details || 'Unknown error from Zoho API'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Proxy error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
