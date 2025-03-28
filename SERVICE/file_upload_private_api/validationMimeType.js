require("dotenv").config();

const ALLOWED_MIME_TYPES = process.env.ALLOWED_MIME_TYPES
    ? process.env.ALLOWED_MIME_TYPES.split(",").map(type => type.trim())
    : [];
exports.validateMimeType = async (mimetype) => {
    console.error(`file type: ${mimetype}`);
    return !ALLOWED_MIME_TYPES.includes(mimetype);
};