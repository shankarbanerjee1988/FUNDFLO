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

    const clientIp = event.requestContext?.identity?.sourceIp || 
    event.headers?.['X-Forwarded-For']?.split(',')[0].trim();

    const userAgent = event.requestContext?.identity?.userAgent || 
    event.headers?.['User-Agent'];
      
    // Additional client information from headers
    const referer = event.headers?.Referer || event.headers?.referer;
    const origin = event.headers?.Origin || event.headers?.origin;
    const acceptLanguage = event.headers?.['Accept-Language'];
    let userInfo = {};
    try {
        console.log("Verifying token with Auth Service...");
        userInfo = await axios.get(AUTH_SERVICE_URL, { headers: { Authorization: authToken } });
        userInfo = userInfo?.data?.data;
        eventEnterpriseId = 0;
        if(userInfo && userInfo.enterpriseId){
            eventEnterpriseId = userInfo.enterpriseId;
        }else if(userInfo && userInfo.enterpriseCode){
            eventEnterpriseId = userInfo.enterpriseCode;
        }else if(userInfo && userInfo.enterpriseUuid){
            eventEnterpriseId = userInfo.enterpriseUuid;
        }
        userInfo.clientIp = clientIp;
        userInfo.userAgent = userAgent;
        userInfo.referer = referer;
        userInfo.origin = origin;
        userInfo.acceptLanguage = acceptLanguage;
        console.log("Authentication successful");
        console.log("USER INFO....",userInfo);
        userInfo.eventEnterpriseId = eventEnterpriseId;
        return userInfo;
    } catch (error) {
      userInfo.error = { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
        console.error("Authentication failed:", error.response?.data || error.message);
        return userInfo;
    }
};