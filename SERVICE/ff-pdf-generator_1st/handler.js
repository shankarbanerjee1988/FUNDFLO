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

exports.generatePdf = async (event) => {
  if (event.source === 'serverless-warmup') {
    return { statusCode: 200, body: 'Warmed up' };
  }

  // 🔹 Authentication Check
  const authInfo = await authenticateRequest(event);
  if (authInfo?.error) return authError;

  console.log('Starting PDF generation process');
  try {
    // Extract parameters from event
    const { output = 'url' } = event.queryStringParameters || {};
    
    // Handle body parsing with possible base64 encoding
    let body;
    let parsedBody;
    
    console.log('Processing event body:', typeof event.body);
    
    try {
      // Check if body is base64 encoded
      if (event.isBase64Encoded) {
        console.log('Request body is base64 encoded, decoding...');
        body = Buffer.from(event.body, 'base64').toString('utf8');
      } else {
        body = event.body || '{}';
      }
      
      // Check if body is already a parsed object (happens with certain integrations)
      if (typeof body === 'object' && body !== null) {
        parsedBody = body;
        console.log('Body is already parsed as object');
      } else {
        parsedBody = JSON.parse(body);
        console.log('Parsed JSON body successfully');
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: e.message,
          authInfo: authInfo || {} // Include authInfo or empty object
        }),
      };
    }

    // Extract required fields from parsedBody
    const { templateContent, data = {} } = parsedBody;

    // Properly handle PDF options - consolidated approach
    const pdfOptions = {};
    
    // Check if there's a dedicated pdfOptions object
    if (parsedBody.pdfOptions && typeof parsedBody.pdfOptions === 'object') {
      console.log('Using dedicated pdfOptions object from request');
      Object.assign(pdfOptions, parsedBody.pdfOptions);
    }
    
    // Add individual PDF option properties if they exist directly in the request body
    // and aren't already set in pdfOptions
    const possiblePdfOptions = [
      'format', 'landscape', 'printBackground', 'displayHeaderFooter',
      'headerTemplate', 'footerTemplate', 'margin', 'preferCSSPageSize', 'timeout'
    ];
    
    possiblePdfOptions.forEach(option => {
      if (parsedBody[option] !== undefined && pdfOptions[option] === undefined) {
        console.log(`Adding individual PDF option: ${option}`);
        pdfOptions[option] = parsedBody[option];
      }
    });
    
    console.log('Final PDF options:', JSON.stringify(pdfOptions, null, 2));
    console.log('USER INFO:', authInfo);

    if (!templateContent) {
      console.warn('Missing templateContent in request');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ 
          error: 'Missing templateContent',
          authInfo: authInfo || {} 
        }),
      };
    }

    // Pass authInfo to the data object for template rendering
    const enrichedData = {
      ...data,
      authInfo, // Include authInfo in the data for template rendering
    };

    // Add any special variables that might be referenced in templates
    if (parsedBody.title) enrichedData.title = parsedBody.title;
    if (parsedBody.copyright) enrichedData.copyright = parsedBody.copyright;
    if (parsedBody.customFooter) enrichedData.customFooter = parsedBody.customFooter;
    

    // Render HTML template with provided data
    console.log('Rendering HTML template');
    const html = renderHtml(templateContent, enrichedData);

    // Generate PDF from HTML
    console.log('Generating PDF with puppeteer');
    const pdfBuffer = await generatePdfBuffer(html, pdfOptions);
    
    // Ensure we have a valid buffer
    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      console.error('PDF generation failed: Invalid buffer returned');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({ 
          error: 'Failed to generate PDF',
          message: 'Invalid buffer returned from PDF generator',
          authInfo: authInfo || {} // Include authInfo or empty object
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
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          body: JSON.stringify({ 
            error: 'Failed to encode PDF as base64',
            authInfo: authInfo || {}
          }),
        };
      }

      const now = new Date();
      const formattedDateTime = now.toISOString().replace(/[:.]/g, '-');
      const filename = `pdf_${formattedDateTime}.pdf`;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          ...corsHeaders
        },
        isBase64Encoded: true,
        body: base64Data
        // body: JSON.stringify({
        //   message: 'PDF generated successfully',
        //   filename: filename,
        //   base64: base64Data,
        //   authInfo: authInfo || {}
        // }),
      };
    } else {
      // Upload PDF to S3 and return URL
      console.log('Uploading PDF to S3');
      const enterpriseId = authInfo?.eventEnterpriseId ? authInfo.eventEnterpriseId : 0;
      const s3Url = await uploadToS3(pdfBuffer, enterpriseId);
      console.log(`PDF uploaded to: ${s3Url}`);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        body: JSON.stringify({
          message: 'PDF generated and uploaded successfully',
          url: s3Url,
          authInfo: authInfo || {}, // Include the authInfo in the response
        }),
      };
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ 
        error: 'Failed to generate PDF',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        authInfo: authInfo || {} // Include authInfo or empty object
      }),
    };
  }
};