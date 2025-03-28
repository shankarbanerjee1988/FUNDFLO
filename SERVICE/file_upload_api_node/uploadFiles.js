require("dotenv").config();
const AWS = require("aws-sdk");
const Busboy = require("busboy");
const { Readable } = require("stream");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

// ✅ Convert buffer to stream
const bufferToStream = (buffer) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

exports.uploadFiles = async (event) => {
    console.log("Received file upload request");

    const contentType = event.headers?.["content-type"] || event.headers?.["Content-Type"];
    if (!contentType || !contentType.startsWith("multipart/form-data")) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid content-type. Expected multipart/form-data" }),
        };
    }

    console.log("🔹 Decoding body...");
    const bodyBuffer = Buffer.from(event.body, "base64");

    // ✅ Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const requiredParams = ["moduleName", "enterpriseId", "folderName", "subFolderName", "subFolderName1"];
    for (const param of requiredParams) {
        if (!queryParams[param]) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Missing required query parameter: ${param}` }),
            };
        }
    }

    const uploadedFiles = [];
    const errorFiles = [];

    return new Promise((resolve, reject) => {
        const busboy = new Busboy({ headers: event.headers });

        const fileUploadPromises = [];

        let fileSequence = 1;

        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            console.log(`Processing file: ${filename}`);

            const s3Key = `${queryParams.moduleName}/${queryParams.enterpriseId}/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/${queryParams.folderName}/${queryParams.subFolderName}/${queryParams.subFolderName1}/${filename}`;

            const params = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: file,
                ContentType: mimetype,
            };

            const uploadPromise = s3.upload(params).promise()
                .then((data) => {
                    console.log("File uploaded:", data.Location);
                    uploadedFiles.push({ sequence: fileSequence, filename, s3Path: data.Location });
                })
                .catch((err) => {
                    console.error(`Error uploading file (${filename}):`, err);
                    errorFiles.push({ sequence: fileSequence, filename, error: err.message });
                });

            fileUploadPromises.push(uploadPromise);
            fileSequence++;
        });

        busboy.on("finish", async () => {
            console.log("All files processed, waiting for S3 uploads...");
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

        busboy.on("error", (error) => {
            console.error("Busboy Error:", error);
            reject({
                statusCode: 500,
                body: JSON.stringify({ error: "Error processing file upload" }),
            });
        });

        // 🔹 Pass the streamed buffer into Busboy
        bufferToStream(bodyBuffer).pipe(busboy);
    });
};