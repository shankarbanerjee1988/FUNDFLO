const AWS = require('aws-sdk');
const { PassThrough } = require('stream');
const Logger = require('./logger');

// Initialize logger
const logger = new Logger('S3-Uploader');

/**
 * Uploads PDF buffer to S3 and returns a pre-signed URL
 * @param {Buffer|Stream} input - PDF content as buffer or stream
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Pre-signed S3 URL
 */
module.exports = async function uploadToS3(input, options = {}) {
  const s3 = new AWS.S3();
  const BUCKET_NAME = process.env.BUCKET_NAME;
  
  // Generate a unique file name with path
  const fileName = options.fileName || 
    `pdfs/${new Date().toISOString().split('T')[0]}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.pdf`;

  // Set content type and other metadata
  const contentType = options.contentType || 'application/pdf';
  const metadata = options.metadata || {};
  
  // Track if we're using streaming or buffer upload
  const isStream = input && typeof input.pipe === 'function';
  logger.info(`Uploading to S3 using ${isStream ? 'streaming' : 'buffer'} method`);
  
  try {
    let uploadParams;
    let uploadPromise;
    
    if (isStream) {
      // Streaming upload
      const passthrough = new PassThrough();
      input.pipe(passthrough);
      
      uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: passthrough,
        ContentType: contentType,
        Metadata: {
          'generated-by': 'pdf-generator-service',
          'timestamp': new Date().toISOString(),
          ...metadata
        },
        ServerSideEncryption: 'AES256'
      };
      
      // Use managed upload for better performance with streams
      uploadPromise = new AWS.S3.ManagedUpload({
        params: uploadParams
      }).promise();
    } else {
      // Buffer upload
      uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: input,
        ContentType: contentType,
        Metadata: {
          'generated-by': 'pdf-generator-service',
          'timestamp': new Date().toISOString(),
          ...metadata
        },
        ServerSideEncryption: 'AES256'
      };
      
      uploadPromise = s3.putObject(uploadParams).promise();
    }
    
    // Wait for upload to complete
    await uploadPromise;
    logger.info(`Upload completed: ${fileName}`);
    
    // Generate a pre-signed URL that expires after 24 hours (86400 seconds)
    const signedUrlExpireSeconds = options.urlExpiry || 86400;
    
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Expires: signedUrlExpireSeconds
    });
    
    return url;
  } catch (error) {
    logger.error('Error uploading to S3:', { error: error.message });
    throw new Error(`Failed to upload PDF to S3: ${error.message}`);
  }
};

/**
 * Stream-based version of uploadToS3 that doesn't keep the entire PDF in memory
 * @param {Stream} pdfStream - Stream of PDF content
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Pre-signed S3 URL
 */
module.exports.stream = async function uploadToS3Stream(pdfStream, options = {}) {
  return module.exports(pdfStream, options);
};