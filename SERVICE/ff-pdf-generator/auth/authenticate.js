// auth/authenticate.js

/**
 * Authenticates incoming requests to the PDF generation service
 * @param {Object} event - API Gateway event
 * @returns {Object|null} - Error response object or null if authenticated
 */
exports.authenticateRequest = async function(event) {
    try {
      // Skip authentication for warmup
      if (event.source === 'serverless-warmup') {
        return null;
      }
  
      const headers = event.headers || {};
      const authHeader = headers.Authorization || headers.authorization;
      
      if (!authHeader) {
        console.warn('Authentication failed: No Authorization header');
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized', message: 'Missing Authorization header' })
        };
      }
  
      // Authorization header should be in format: "Bearer YOUR_TOKEN" or "ApiKey YOUR_KEY"
      const [authType, authValue] = authHeader.split(' ');
      
      if (!authType || !authValue) {
        console.warn('Authentication failed: Malformed Authorization header');
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid Authorization header format' })
        };
      }
  
      // Verify that the authorization type is what we expect
      if (authType !== 'Bearer' && authType !== 'ApiKey') {
        console.warn(`Authentication failed: Unsupported auth type: ${authType}`);
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized', message: 'Unsupported Authorization type' })
        };
      }
      
      // If you're using an external auth service, call it here
      if (process.env.AUTH_SERVICE_URL) {
        const axios = require('axios');
        
        try {
          const response = await axios.post(process.env.AUTH_SERVICE_URL, {}, {
            headers: {
              'Authorization': `${authType} ${authValue}`
            }
          });
          
          if (response.status !== 200) {
            console.warn('Authentication failed: External auth service rejected token');
            return {
              statusCode: 401,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid authentication token' })
            };
          }
        } catch (authError) {
          console.error('Authentication service error:', authError);
          return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Unauthorized', message: 'Authentication service error' })
          };
        }
      } else {
        // If not using external auth service, you would validate the token here
        // This is where you would check API keys, JWT tokens, etc.
        
        // Example: Simple API key check
        const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
        if (authType === 'ApiKey' && !validApiKeys.includes(authValue)) {
          console.warn('Authentication failed: Invalid API key');
          return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid API key' })
          };
        }
      }
      
      // If we get here, authentication passed
      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Authentication process failed' })
      };
    }
  };