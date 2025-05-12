const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const Logger = require('./logger');

// Initialize logger
const logger = new Logger('Queue-Processor');

/**
 * Handler for the SQS consumer Lambda
 */
exports.processPdfQueue = async (event) => {
  logger.info(`Processing ${event.Records.length} PDF generation requests`);
  
  // Process each message in the batch
  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        // Parse the SQS message
        const message = JSON.parse(record.body);
        logger.setRequestId(message.requestId);
        logger.info('Processing request:', { requestId: message.requestId });
        
        // Call PDF generator with the request
        const { generatePdf } = require('../handler');
        
        // Create a synthetic event for the generator
        const pdfEvent = {
          body: JSON.stringify(message.pdfRequest),
          queryStringParameters: message.queryParams || {},
          routedFromTier: 'queue',
          requestContext: {
            requestId: message.requestId
          }
        };
        
        // Generate PDF
        const result = await generatePdf(pdfEvent);
        
        // If successful, send notification
        if (result.statusCode === 200) {
          await sendNotification(message.callbackUrl, {
            status: 'completed',
            requestId: message.requestId,
            result: JSON.parse(result.body)
          });
          
          logger.info('PDF generation completed successfully');
        } else {
          // Handle error
          throw new Error(`PDF generation failed: ${result.body}`);
        }
        
        // Delete message from queue
        await sqs.deleteMessage({
          QueueUrl: process.env.PDF_GENERATION_QUEUE_URL,
          ReceiptHandle: record.receiptHandle
        }).promise();
        
        return { status: 'success', requestId: message.requestId };
      } catch (error) {
        logger.error('Error processing PDF request:', { error: error.message });
        
        // Forward to DLQ by not deleting from queue
        return { status: 'error', error: error.message };
      }
    })
  );
  
  // Summarize results
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;
  
  logger.info(`Processed ${succeeded} successfully, ${failed} failed`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      processed: succeeded,
      failed: failed
    })
  };
};

/**
 * Send notification to callback URL
 */
async function sendNotification(callbackUrl, data) {
  if (!callbackUrl) return;
  
  try {
    const axios = require('axios');
    await axios.post(callbackUrl, data);
    logger.info('Notification sent successfully', { callbackUrl });
  } catch (error) {
    logger.error('Failed to send notification:', { 
      error: error.message, 
      callbackUrl 
    });
  }
}

/**
 * API endpoint for queued PDF generation
 */
exports.queuePdfGeneration = async (event) => {
  // Initialize logger with new request ID
  const requestId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  logger.setRequestId(requestId);
  
  try {
    // Parse request body
    let body;
    if (event.isBase64Encoded) {
      body = Buffer.from(event.body, 'base64').toString('utf8');
    } else {
      body = event.body || '{}';
    }
    const parsedBody = JSON.parse(body);
    
    // Extract callback URL if provided
    const { callbackUrl, ...pdfRequest } = parsedBody;
    
    // Create message for queue
    const message = {
      requestId,
      timestamp: new Date().toISOString(),
      pdfRequest,
      callbackUrl,
      queryParams: event.queryStringParameters || {}
    };
    
    // Send to SQS queue
    await sqs.sendMessage({
      QueueUrl: process.env.PDF_GENERATION_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageDeduplicationId: requestId, // For FIFO queues
      MessageGroupId: 'pdf-generation' // For FIFO queues
    }).promise();
    
    logger.info('PDF generation request queued successfully');
    
    // Return success response with request ID
    return {
      statusCode: 202, // Accepted
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'PDF generation request queued successfully',
        requestId,
        status: 'queued'
      })
    };
  } catch (error) {
    logger.error('Error queueing PDF request:', { error: error.message });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to queue PDF generation request',
        message: error.message
      })
    };
  }
};