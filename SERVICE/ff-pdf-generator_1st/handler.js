const renderHtml = require('./utils/renderHtml');
const generatePdfBuffer = require('./utils/generatePdfBuffer');
const uploadToS3 = require('./utils/uploadToS3');
const { authenticateRequest } = require("./auth/authenticate");
require("dotenv").config();
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'
};
/**
 * Lambda function to generate PDFs from templates
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.generatePdf = async (event) => {
  // Check if this is a warmup invocation
  if (event.source === 'serverless-warmup') {
    // console.log('WarmUp - Lambda is warm!');
    return { statusCode: 200, body: 'Warmed up' };
  }

      // 🔹 Authentication Check
      const authError = await authenticateRequest(event);
      if (authError) return authError;

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
        userInfo:event?.userInfo,
        statusCode: 400,
        headers: { 'Content-Type': 'application/json',...corsHeaders },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
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
        userInfo:event?.userInfo,
        statusCode: 400,
        headers: { 'Content-Type': 'application/json',...corsHeaders },
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
        userInfo:event?.userInfo,
        statusCode: 500,
        headers: { 'Content-Type': 'application/json',...corsHeaders },
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
          userInfo:event?.userInfo,
          statusCode: 500,
          headers: { 'Content-Type': 'application/json',...corsHeaders },
          body: JSON.stringify({ 
            error: 'Failed to encode PDF as base64',
          }),
        };
      }
      const now = new Date();
      const formattedDateTime = now.toISOString().replace(/[:.]/g, '-');
      const filename = `pdf_${formattedDateTime}.pdf`;
      return {
        userInfo:event?.userInfo,
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          ...corsHeaders
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
        userInfo:event?.userInfo,
        headers: { 'Content-Type': 'application/json',...corsHeaders },
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
      userInfo:event?.userInfo,
      headers: { 'Content-Type': 'application/json',...corsHeaders },
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        message: err.message
      }),
    };
  }
};