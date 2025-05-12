const renderHtml = require('./utils/renderHtml');
const generatePdfBuffer = require('./utils/generatePdfBuffer');
const uploadToS3 = require('./utils/uploadToS3');
const Logger = require('./utils/logger');

/**
 * Analyzes request complexity to determine appropriate resource allocation
 * @param {Object} parsedBody - Request body
 * @returns {Object} - Complexity metrics
 */
function analyzePdfComplexity(parsedBody) {
  const { templateContent, data } = parsedBody;
  
  // Base complexity metrics
  const metrics = {
    templateSize: templateContent ? templateContent.length : 0,
    dataSize: data ? JSON.stringify(data).length : 0,
    imageCount: 0,
    tableCount: 0,
    estimatedComplexity: 'standard' // standard, complex, or large
  };
  
  // Count images in template
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = imgRegex.exec(templateContent)) !== null) {
    metrics.imageCount++;
  }
  
  // Count tables in template
  const tableRegex = /<table/g;
  metrics.tableCount = (templateContent.match(tableRegex) || []).length;
  
  // Determine complexity based on metrics
  if (metrics.templateSize > 300000 || metrics.dataSize > 1000000 || metrics.imageCount > 50) {
    metrics.estimatedComplexity = 'large';
  } else if (metrics.templateSize > 100000 || metrics.dataSize > 500000 || metrics.imageCount > 20) {
    metrics.estimatedComplexity = 'complex';
  }
  
  return metrics;
}

