require("dotenv").config();
const AWS = require("aws-sdk");
const axios = require("axios");

const { authenticateRequest } = require("./authenticate");
const { uploadFiles } = require("./uploadFiles");
const { generatePresignedUrls } = require("./uploadLargeFiles");

const { readFiles } = require("./readFiles");
const { processCallback } = require("./callback");
const { sourceSystemInfo } = require("./geolocation");

const requiredParams = ["moduleName", "folderName"];

// ✅ Validate required query parameters
const validateQueryParams = (queryParams) => {
    const errors = [];
    for (const param of requiredParams) {
        if (!queryParams[param] || typeof queryParams[param] !== "string" || queryParams[param].trim() === "") {
            errors.push(`${param} is required and must be a non-empty string`);
        }
    }
    return errors.length > 0 
        ? { statusCode: 400, body: JSON.stringify({ error: "Invalid query parameters", details: errors }) } 
        : null;
};

// ✅ Lambda Handler for File Upload with Busboy
exports.uploadFilesHandler = async (event) => {
    console.log("Received file HANDLER upload request");

    // 🔹 Authentication Check
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    let sourceSystemDetails = {};
    try {
        sourceSystemDetails = await sourceSystemInfo(event);
    } catch (error) {
        console.error("Failed to fetch sourceSystemDetails:", error.message);
    }

    console.log("EnterpriseId....", event.eventEnterpriseId);

    // 🔹 Query Parameter Validation
    const queryParams = event.queryStringParameters || {};
    const validationError = validateQueryParams(queryParams);
    if (validationError) return validationError;

    const date = new Date();
    const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    let s3BucketFolder = `${queryParams.moduleName}/${event.eventEnterpriseId}/${formattedDate}/${queryParams.folderName}`;
    if (queryParams.subFolderName) s3BucketFolder += `/${queryParams.subFolderName}`;
    if (queryParams.subFolderName1) s3BucketFolder += `/${queryParams.subFolderName1}`;

    const callURL = queryParams.callURL ? queryParams.callURL : null;

    console.log("s3BucketFolder....", s3BucketFolder);

    // 🔹 Upload Files to S3
    const uploadInfo = await uploadFiles(event, s3BucketFolder);
    console.log("UPLOADED DATA....", uploadInfo);

    let callBackData = {
        statusCode: uploadInfo?.statusCode,
        body: {
            uploadedBody: (uploadInfo && uploadInfo.body ? JSON.parse(uploadInfo?.body) : {}),
            userInfo: event.userInfo,
            sourceSystemDetails: sourceSystemDetails,
            queryParams: queryParams,
            callURL:callURL
        },
    };

    if (callURL) {
        console.log("Triggering callback URL...");
        const callbackResponse = await processCallback(event, callBackData, callURL);
        callBackData.body.callBackResp = callbackResponse;
    }

    return {
        statusCode: callBackData.statusCode || 200,
        body: JSON.stringify(callBackData.body),
        headers: { "Content-Type": "application/json" },
    };
};

exports.uploadLargeFilesHandler = async (event) => {
    console.log("Received file HANDLER upload request");

    // 🔹 Authentication Check
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    let sourceSystemDetails = {};
    try {
        sourceSystemDetails = await sourceSystemInfo(event);
    } catch (error) {
        console.error("Failed to fetch sourceSystemDetails:", error.message);
    }

    console.log("EnterpriseId....", event.eventEnterpriseId);

    // 🔹 Query Parameter Validation
    const queryParams = event.queryStringParameters || {};
    const validationError = validateQueryParams(queryParams);
    if (validationError) return validationError;

    const date = new Date();
    const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    let s3BucketFolder = `${queryParams.moduleName}/${event.eventEnterpriseId}/${formattedDate}/${queryParams.folderName}`;
    if (queryParams.subFolderName) s3BucketFolder += `/${queryParams.subFolderName}`;
    if (queryParams.subFolderName1) s3BucketFolder += `/${queryParams.subFolderName1}`;

    const callURL = queryParams.callURL ? queryParams.callURL : null;

    console.log("s3BucketFolder....", s3BucketFolder);

    // 🔹 Upload Files to S3
    const uploadInfo = await generatePresignedUrls(event, s3BucketFolder);
    console.log("UPLOADED DATA....", uploadInfo);

    let callBackData = {
        statusCode: uploadInfo?.statusCode,
        body: {
            uploadedBody: (uploadInfo && uploadInfo.body ? JSON.parse(uploadInfo?.body) : {}),
            userInfo: event.userInfo,
            sourceSystemDetails: sourceSystemDetails,
            queryParams: queryParams,
            callURL:callURL
        },
    };

    if (callURL) {
        console.log("Triggering callback URL...");
        const callbackResponse = await processCallback(event, callBackData, callURL);
        callBackData.body.callBackResp = callbackResponse;
    }

    return {
        statusCode: callBackData.statusCode || 200,
        body: JSON.stringify(callBackData.body),
        headers: { "Content-Type": "application/json" },
    };
};

// ✅ Lambda Handler for Reading Files
exports.readFilesHandler = async (event) => {
    console.log("Received file HANDLER read request");
    return await readFiles(event);
};