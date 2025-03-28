require("dotenv").config();
const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

exports.authenticateRequest = async (event) => {
    if (!AUTH_SERVICE_URL) {
        console.error("AUTH_SERVICE_URL is not set in environment variables");
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error: AUTH_SERVICE_URL is missing" }) };
    }

    const rawAuthToken = event.headers?.Authorization?.trim();
    if (!rawAuthToken) {
        console.warn("Unauthorized request: No auth token provided");
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const authToken = rawAuthToken.startsWith("Bearer ") ? rawAuthToken : `Bearer ${rawAuthToken}`;

    try {
        console.log("Verifying token with Auth Service...");
        await axios.get(AUTH_SERVICE_URL, { headers: { Authorization: authToken } });
        console.log("Authentication successful");
        return null;
    } catch (error) {
        console.error("Authentication failed:", error.response?.data || error.message);
        return { statusCode: 403, body: JSON.stringify({ error: "Invalid token" }) };
    }
};