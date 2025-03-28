require("dotenv").config();

const ALLOWED_MIME_TYPES = process.env.ALLOWED_MIME_TYPES
    ? process.env.ALLOWED_MIME_TYPES.split(",").map(type => type.trim())
    : [];
exports.validateMimeType = async (mimetype) => {
    return !ALLOWED_MIME_TYPES.includes(mimetype);
};