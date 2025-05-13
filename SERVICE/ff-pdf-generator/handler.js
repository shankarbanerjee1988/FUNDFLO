// Updated handler.js with better error handling and debugging

const renderHtml = require('./utils/renderHtml');
const generatePdfBuffer = require('./utils/generatePdfBuffer');
const uploadToS3 = require('./utils/uploadToS3');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// First try to load Logger with lowercase, then with uppercase if it fails
let Logger;
  try {
    // Try uppercase version as fallback
    Logger = require('./utils/logger-file');
    console.log('Loaded Logger.js (uppercase)');
  } catch (upperError) {
    // Create a simple inline logger if neither module exists
    console.log('Using fallback logger implementation');
    Logger = class SimpleLogger {
      constructor(context) {
        this.context = context;
      }
      debug(msg, data) { console.log(`[DEBUG] [${this.context}]`, msg, data || ''); }
      info(msg, data) { console.log(`[INFO] [${this.context}]`, msg, data || ''); }
      warn(msg, data) { console.warn(`[WARN] [${this.context}]`, msg, data || ''); }
      error(msg, data) { console.error(`[ERROR] [${this.context}]`, msg, data || ''); }
      updateMetrics() {}
      logMemoryUsage() {}
      recordPdfGeneration() {}
      logEnd() {}
    };
  }

// Initialize logger
const logger = new Logger('PDF-Handler');

// Try to load authentication module safely
let authenticateRequest = async () => null; // Default no-op authentication
let getUserInfo = (event) => ({ userId: 'anonymous' }); // Default user info

try {
  const authModule = require('./auth/authenticate');
  authenticateRequest = authModule.authenticateRequest;
  getUserInfo = authModule.getUserInfo;
  logger.info('Authentication module loaded successfully');
} catch (authError) {
  logger.warn('Authentication module not found, using no-op authentication:', authError.message);
}

/**
 * Adds CORS headers to a response object
 * @param {Object} response - Response object
 * @returns {Object} - Response with CORS headers
 */
function addCorsHeaders(response) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Access-Control-Allow-Origin'
  };
  
  return {
    ...response,
    headers: {
      ...response.headers,
      ...corsHeaders
    }
  };
}

/**
 * Creates an error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} - Formatted error response
 */
function errorResponse(statusCode, message, details = {}) {
  return addCorsHeaders({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: message,
      ...details
    })
  });
}

