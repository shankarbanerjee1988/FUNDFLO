const renderHtml = require('./utils/renderHtml');
const generatePdfBuffer = require('./utils/generatePdfBuffer');
const uploadToS3 = require('./utils/uploadToS3');
const { authenticateRequest } = require("./auth/authenticate");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();


/**
 * Lambda function to generate PDFs from templates
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.generatePdf = async (event) => {
  if (event.source === 'serverless-warmup') {
    // console.log('WarmUp - Lambda is warm!');
    return { statusCode: 200, body: 'Warmed up' };
  }
  const authError = await authenticateRequest(event);
  if (authError) return authError;
  console.log('Starting PDF generation process');
  try {
    // Extract parameters from event
    const { output = 'url', debug = false } = event.queryStringParameters || {};    
    let body;
    let parsedBody;
    console.log('....EVENT BODY.......', event.body);
    try {
      if (event.isBase64Encoded) {
        console.log('Request body is base64 encoded, decoding...');
        body = Buffer.from(event.body, 'base64').toString('utf8');
      } else {
        body = event.body || '{}';
      }
      parsedBody = JSON.parse(body);
      console.log('Parsed body successfully');
    } catch (e) {
      console.error('Error parsing request body:', e);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }
    
    // const { 
    //   templateContent, 
    //   data = {},
    //   ...pdfOptions 
    // } = parsedBody;

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
      console.warn('Missing templateContent in request');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing templateContent' }),
      };
    }
    
    
    // Debug: Check for images in the template
    const { logTemplateImageUrls } = require('./utils/imageDebugger');
    const imgCount = logTemplateImageUrls(templateContent);
    console.log(`Found ${imgCount} images in template`);
  
    // Render HTML template with provided data
    console.log('Rendering HTML template');
    const html = renderHtml(templateContent, data);
    
    // Enable debug mode if requested
    if (debug) {
      process.env.DEBUG_MODE = 'true';
      console.log('Debug mode enabled');
    }
    
    // Generate PDF from HTML with custom options for better image handling
    console.log('Generating PDF with puppeteer');
    // const enhancedOptions = {
    //   ...pdfOptions,
    //   printBackground: true,
    //   timeout: pdfOptions.timeout || 45000,
    // };

    const enhancedOptions = {
      ...pdfOptions,
      printBackground: true,
      timeout: pdfOptions.timeout || 45000,
      title: title,
      copyright: copyright,
      customFooter: customFooter
    };
    if (!showPageNumbers) {
      enhancedOptions.displayHeaderFooter = false;
    }
    
    const pdfBuffer = await generatePdfBuffer(html, enhancedOptions);

    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      console.error('PDF generation failed: Invalid buffer returned');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Failed to generate PDF',
          message: 'Invalid buffer returned from PDF generator'
        }),
      };
    }

    // Return response based on requested output format
    if (output === 'base64') {
      console.log(`Returning PDF as base64 (buffer size: ${pdfBuffer.length} bytes)`);
      
      // Ensure proper base64 encoding
      const base64Data = pdfBuffer.toString('base64');
      
      if (!base64Data) {
        console.error('Failed to encode PDF as base64');
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
      // Upload PDF to S3 and return URL
      console.log('Uploading PDF to S3');
      const s3Url = await uploadToS3(pdfBuffer);
      console.log(`PDF uploaded to: ${s3Url}`);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'PDF generated and uploaded successfully',
          url: s3Url,
        }),
      };
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        message: err.message
      }),
    };
  }
};

exports.corsHandler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Restrict this in production
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
      'Access-Control-Allow-Credentials': false
    },
    body: JSON.stringify({ message: 'CORS enabled' })
  };
};