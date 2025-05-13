const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

/**
 * Uploads PDF buffer to S3 and returns a pre-signed URL
 * @param {Buffer} buffer - PDF content
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Pre-signed S3 URL
 */
module.exports = async function uploadToS3(buffer, options = {}) {
  // Generate a unique file name with path
  const fileName = options.fileName || 
    `pdfs/${new Date().toISOString().split('T')[0]}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.pdf`;

  // Set content type and other metadata
  const contentType = options.contentType || 'application/pdf';
  const metadata = options.metadata || {};
  
  // Upload parameters
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      'generated-by': 'pdf-generator-service',
      'timestamp': new Date().toISOString(),
      ...metadata
    },
    // Enable server-side encryption
    ServerSideEncryption: 'AES256'
  };

  try {
    // Upload to S3
    await s3.putObject(params).promise();
    
    // Generate a pre-signed URL that expires after 24 hours (86400 seconds)
    const signedUrlExpireSeconds = options.urlExpiry || 86400;
    
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Expires: signedUrlExpireSeconds
    });
    
    return url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload PDF to S3: ${error.message}`);
  }
};