require("dotenv").config();
const AWS = require("aws-sdk");
const { authenticateRequest } = require("./authenticate");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;
const PRESIGNED_EXPIRY = process.env.PRESIGNED_EXPIRY;

const extractS3Key = (url) => {
    const bucketUrl = `https://${BUCKET_NAME}.s3.ap-south-1.amazonaws.com/`;
    return url.startsWith(bucketUrl) ? url.replace(bucketUrl, "") : url;
};

exports.readFiles = async (event) => {
    console.log("📥 Received file read request");

    //Authenticate Request
    const authError = await authenticateRequest(event);
    if (authError) return authError;

    //Validate query parameters
    const queryParams = event.queryStringParameters || {};
    if (!queryParams.filePaths || queryParams.filePaths.trim() === "") {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing or empty filePaths parameter" }) };
    }

    const filePaths = queryParams.filePaths.split(",").map((path) => path.trim());
    const presignedUrls = [];
    const errors = [];

    //Generate Signed URLs for each file
    await Promise.all(
        filePaths.map(async (filePath) => {
            console.log("FILE_PATH...",filePath);
            console.log("extractS3Key(filePath)...",extractS3Key(filePath));
            console.log("PRESIGNED_EXPIRY...",PRESIGNED_EXPIRY);

            try {
                const url = await s3.getSignedUrlPromise("getObject", {
                    Bucket: BUCKET_NAME,
                    Key: extractS3Key(filePath),
                    Expires: parseInt(PRESIGNED_EXPIRY) || 3600,
                });
                presignedUrls.push({ filePath, url });
            } catch (err) {
                console.error(`Failed to generate URL for ${filePath}:`, err);
                errors.push({ filePath, error: err.message });
            }
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "File read process completed",
            urls: presignedUrls,
            errors,
        }),
    };
};