/**
 * Enhanced Lambda function to generate PDFs from templates
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.generatePdf = async (event) => {
  // Initialize logger
  const logger = new Logger('PDF-Generator');
  const requestId = event.requestContext?.requestId || `req-${Date.now()}`;
  logger.setRequestId(requestId);
  
  if (event.source === 'serverless-warmup') {
    logger.info('WarmUp - Lambda is warm!');
    return { statusCode: 200, body: 'Warmed up' };
  }
  
  logger.info('Starting PDF generation process');
  
  // Start performance monitoring
  const startTime = Date.now();
  let performanceMetrics = {
    parseTime: 0,
    renderTime: 0,
    pdfGenerationTime: 0,
    uploadTime: 0,
    totalTime: 0,
    complexity: 'standard'
  };
  
  try {
    // Extract parameters from event
    const { output = 'url', debug = false } = event.queryStringParameters || {};    
    let body;
    let parsedBody;
    
    // Parse request body
    const parseStart = Date.now();
    try {
      if (event.isBase64Encoded) {
        logger.debug('Request body is base64 encoded, decoding...');
        body = Buffer.from(event.body, 'base64').toString('utf8');
      } else {
        body = event.body || '{}';
      }
      parsedBody = JSON.parse(body);
      performanceMetrics.parseTime = Date.now() - parseStart;
      logger.debug('Parsed body successfully');
    } catch (e) {
      logger.error('Error parsing request body:', { error: e.message });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }
    
    // Extract template and data
    const { 
      templateContent, 
      data = {},
      title = 'PDF',
      showPageNumbers = true,
      copyright = '© Powered by Fundflo Technologies',
      customFooter = '',
      ...pdfOptions 
    } = parsedBody;
  
    // Validate required parameters
    if (!templateContent) {
      logger.warn('Missing templateContent in request');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing templateContent' }),
      };
    }
    
    // Analyze PDF complexity
    const complexityMetrics = analyzePdfComplexity(parsedBody);
    performanceMetrics.complexity = complexityMetrics.estimatedComplexity;
    logger.info('PDF complexity analysis:', complexityMetrics);
    
    // Check if request should be routed to a different tier
    if (complexityMetrics.estimatedComplexity !== 'standard' && !event.routedFromTier) {
      // Redirect to appropriate function if not already routed
      const targetPath = complexityMetrics.estimatedComplexity === 'large' 
        ? 'generate-pdf-large' 
        : 'generate-pdf-complex';
      
      logger.info(`Routing request to ${targetPath} based on complexity analysis`);
      
      // Get the base URL from the event
      const baseUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
      
      // Route request to appropriate function
      const axios = require('axios');
      try {
        const response = await axios.post(`${baseUrl}/${targetPath}`, body, {
          headers: { 
            'Content-Type': 'application/json',
            'X-Routed-From-Tier': 'standard'
          }
        });
        
        // Return response from routed function
        return {
          statusCode: response.status,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response.data)
        };
      } catch (routingError) {
        logger.error('Error routing request:', { error: routingError.message });
        // Continue with generation in current function as fallback
        logger.info('Continuing with generation in current function as fallback');
      }
    }
    
    // Log image count if debug is enabled
    if (debug) {
      const { logTemplateImageUrls } = require('./utils/imageDebugger');
      const imgCount = logTemplateImageUrls(templateContent);
      logger.debug(`Found ${imgCount} images in template`);
    }
  
    // Render HTML template with provided data
    logger.info('Rendering HTML template');
    const renderStart = Date.now();
    const html = renderHtml(templateContent, data);
    performanceMetrics.renderTime = Date.now() - renderStart;
    
    // Enable debug mode if requested
    if (debug) {
      process.env.DEBUG_MODE = 'true';
      logger.debug('Debug mode enabled');
    }
    
    // Configure PDF generation options
    const enhancedOptions = {
      ...pdfOptions,
      printBackground: true,
      timeout: calculateTimeout(performanceMetrics.complexity, pdfOptions.timeout),
      title: title,
      copyright: copyright,
      customFooter: customFooter
    };
    
    if (!showPageNumbers) {
      enhancedOptions.displayHeaderFooter = false;
    }
    
    // Generate PDF with adaptive timeout
    logger.info('Generating PDF with puppeteer');
    const pdfStart = Date.now();
    const pdfBuffer = await generatePdfBuffer(html, enhancedOptions);
    performanceMetrics.pdfGenerationTime = Date.now() - pdfStart;

    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      logger.error('PDF generation failed: Invalid buffer returned');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Failed to generate PDF',
          message: 'Invalid buffer returned from PDF generator'
        }),
      };
    }

    // Process based on requested output format
    if (output === 'base64') {
      logger.info(`Returning PDF as base64 (buffer size: ${pdfBuffer.length} bytes)`);
      const base64Data = pdfBuffer.toString('base64');
      
      if (!base64Data) {
        logger.error('Failed to encode PDF as base64');
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Failed to encode PDF as base64',
          }),
        };
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="output.pdf"',
          'Content-Length': pdfBuffer.length.toString(),
        },
        isBase64Encoded: true,
        body: base64Data,
      };
    } else {
      // Upload PDF to S3
      logger.info('Uploading PDF to S3');
      const uploadStart = Date.now();
      
      // Use metadata from complexity analysis
      const metadata = {
        complexity: performanceMetrics.complexity,
        imageCount: String(complexityMetrics.imageCount),
        renderTime: String(performanceMetrics.renderTime),
        generationTime: String(performanceMetrics.pdfGenerationTime)
      };
      
      const s3Url = await uploadToS3(pdfBuffer, { metadata });
      performanceMetrics.uploadTime = Date.now() - uploadStart;
      logger.info(`PDF uploaded to: ${s3Url}`);
      
      // Calculate total processing time
      performanceMetrics.totalTime = Date.now() - startTime;
      logger.info('PDF generation complete. Performance metrics:', performanceMetrics);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'PDF generated and uploaded successfully',
          url: s3Url,
          performance: performanceMetrics
        }),
      };
    }
  } catch (err) {
    logger.error('PDF generation failed:', { error: err.message, stack: err.stack });
    
    // Calculate total time even on failure
    performanceMetrics.totalTime = Date.now() - startTime;
    logger.info('Failed PDF generation metrics:', performanceMetrics);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        message: err.message,
        performance: performanceMetrics
      }),
    };
  }
};

/**
 * Calculate appropriate timeout based on estimated complexity
 */
function calculateTimeout(complexity, userTimeout) {
  if (userTimeout) {
    return parseInt(userTimeout);
  }
  
  switch (complexity) {
    case 'large':
      return 240000; // 4 minutes
    case 'complex':
      return 90000;  // 1.5 minutes
    default:
      return 45000;  // 45 seconds
  }
}