require("dotenv").config();
const AWS = require("aws-sdk");
const multipart = require("aws-lambda-multipart-parser");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE_MB || "5") * 1024 * 1024; // Default 5MB

// ✅ Upload Chunks to S3
const uploadChunkToS3 = async (buffer, key, index) => {
    const chunkKey = `${key}_part_${index}`;

    const params = {
        Bucket: BUCKET_NAME,
        Key: chunkKey,
        Body: buffer,
        ContentType: "application/octet-stream",
    };

    await s3.putObject(params).promise();
    return chunkKey;
};

// ✅ Handle File Upload & Splitting
exports.uploadAndSplitFile = async (event) => {
    console.log("📥 Received file upload request");

    // 🔹 Parse Multipart Form Data
    const parsedBody = multipart.parse(event, true);
    const fileKey = Object.keys(parsedBody).find((key) => parsedBody[key]?.filename);
    if (!fileKey) {
        return { statusCode: 400, body: JSON.stringify({ error: "No file uploaded" }) };
    }

    const file = parsedBody[fileKey];
    console.log(`📄 Processing file: ${file.filename} (${file.content.length} bytes)`);

    // 🔹 Split File into Chunks
    const chunks = [];
    for (let i = 0; i < file.content.length; i += CHUNK_SIZE) {
        chunks.push(file.content.slice(i, i + CHUNK_SIZE));
    }

    // 🔹 Upload Chunks
    const uploadedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunkKey = await uploadChunkToS3(Buffer.from(chunks[i]), file.filename, i + 1);
        uploadedChunks.push({ part: i + 1, chunkKey });
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "File split and uploaded successfully", uploadedChunks }),
    };
};