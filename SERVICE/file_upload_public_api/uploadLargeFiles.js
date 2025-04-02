const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  signatureVersion: "v4", // Ensure Signature V4 is used
  region: "ap-south-1",   // Ensure region is correct
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const PRESIGNED_VALIDITY = 60*15;
const ALLOWED_MIME_TYPES = [
  "text/plain",  // .txt
  "application/pdf",  // .pdf
  "application/msword",  // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  // .docx
  "image/jpeg",  // .jpg, .jpeg
  "image/png",  // .png
  "message/rfc822",  // .eml
  "application/x-iso9660-image"  // .iso
];

// Updated regex to match allowed file extensions
const ALLOWED_FILE_NAME_REGEX = /^[a-zA-Z0-9_-]+\.(txt|pdf|doc|docx|jpg|jpeg|png|eml|iso)$/;

exports.generatePresignedUrls = async (event,s3BucketFolder) => {
  try {
    const { files } = JSON.parse(event.body);

    if (!Array.isArray(files) || files.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No files provided." }),
      };
    }

    // Validate files
    const errorFiles = files.filter(({ filename, filetype }) => {
        if (!filename.match(ALLOWED_FILE_NAME_REGEX)) {
          return {
            filename,
            message: `Invalid filename. Allowed extensions: .txt, .pdf, .doc, .docx, .jpg, .jpeg, .png, .eml, .iso.`,
          };
        }

        if (!ALLOWED_MIME_TYPES.includes(filetype)) {
          return {
            filename,
            message: `Invalid MIME type for file. Allowed types: text/plain, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png, message/rfc822, application/x-iso9660-image.`,
          };
        }
    });

    if (errorFiles.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid file(s) detected.",
          errorFiles: errorFiles,
        }),
      };
    }

    // Generate presigned URLs for valid files
    const presignedUrls = await Promise.all(
      files.map(async ({ filename, filetype }) => {
        s3Key = s3BucketFolder + `/${filename}`;
        const params = {
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Expires: PRESIGNED_VALIDITY, // URL expiry time
          ContentType: filetype,
        };

        return {
          filename,
          s3Path:s3Key,
          presignedUrl: await s3.getSignedUrlPromise("putObject", params),
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ presignedUrls }),
    };

  } catch (error) {
    console.error("Presigned URL Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error generating presigned URLs", error }),
    };
  }
};