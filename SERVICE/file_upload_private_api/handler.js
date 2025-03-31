require("dotenv").config();
const AWS = require("aws-sdk");

const { authenticateRequest } = require("./authenticate");
const { uploadFiles } = require("./uploadFiles");
const { readFiles } = require("./readFiles");
const { processCallback } = require("./callback");
const requiredParams = ["moduleName",  "folderName"];

// ✅ Validate required query parameters
const validateQueryParams = (queryParams) => {
    const errors = [];
    for (const param of requiredParams) {
        if (!queryParams[param] || typeof queryParams[param] !== "string" || queryParams[param].trim() === "") {
            errors.push(`${param} is required and must be a non-empty string`);
        }
    }
    return errors.length > 0 ? { statusCode: 400, body: JSON.stringify({ error: "Invalid query parameters", details: errors }) } : null;
};

// ✅ Lambda Handler for File Upload with Busboy
exports.uploadFilesHandler = async (event) => {
    console.log("Received file HANDLER upload request");

    // 🔹 Authentication Check
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    console.log("EnterpriseId....",event.eventEnterpriseId);

    // 🔹 Query Parameter Validation
    const queryParams = event.queryStringParameters || {};
    const validationError = validateQueryParams(queryParams);
    if (validationError) return validationError;

    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    const formattedDate = `${day}${month}${year}`;

    let s3BucketFolder = `${queryParams.moduleName}/${event.eventEnterpriseId}/${formattedDate}/${queryParams.folderName}`;
    s3BucketFolder = s3BucketFolder + (queryParams.subFolderName ? `/${queryParams.subFolderName}` : ``);  
    s3BucketFolder = s3BucketFolder + (queryParams.subFolderName1 ? `/${queryParams.subFolderName1}` : ``);  
    const callURL = (queryParams.callURL ? `/${queryParams.callURL}` : ``);  

    console.log("s3BucketFolder....",s3BucketFolder);
    const callBackData = await uploadFiles(event,s3BucketFolder);
    console.log("UPLOADED DATA....",callBackData);

    return processCallback(event,callBackData,callURL); // 🔹 Ensure the function returns a response
};

// ✅ Lambda Handler for Reading Files
exports.readFilesHandler = async (event) => {
    console.log("Received file HANDLER read request");
    return await readFiles(event);
};