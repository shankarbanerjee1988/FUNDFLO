require("dotenv").config();
const AWS = require("aws-sdk");

const { authenticateRequest } = require("./authenticate");
const { uploadFiles } = require("./uploadFiles");
const { readFiles } = require("./readFiles");

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
exports.uploadFilesHandler = async (event) => {
    console.log("Received file HANDLER upload request");

    // 🔹 Authentication Check
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    // 🔹 Query Parameter Validation
    const requiredParams = ["moduleName", "enterpriseId", "folderName", "subFolderName", "subFolderName1"];
    const queryParams = event.queryStringParameters || {};
    const validationError = validateQueryParams(queryParams, requiredParams);
    if (validationError) return validationError;

    return await uploadFiles(event); // 🔹 Ensure the function returns a response
};

// ✅ Lambda Handler for Reading Files
exports.readFilesHandler = async (event) => {
    console.log("Received file HANDLER read request");
    return await readFiles(event);
};