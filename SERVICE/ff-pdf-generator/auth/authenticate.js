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
    
    // Extract and decode JWT token if present
    let tokenInfo = null;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      tokenInfo = decodeJwtToken(token);
      
      // Log token information for debugging
      if (tokenInfo) {
        console.log('Token information:', {
          subject: tokenInfo.sub,
          issuer: tokenInfo.iss,
          expires: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : 'not set',
          // Add other relevant fields but avoid logging sensitive data
        });
      }
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
    
    // Parse response body if it's JSON
    let responseData = null;
    try {
      responseData = JSON.parse(response.body);
      console.log('Authentication response data received');
    } catch (e) {
      console.warn('Failed to parse authentication response as JSON');
    }
    
    // Store token info in the event for other handlers to use
    if (tokenInfo) {
      // Add token info to event for later use in the handler
      event.tokenInfo = tokenInfo;
      
      // Add user information if available from token
      if (tokenInfo.sub) {
        console.log(`Authenticated user: ${tokenInfo.sub} (${tokenInfo.email || 'email not in token'})`);
      }
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

/**
 * Decode a JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function decodeJwtToken(token) {
  if (!token) return null;
  
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT token format');
      return null;
    }
    
    // Decode the payload (middle part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error.message);
    return null;
  }
}

/**
 * Extract user information from event
 * @param {Object} event - API Gateway event
 * @returns {Object} - User information
 */
function getUserInfo(event) {
  // Check if token info is available from authentication
  if (event.tokenInfo) {
    return {
      userId: event?.tokenInfo?.cid || 'unknown',
      loginid: event?.tokenInfo?.loginid || 'unknown',
      email: event?.tokenInfo?.email || null,
      roles: event?.tokenInfo?.roles || [],
      name: event?.tokenInfo?.name || null,
      d_name: event?.tokenInfo?.d_name || null,
      mob: event?.tokenInfo?.mob || null,
      lid: event?.tokenInfo?.lid || null,
      subid: event?.tokenInfo?.subid || null,
      issuer: event?.tokenInfo?.iss || null,
      tenantId: event?.tokenInfo?.subid || null,
      tokenExpiry: event?.tokenInfo?.exp ? new Date(event?.tokenInfo?.exp * 1000).toISOString() : null
    };
  }
  
  // Fallback to headers/request context if no token info
  const requestContext = event.requestContext || {};
  const identity = requestContext.identity || {};
  const headers = event.headers || {};
  
  return {
    userId: 'anonymous',
    sourceIp: identity.sourceIp || headers['X-Forwarded-For'] || 'unknown',
    userAgent: headers['User-Agent'] || headers['user-agent'] || 'unknown',
    requestId: requestContext.requestId || 'unknown'
  };
}

module.exports = { 
  authenticateRequest,
  decodeJwtToken,
  getUserInfo
};