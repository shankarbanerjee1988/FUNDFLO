require("dotenv").config();
const AWS = require("aws-sdk");
const { Readable, PassThrough } = require("stream");
const Busboy = require("busboy");

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

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

// File size limit (10MB)
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE * 1024 * 1024;
const MAX_FILES = process.env.MAX_FILES || 5;
const MIN_FILES = process.env.MIN_FILES || 1;

// Convert buffer to stream
const bufferToStream = (buffer) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

exports.uploadFiles = async (event,s3BucketFolder) => {
    try {
        const contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"];

        if (!contentType || !contentType.startsWith("multipart/form-data")) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid content-type. Expected multipart/form-data" }),
            };
        }
        const busboyIns =  Busboy({ headers: { "content-type": contentType } });

        console.log("Decoding body...");
        const bodyBuffer = event.isBase64Encoded
            ? Buffer.from(event.body, "base64")
            : Buffer.from(event.body);

        const uploadedFiles = [];
        const errorFiles = [];
        const fileUploadPromises = [];
        let fileCount = 0;

        return new Promise((resolve, reject) => {

            busboyIns.on("file", (fieldname, file, filedetails, encoding, mimetypes) => {
                fileCount = fileCount + 1;

                const {filename,mimeType} = filedetails;
                const mimetype = mimeType;

                console.log(`Processing file: ${filename}, mime: ${mimeType}, top_mimetypes: ${mimetypes}`);

                if (!filename.match(ALLOWED_FILE_NAME_REGEX)) {
                    errorFiles.push({ seqNo:fileCount, fileName:filename, error: `Invalid filename. Allowed extensions: .txt, .pdf, .doc, .docx, .jpg, .jpeg, .png, .eml, .iso.` });
                    return file.resume();                    
                  }
            
                  // Check if filetype is allowed (must match the MIME types)
                  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                    errorFiles.push({ seqNo:fileCount, fileName:filename, error: `Invalid MIME type for file. Allowed types: text/plain, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png, message/rfc822, application/x-iso9660-image.` });
                    return file.resume(); 
                  }                

                let fileSize = 0;
                file.on("data", (data) => {
                    fileSize += data.length;
                    if (fileSize > MAX_FILE_SIZE) {
                        console.error(`❌ File ${filename} exceeds the maximum size limit.`);
                        errorFiles.push({ filename, error: "File size exceeds 10MB limit" });
                        file.resume(); // Stop processing this file
                    }
                });

                file.on("end", () => {
                    if (fileSize === 0) {
                        errorFiles.push({ filename, error: "Empty file uploaded" });
                        return;
                    }
                });

                // Count the number of files
                
                if (fileCount > MAX_FILES) {
                    console.error(`Too many files. Maximum allowed is ${MAX_FILES}.`);
                    errorFiles.push({ filename, error: `Maximum ${MAX_FILES} files allowed` });
                    return;
                }
                // const date = new Date();
                // const day = String(date.getDate()).padStart(2, '0');
                // const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
                // const year = date.getFullYear();

                // const formattedDate = `${day}${month}${year}`;
                s3Key = s3BucketFolder + `/${filename}`;

                const passThrough = new PassThrough();
                file.pipe(passThrough);

                const uploadPromise = s3
                    .upload({
                        Bucket: BUCKET_NAME,
                        Key: s3Key,
                        Body: passThrough,
                        ContentType: mimetype,
                    })
                    .promise()
                    .then((data) => {
                        console.log("File uploaded:", data.Location);
                        uploadedFiles.push({ seqNo:fileCount,fileName:filename, s3Path: data.Location });
                    })
                    .catch((err) => {
                        console.error(`Error uploading file (${filename}):`, err);
                        errorFiles.push({ seqNo:fileCount, fileName:filename, error: err.message });

                    });

                fileUploadPromises.push(uploadPromise);
            });

            busboyIns.on("finish", async () => {
                console.log("All files processed, waiting for S3 uploads...");

                // ✅ Validate minimum file count
                if (fileCount < MIN_FILES) {
                    return resolve({
                        statusCode: 400,
                        body: JSON.stringify({ error: `Minimum ${MIN_FILES} file required.` }),
                    });
                }

                await Promise.all(fileUploadPromises);
                resolve({
                    statusCode: 200,
                    body: JSON.stringify({
                        message: "File processing completed",
                        uploadedFiles,
                        errorFiles,
                    }),
                });
            });

            busboyIns.on("error", (error) => {
                console.error("Busboy Error:", error);
                reject({
                    statusCode: 500,
                    body: JSON.stringify({ error: "Error processing file upload" }),
                });
            });

            // Pipe the streamed buffer into Busboy
            bufferToStream(bodyBuffer).pipe(busboyIns);
        });
    } catch (error) {
        console.error("Unexpected Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};