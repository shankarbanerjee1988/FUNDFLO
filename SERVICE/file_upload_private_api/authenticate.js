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
        let userInfo = await axios.get(AUTH_SERVICE_URL, { headers: { Authorization: authToken } });
        userInfo = userInfo?.data?.data;
        eventEnterpriseId = 0;
        if(userInfo && userInfo.enterpriseId){
            eventEnterpriseId = userInfo.enterpriseId;
        }else if(userInfo && userInfo.enterpriseCode){
            eventEnterpriseId = userInfo.enterpriseCode;
        }else if(userInfo && userInfo.enterpriseUuid){
            eventEnterpriseId = userInfo.enterpriseUuid;
        }
        console.log("Authentication successful");
        console.log("USER INFO....",userInfo);
        event.eventEnterpriseId = eventEnterpriseId;
        return null;
    } catch (error) {
        console.error("Authentication failed:", error.response?.data || error.message);
        return { statusCode: 403, body: JSON.stringify({ error: "Invalid token" }) };
    }
};