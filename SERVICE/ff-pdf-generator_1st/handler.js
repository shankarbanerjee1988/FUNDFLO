const renderHtml = require('./utils/renderHtml');
const generatePdfBuffer = require('./utils/generatePdfBuffer');
const uploadToS3 = require('./utils/uploadToS3');

/**
 * Lambda function to generate PDFs from templates
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.generatePdf = async (event) => {
  // Check if this is a warmup invocation
  if (event.source === 'serverless-warmup') {
    console.log('WarmUp - Lambda is warm!');
    return { statusCode: 200, body: 'Warmed up' };
  }

  console.log('Starting PDF generation process');
  try {
    // Extract parameters from event
    const { output = 'url' } = event.queryStringParameters || {};
    
    // Handle body parsing with possible base64 encoding
    let body;
    let parsedBody;
    
    console.log('....EVENT BODY.......', event.body);
    
    try {
      // Check if body is base64 encoded
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

    // Try to load authentication module safely
let authenticateRequest = async () => null; // Default no-op authentication
let getUserInfo = (event) => ({ userId: 'anonymous' }); // Default user info

try {
  const authModule = require('./auth/authenticate');
  authenticateRequest = authModule.authenticateRequest;
  getUserInfo = authModule.getUserInfo;
  console.log('Authentication module loaded successfully');
} catch (authError) {
  console.warn('Authentication module not found, using no-op authentication:', authError.message);
}
    
    
    const { 
      templateContent, 
      data = {},
      // Pass remaining options as PDF options
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

    // Render HTML template with provided data
    console.log('Rendering HTML template');
    const html = renderHtml(templateContent, data);
    
    // Generate PDF from HTML
    console.log('Generating PDF with puppeteer');
    const pdfBuffer = await generatePdfBuffer(html, pdfOptions);
    
    // Ensure we have a valid buffer
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