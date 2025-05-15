# Developing with Netlify Functions to Bypass CORS

This guide explains how to set up a local development environment for using Netlify Functions as a CORS proxy for Zoho Creator/CRM API endpoints.

## Setup Process

### 1. Install Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Initialize your project (if not already done)
npm init -y

# Install required dependencies
npm install --save-dev netlify-cli
```

### 2. Create Project Structure

Set up a directory structure like this:

```
your-project/
├── netlify/
│   └── functions/
│       └── zoho-proxy.js
├── public/
│   └── index.html
└── netlify.toml
```

### 3. Implement Proxy Function

Create the file `netlify/functions/zoho-proxy.js`:

```javascript
const axios = require('axios');

exports.handler = async function(event) {
  // Allow CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  try {
    // Extract parameters from the request
    const params = JSON.parse(event.body || '{}');
    const { endpoint, method = 'GET', data = null, headers: customHeaders = {} } = params;

    if (!endpoint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Zoho API endpoint is required' })
      };
    }

    // Make the request to Zoho
    const response = await axios({
      method: method,
      url: endpoint,
      data: data,
      headers: {
        ...customHeaders
      }
    });

    // Return the response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data
      })
    };
  }
};
```

### 4. Configure Netlify Settings

Create a `netlify.toml` file at the root of your project:

```toml
[build]
  publish = "public"
  functions = "netlify/functions"

[dev]
  framework = "#custom"
  command = "npm run dev"
  port = 8888
  targetPort = 3000
  autoLaunch = true
```

### 5. Create Test HTML Page

Create a simple `public/index.html` file to test the function:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Zoho API Test</title>
</head>
<body>
  <h1>Zoho API Test</h1>
  <button id="testBtn">Test Zoho API</button>
  <pre id="result"></pre>

  <script>
    document.getElementById('testBtn').addEventListener('click', async () => {
      try {
        const response = await fetch('/.netlify/functions/zoho-proxy', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: 'https://creator.zoho.com/api/v2/your-endpoint-here',
            method: 'GET',
            headers: {
              'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
          })
        });
        
        const data = await response.json();
        document.getElementById('result').textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        document.getElementById('result').textContent = 'Error: ' + error.message;
      }
    });
  </script>
</body>
</html>
```

### 6. Run Local Development Server

```bash
netlify dev
```

This starts a local server at `http://localhost:8888` that simulates the Netlify environment.

## Using in Your Application

To make API calls in your actual application code:

```javascript
async function callZohoAPI(endpoint, method = 'GET', data = null, headers = {}) {
  try {
    const response = await fetch('/.netlify/functions/zoho-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint,
        method,
        data,
        headers
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Zoho API:', error);
    throw error;
  }
}

// Example usage
callZohoAPI(
  'https://creator.zoho.com/api/v2/your-endpoint', 
  'GET', 
  null, 
  { 'Authorization': 'Bearer your-auth-token' }
)
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

## Benefits of This Approach

- Develop locally with the same code that will run in production
- No need for a separate backend server
- Seamless deployment to Netlify
- Secure handling of API requests and authentication
- Proper CORS handling for browser compatibility

When ready to deploy, simply push your code to your repository and connect it to Netlify. The functions will automatically be deployed and work the same way as in your local development environment.
