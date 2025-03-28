require("dotenv").config();
const AWS = require("aws-sdk");
const axios = require("axios");
const Busboy = require("busboy");
const { Readable } = require("stream");

const { authenticateRequest } = require("./authenticate");
const { uploadFiles } = require("./uploadFiles");
const { readFiles } = require("./readFiles");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

// ✅ Validate required query parameters
const validateQueryParams = (queryParams, requiredParams) => {
    const errors = [];
    for (const param of requiredParams) {
        if (!queryParams[param] || typeof queryParams[param] !== "string" || queryParams[param].trim() === "") {
            errors.push(`${param} is required and must be a non-empty string`);
        }
    }
    return errors.length > 0 ? { statusCode: 400, body: JSON.stringify({ error: "Invalid query parameters", details: errors }) } : null;
};

// ✅ Lambda Handler for File Upload with Busboy
exports.uploadFiles = async (event) => {
    console.log("📥 Received file upload request");

    // 🔹 Authentication Check
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    // 🔹 Query Parameter Validation
    const requiredParams = ["moduleName", "enterpriseId", "folderName", "subFolderName", "subFolderName1"];
    const queryParams = event.queryStringParameters || {};
    const validationError = validateQueryParams(queryParams, requiredParams);
    if (validationError) return validationError;

    // 🔹 Check Content-Type
    if (!event.headers["content-type"]) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing Content-Type header" }) };
    }

    // 🔹 Parse Form Data
    const busboy = new Busboy({ headers: event.headers });
    const uploadedFiles = [];
    const errorFiles = [];

    return new Promise((resolve) => {
        busboy.on("file", async (fieldname, file, filename, encoding, mimetype) => {
            try {
                const filePath = `${queryParams.moduleName}/${queryParams.enterpriseId}/${queryParams.folderName}/${queryParams.subFolderName}/${queryParams.subFolderName1}/${filename}`;

                const params = {
                    Bucket: BUCKET_NAME,
                    Key: filePath,
                    Body: file,
                    ContentType: mimetype,
                };

                await s3.upload(params).promise();
                uploadedFiles.push({ filePath });
            } catch (err) {
                console.error("Error uploading file:", err);
                errorFiles.push({ filename, error: err.message });
            }
        });

        busboy.on("finish", () => {
            resolve({
                statusCode: 200,
                body: JSON.stringify({
                    message: "File processing completed",
                    uploadedFiles,
                    errorFiles,
                }),
            });
        });

        busboy.end(event.body);
    });
};

// ✅ Lambda Handler for Reading Files
exports.readFilesHandler = async (event) => {
    return await readFiles(event);
};