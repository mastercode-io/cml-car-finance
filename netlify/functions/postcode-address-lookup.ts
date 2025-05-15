import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    console.log('Parsing request body:', body);

    // Check if this is a credit search request
    if (body.endpoint && body.endpoint.includes('CML_Credit_Search')) {
      console.log('Processing credit search request');
      
      // Extract the credit search data
      const { endpoint, publickey, data } = body;
      
      // Make the request to the Zoho API
      const response = await fetch(`${endpoint}?publickey=${publickey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: data }),
      });

      // Get the response data
      const responseData = await response.json();
      console.log('Credit search response:', responseData);

      // Return the response
      return {
        statusCode: 200,
        body: JSON.stringify(responseData),
      };
    }
    
    // Otherwise, treat as an address lookup request
    const postcode = body.postcode;
    console.log('Extracted postcode:', postcode);

    if (!postcode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Postcode is required' }),
      };
    }

    // Validate postcode format (basic check)
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
      console.log('Invalid postcode format:', postcode);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid postcode format' }),
      };
    }

    // Make the request to the Zoho API
    const response = await fetch(`https://www.zohoapis.eu/creator/custom/htlhltd/Address_Lookup?publickey=RwKQhsHyJdyUaShgmyrD19RHM`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postcode }),
    });

    // Get the response data
    const responseData = await response.json();
    console.log('Address lookup response:', responseData);

    // Return the response
    return {
      statusCode: 200,
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler }; 