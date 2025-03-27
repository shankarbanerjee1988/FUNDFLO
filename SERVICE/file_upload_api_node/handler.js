require("dotenv").config();
const AWS = require("aws-sdk");
const axios = require("axios");
const multer = require("multer");
const multerS3 = require("multer-s3");
const express = require("express");
const serverless = require("serverless-http");
const multipart = require("aws-lambda-multipart-parser");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) * 1024 * 1024 : 5 * 1024 * 1024; // Default 5MB
const MAX_FILES = parseInt(process.env.MAX_FILES) || 5; // Default 5 files

const app = express();
app.use(express.json());

// ✅ Authenticate request
const authenticateRequest = async (event) => {
    const rawAuthToken = event.headers?.Authorization?.trim();
    if (!rawAuthToken) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const authToken = rawAuthToken.startsWith("Bearer ") ? rawAuthToken : `Bearer ${rawAuthToken}`;

    try {
        await axios.get(AUTH_SERVICE_URL, { headers: { Authorization: authToken } });
        return null;
    } catch (error) {
        return { statusCode: 403, body: JSON.stringify({ error: "Invalid token" }) };
    }
};

// ✅ Validate query parameters
const validateQueryParams = (queryParams, requiredParams) => {
    const errors = [];
    for (const param of requiredParams) {
        if (!queryParams[param] || typeof queryParams[param] !== "string" || queryParams[param].trim() === "") {
            errors.push(`${param} is required and must be a non-empty string`);
        }
    }
    return errors.length > 0 ? { statusCode: 400, body: JSON.stringify({ error: "Invalid query parameters", details: errors }) } : null;
};

// ✅ Upload Files to S3 (AWS Lambda)
exports.uploadFiles = async (event) => {
    console.log("📥 Received file upload request");
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    const requiredParams = ["moduleName", "enterpriseId", "folderName", "subFolderName", "subFolderName1"];
    const queryParams = event.queryStringParameters || {};
    const validationError = validateQueryParams(queryParams, requiredParams);
    if (validationError) return validationError;

    console.log("EVENT BODY:", event.body);

    const decodedBody = Buffer.from(event.body, 'base64').toString('binary');

    // Parse the decoded body
    const parsedBody = multipart.parse({ body: decodedBody, headers: event.headers });
    console.log("Parsed Body:", parsedBody);

    // ✅ Validate file quantity and size
    if (!parsedBody.files || parsedBody.files.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "At least one file is required" }),
        };
    }

    if (parsedBody.files.length > MAX_FILES) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Exceeds maximum file limit of ${MAX_FILES}` }),
        };
    }

    const uploadedFiles = [];
    const errorFiles = [];

    // Iterate over the uploaded files and upload to S3
    for (let i = 0; i < parsedBody.files.length; i++) {
        const file = parsedBody.files[i];

        // ✅ Validate file size
        if (file.content.length > MAX_FILE_SIZE) {
            errorFiles.push({
                sequence: i + 1,
                error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
            });
            continue;
        }

        // ✅ File type validation
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'application/pdf']; // Add your allowed types here
        if (!allowedMimeTypes.includes(file.contentType)) {
            errorFiles.push({
                sequence: i + 1,
                error: `Invalid file type. Allowed types are: ${allowedMimeTypes.join(', ')}`,
            });
            continue;
        }

        const s3Key = `${queryParams.moduleName}/${queryParams.enterpriseId}/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/${queryParams.folderName}/${queryParams.subFolderName}/${queryParams.subFolderName1}/${file.filename}`;
        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: Buffer.from(file.content, "base64"),
            ContentType: file.contentType,
        };

        try {
            await s3.putObject(params).promise();
            uploadedFiles.push({
                sequence: i + 1,
                filePath: s3Key,
            });
        } catch (err) {
            console.error("Error uploading file to S3:", err);
            errorFiles.push({
                sequence: i + 1,
                error: err.message,
            });
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "File processing completed",
            uploadedFiles,
            errorFiles,
        }),
    };
};

// ✅ Read Files from S3 (AWS Lambda)
exports.readFiles = async (event) => {
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    const queryParams = event.queryStringParameters;
    if (!queryParams?.filePaths) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing file paths" }) };
    }

    const filePaths = queryParams.filePaths.split(",");
    const presignedUrls = [];
    const errorMessages = [];

    for (const filePath of filePaths) {
        try {
            const url = await s3.getSignedUrlPromise("getObject", {
                Bucket: BUCKET_NAME,
                Key: filePath.trim(),
                Expires: 3600,
            });
            presignedUrls.push({ filePath, url });
        } catch (err) {
            console.error(`❌ Failed to generate URL for ${filePath}:`, err);
            errorMessages.push({
                filePath,
                error: err.message,
            });
        }
    }

    if (errorMessages.length > 0) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to generate signed URLs for some files.",
                errors: errorMessages,
            }),
        };
    }

    return { statusCode: 200, body: JSON.stringify({ urls: presignedUrls }) };
};

// Export the app for Serverless deployment
module.exports.handler = serverless(app);