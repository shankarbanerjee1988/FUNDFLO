const AWS = require("aws-sdk");
const axios = require("axios");
const { Parser } = require("json2csv");
const nodemailer = require("nodemailer");
require("dotenv").config();

const s3 = new AWS.S3();
const sns = new AWS.SNS();

async function storeErrorFile(fileKey, errorMessage) {
    const errorKey = `errors/${fileKey.replace(/^transformed\//, '')}-error.log`;
    
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: errorKey,
        Body: `Error occurred during transformation:\n${errorMessage}`,
        ContentType: "text/plain",
    };

    await s3.putObject(params).promise();
    console.log(`Error log stored in S3: ${errorKey}`);
}


exports.transformFile = async (event) => {
    try {
        const { fileUrl, transformations, authToken } = JSON.parse(event.body);

        if (!fileUrl || !transformations || !authToken) {
            throw new Error("Missing required fields: fileUrl, transformations, authToken");
        }

        // Authenticate with External API
        const authResponse = await axios.post(process.env.AUTH_API_URL, { token: authToken });
        if (!authResponse.data.valid) {
            throw new Error("Unauthorized access");
        }

        // Download file from S3
        const bucketName = process.env.BUCKET_NAME;
        const fileKey = decodeURIComponent(fileUrl.split("/").pop());

        const fileData = await s3.getObject({ Bucket: bucketName, Key: fileKey }).promise();
        let records = fileData.Body.toString().split("\n").map(line => line.split(","));

        // Apply Transformations
        let transformedData = applyTransformations(records, transformations);

        // Convert to CSV
        const json2csvParser = new Parser();
        const csvOutput = json2csvParser.parse(transformedData);

        // Upload Transformed File to S3
        const transformedKey = `transformed/${fileKey}`;
        await s3.putObject({
            Bucket: bucketName,
            Key: transformedKey,
            Body: csvOutput,
            ContentType: "text/csv"
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Transformation successful",
                transformedFileUrl: `https://${bucketName}.s3.amazonaws.com/${transformedKey}`
            }),
        };
    } catch (error) {
        console.error("Error:", error);
    
        // Save error details to S3
        await storeErrorFile(fileKey, error.message);
    
        // Send notifications
        await sendFailureNotification(error.message);
    
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

// Function to Apply Transformations
function applyTransformations(data, transformations) {
    return data.map((row) => {
        let transformedRow = { ...row };

        // Rename Columns
        if (transformations.renameColumns) {
            for (let [oldCol, newCol] of Object.entries(transformations.renameColumns)) {
                transformedRow[newCol] = transformedRow[oldCol];
                delete transformedRow[oldCol];
            }
        }

        // Apply Calculations
        if (transformations.calculations) {
            for (let [column, operation] of Object.entries(transformations.calculations)) {
                transformedRow[column] = eval(`${transformedRow[column]} ${operation}`);
            }
        }

        // Date Formatting
        if (transformations.dateFormats) {
            for (let [column, format] of Object.entries(transformations.dateFormats)) {
                transformedRow[column] = new Date(transformedRow[column]).toISOString().split("T")[0];
            }
        }

        return transformedRow;
    });
}

// SNS Email Notification
async function sendFailureNotification(errorMessage) {
    try {
        const params = {
            Message: `Transformation Failed: ${errorMessage}`,
            Subject: "File Transformation Error",
            TopicArn: process.env.SNS_TOPIC_ARN,
        };
        await sns.publish(params).promise();
        console.log("SNS Email sent successfully");
    } catch (snsError) {
        console.error("SNS failed, falling back to SMTP:", snsError);
        await sendEmailNotification(errorMessage);
    }
}

// SMTP Email Notification (Fallback)
async function sendEmailNotification(errorMessage) {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    let info = await transporter.sendMail({
        from: `"AWS Lambda Alerts" <${process.env.SMTP_USER}>`,
        to: process.env.ERROR_EMAIL,
        subject: "File Transformation Error",
        text: `An error occurred: ${errorMessage}`,
    });

    console.log("Fallback Email sent: ", info.messageId);
}