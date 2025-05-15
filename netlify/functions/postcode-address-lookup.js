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

  try {
    // Extract parameters from the request
    console.log('Parsing request body:', event.body);
    const params = JSON.parse(event.body || '{}');
    const { postcode } = params;

    console.log('Extracted postcode:', postcode);

    if (!postcode || typeof postcode !== 'string') {
      console.log('Invalid postcode format:', postcode);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Postcode is required' })
      };
    }

    // Format postcode to match expected pattern (e.g., "SW1A 1AA" -> "SW1A1AA")
    const formattedPostcode = postcode.toUpperCase().replace(/\s+/g, '');
    console.log('Formatted postcode:', formattedPostcode);

    // Make the request to Zoho
    console.log('Making request to Zoho API with params:', {
      url: 'https://www.zohoapis.eu/creator/custom/htlhltd/Postcode_Address_Lookup',
      publickey: 'r5NmAhpHWjB0BDPTZCN7QuxRa',
      postcode: formattedPostcode
    });

    const url = new URL('https://www.zohoapis.eu/creator/custom/htlhltd/Postcode_Address_Lookup');
    url.searchParams.append('publickey', 'r5NmAhpHWjB0BDPTZCN7QuxRa');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: {
          postcode: formattedPostcode
        }
      })
    });

    console.log('Zoho API response status:', response.status);
    
    // Get the response text first
    const responseText = await response.text();
    console.log('Zoho API raw response:', responseText);
    
    // Try to parse as JSON, but handle non-JSON responses
    let data;
    try {
      // The response might be in a format like {addressList=[...]} which is not valid JSON
      // Let's try to fix it if it's in that format
      let jsonText = responseText;
      if (responseText.includes('addressList=[')) {
        // Replace addressList=[ with addressList:[ to make it valid JSON
        jsonText = responseText.replace('addressList=[', 'addressList:[');
        console.log('Fixed JSON format:', jsonText);
      }
      
      data = JSON.parse(jsonText);
      console.log('Zoho API parsed response:', data);
      
      // Transform the data to match the expected format in the frontend
      if (data.result?.addressList) {
        // Create a map to track unique addresses
        const uniqueAddresses = new Map();
        
        data.result.addressList.forEach(address => {
          // Create a unique key combining building number and business name
          const key = `${address.buildingNumber}-${address.subBuildingName || ''}`;
          
          // Construct the address line according to the Deluge snippet
          let addressLine = address.buildingNumber !== "" ? address.buildingNumber : address.buildingName;
          addressLine = addressLine + " " + (address.thoroughfare || "");
          addressLine = addressLine + (address.locality !== "" ? ", " + address.locality : "");
          addressLine = addressLine + (address.postTown !== "" ? ", " + address.postTown : "");
          addressLine = addressLine + (address.county !== "" ? ", " + address.county : "");
          addressLine = addressLine + (address.country !== "" ? ", " + address.country : "");
          
          // If this is a business address, add the business name
          if (address.subBuildingName) {
            addressLine = `${address.subBuildingName}, ${addressLine}`;
          }
          
          // Only add if we haven't seen this exact address before
          if (!uniqueAddresses.has(key)) {
            uniqueAddresses.set(key, {
              displayText: addressLine,
              houseNumber: address.buildingNumber || "",
              houseName: address.buildingName || address.subBuildingName || ""
            });
          }
        });
        
        data = {
          result: {
            addressList: Array.from(uniqueAddresses.values())
          }
        };
      } else {
        // If no addresses found, return empty result
        data = {
          result: {}
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Zoho API response as JSON:', parseError);
      // Return empty result for any parsing errors
      data = {
        result: {}
      };
    }

    // Return the response
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