/**
 * Lambda function to generate PDFs from templates
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.generatePdf = async (event) => {
  // Track request start time for metrics
  const startTime = Date.now();
  
  // Warmup handling - respond quickly to keep Lambda warm
  if (event.source === 'serverless-warmup') {
    logger.info('WarmUp - Lambda is warm!');
    return addCorsHeaders({
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Warmed up' })
    });
  }
  
  // Log basic request info without dumping entire event
  logger.info(`Request received: ${event.httpMethod || 'UNKNOWN'} ${event.path || 'UNKNOWN'}`);
  logger.debug('Headers:', event.headers);
  logger.debug('Query parameters:', event.queryStringParameters);
  
  try {
    // Skip authentication for development, but enable for production
    if (process.env.STAGE !== 'dev' && process.env.STAGE !== 'local') {
      try {
        const authError = await authenticateRequest(event);
        if (authError) return addCorsHeaders(authError);
      } catch (authErr) {
        logger.error('Authentication process error:', authErr);
        return errorResponse(500, 'Internal server error during authentication', {
          message: process.env.STAGE === 'dev' ? authErr.message : 'See logs for details'
        });
      }
    } else {
      logger.info('Authentication skipped in development environment');
    }
    
    // Get user information for logging and metadata
    let userInfo = { userId: 'anonymous' };
    try {
      userInfo = getUserInfo(event);
      logger.info('User information:', userInfo);
    } catch (userInfoErr) {
      logger.warn('Error extracting user info:', userInfoErr.message);
      // Continue with default anonymous user
    }
    
    // Extract parameters from event
    const queryParams = event.queryStringParameters || {};
    const output = queryParams.output || 'url';
    const debug = queryParams.debug === 'true';
    
    logger.info('Request parameters:', { output, debug });
    
    // Parse request body
    let parsedBody;
    try {
      // Log body type for debugging
      logger.debug('Event body type:', typeof event.body);
      logger.debug('Is base64 encoded:', !!event.isBase64Encoded);
      
      // Handle different body formats
      if (!event.body) {
        logger.warn('Empty request body received');
        parsedBody = {};
      } else if (typeof event.body === 'object') {
        // Already an object (e.g., from serverless-offline)
        parsedBody = event.body;
      } else if (typeof event.body === 'string') {
        // String body needs parsing
        if (event.isBase64Encoded) {
          // Base64 encoded
          const decodedBody = Buffer.from(event.body, 'base64').toString('utf8');
          logger.debug('Decoded body (preview):', decodedBody.substring(0, 100));
          parsedBody = JSON.parse(decodedBody);
        } else {
          // Regular string JSON
          parsedBody = JSON.parse(event.body);
        }
      } else {
        throw new Error(`Unexpected body type: ${typeof event.body}`);
      }
      
    } catch (parseError) {
      logger.error('Error parsing request body:', parseError);
      return errorResponse(400, 'Invalid JSON in request body', {
        details: parseError.message,
        bodyType: typeof event.body,
        bodyPreview: typeof event.body === 'string' ? event.body.substring(0, 100) : String(event.body)
      });
    }
    
    // Extract template and options from the body
    const { 
      templateContent, 
      data = {},
      title = 'PDF Document',
      showPageNumbers = true,
      copyright = '© Powered by Fundflo Technologies',
      customFooter = '',
      ...pdfOptions 
    } = parsedBody;
    
    // Validate required fields
    if (!templateContent) {
      logger.warn('Missing templateContent in request');
      return errorResponse(400, 'Missing required field: templateContent');
    }
    
    // Log template info
    logger.info('Template info:', {
      length: templateContent.length,
      dataKeys: Object.keys(data)
    });
    
    // Add metadata for template
    const enhancedData = {
      ...data,
      _meta: {
        generatedAt: new Date().toISOString(),
        userId: userInfo.userId || 'anonymous',
        email: userInfo.email || 'Not available',
        environment: process.env.STAGE || 'unknown'
      }
    };
    
    // Set debug mode if requested
    if (debug) {
      process.env.DEBUG_MODE = 'true';
      logger.info('Debug mode enabled');
    }
    
    // Render HTML and generate PDF
    logger.info('Rendering HTML template');
    let html;
    try {
      html = renderHtml(templateContent, enhancedData);
    } catch (renderError) {
      logger.error('HTML rendering failed:', renderError);
      return errorResponse(500, 'Failed to render HTML template', {
        message: renderError.message
      });
    }
    
    logger.info('Generating PDF with puppeteer');
    let pdfBuffer;
    try {
      const enhancedOptions = {
        ...pdfOptions,
        printBackground: true,
        timeout: pdfOptions.timeout || 45000,
        title: title,
        copyright: copyright,
        customFooter: customFooter,
        displayHeaderFooter: showPageNumbers !== false
      };
      
      pdfBuffer = await generatePdfBuffer(html, enhancedOptions);
      
      if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
        throw new Error('Invalid buffer returned from PDF generator');
      }
    } catch (pdfError) {
      logger.error('PDF generation failed:', pdfError);
      return errorResponse(500, 'Failed to generate PDF', {
        message: pdfError.message
      });
    }
    
    // Handle response based on requested output format
    if (output === 'base64') {
      logger.info(`Returning PDF as base64 (size: ${pdfBuffer.length} bytes)`);
      
      const base64Data = pdfBuffer.toString('base64');
      if (!base64Data) {
        return errorResponse(500, 'Failed to encode PDF as base64');
      }
      
      return addCorsHeaders({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${title.replace(/[^\w\s.-]/g, '')}.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        },
        isBase64Encoded: true,
        body: base64Data
      });
    } else {
      // Upload to S3 and return URL
      logger.info('Uploading PDF to S3');
      try {
        // Add metadata for S3
        const metadata = {
          'generated-by': 'pdf-generator-service',
          'user-id': userInfo.userId || 'anonymous',
          'timestamp': new Date().toISOString()
        };
        
        const pdfUrl = await uploadToS3(pdfBuffer, { metadata });
        logger.info(`PDF uploaded to: ${pdfUrl}`);
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        return addCorsHeaders({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'PDF generated and uploaded successfully',
            url: pdfUrl,
            generatedBy: userInfo.userId || 'anonymous',
            timestamp: new Date().toISOString(),
            executionTime: `${executionTime}ms`,
            size: `${Math.round(pdfBuffer.length / 1024)}KB`
          })
        });
      } catch (uploadError) {
        logger.error('PDF upload failed:', uploadError);
        return errorResponse(500, 'Failed to upload PDF', {
          message: uploadError.message
        });
      }
    }
  } catch (err) {
    // Catch-all for unexpected errors
    logger.error('Unhandled error in PDF generation:', err);
    
    return errorResponse(500, 'Internal server error', 
      process.env.STAGE === 'dev' ? { 
        message: err.message,
        stack: err.stack
      } : {
        message: 'An unexpected error occurred. Please check logs for details.'
      }
    );
  }
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
exports.corsHandler = async (event) => {
  logger.info(`CORS preflight request received: ${event.httpMethod} ${event.path}`);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Access-Control-Max-Age': '3600'
    },
    body: JSON.stringify({ message: 'CORS enabled' })
  };
};