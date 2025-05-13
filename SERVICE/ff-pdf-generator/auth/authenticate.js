const https = require('https');

/**
 * Authenticate the incoming request
 * @param {Object} event - API Gateway event
 * @returns {Object|null} - Error response or null if authenticated
 */
async function authenticateRequest(event) {
  // Skip authentication for development environment
  if (process.env.STAGE === 'dev' || process.env.STAGE === 'local') {
    console.log('Authentication skipped in development environment');
    return null;
  }
  
  try {
    // Extract authorization header
    const headers = event.headers || {};
    const authHeader = headers.Authorization || headers.authorization;
    
    if (!authHeader) {
      console.warn('Missing Authorization header');
      return {
        statusCode: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }
    
    // Send auth request to auth service
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
    
    if (!AUTH_SERVICE_URL) {
      console.error('AUTH_SERVICE_URL environment variable is not set');
      return {
        statusCode: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Authentication service not configured' })
      };
    }
    
    // Log authentication attempt
    console.log(`Authenticating request to ${AUTH_SERVICE_URL}`);
    
    // Using native https module instead of axios
    const response = await httpsRequest(AUTH_SERVICE_URL, {
      headers: {
        Authorization: authHeader
      },
      method: 'POST'
    });
    
    // Verify auth response
    if (response.statusCode !== 200) {
      console.warn('Authentication failed with status:', response.statusCode);
      return {
        statusCode: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Authentication failed' })
      };
    }
    
    // Authentication successful
    console.log('Authentication successful');
    return null;
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Return appropriate error response
    return {
      statusCode: error.statusCode || 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Authentication failed',
        message: error.message
      })
    };
  }
}

/**
 * Make an HTTPS request using the native Node.js https module
 * @param {string} url - The URL to make the request to
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response object
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Setup request options
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      port: urlObj.port || 443,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 5000
    };
    
    // Make the request
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Resolve with complete response
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(error);
    });
    
    // Handle timeout
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    // End the request
    req.end();
  });
}

module.exports = { authenticateRequest };