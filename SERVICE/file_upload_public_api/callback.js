require("dotenv").config();
const axios = require("axios");


exports.processCallback = async (event,callbackData,callURL) => {
    console.error("callbackData......",callbackData);
    if (!callURL) {
        console.error("CALLBACK_URL is not present");
        return callbackData; // This stops further execution inside the function
    }

    const rawAuthToken = event.headers?.Authorization?.trim();
    if (!rawAuthToken) {
        console.warn("Unauthorized request: No auth token provided");
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const authToken = rawAuthToken.startsWith("Bearer ") ? rawAuthToken : `Bearer ${rawAuthToken}`;

    try {
            console.log("INSIDE CallbackRequest.......");
            axios.post(callURL, callbackData, {
                headers: {
                    Authorization: authToken,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log("CallbackRequest Response SUCCESS.......", response.data);
            })
            .catch(error => {
                if (error.response) {
                    console.error("CallbackRequest Response ERROR.......", error.response.data);
                } else if (error.request) {
                    console.error("CallbackRequest Response ERROR....... No response received", error.request);
                } else {
                    console.error("CallbackRequest Response ERROR.......", error.message);
                }
            });
        
    } catch (error) {
        console.error("Authentication failed:", error.response?.data || error.message);
        return { statusCode: 403, body: JSON.stringify({ error: "Invalid token" }) };
    }
    return callbackData;
};