require("dotenv").config();
const axios = require("axios");


exports.processCallback = async (event,callbackData,callURL) => {
    console.info("ProcessCallback DATA......",callbackData);
    console.info("ProcessCallback URL......",callURL);
    if (!callURL) {
        console.error("ProcessCallback CALLBACK_URL is not present");
        return callbackData; // This stops further execution inside the function
    }
    const rawAuthToken = event.headers?.Authorization?.trim();
    if (!rawAuthToken) {
        console.warn("Unauthorized request: No auth token provided");
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    callbackData.callURL = callURL;
    const authToken = rawAuthToken.startsWith("Bearer ") ? rawAuthToken : `Bearer ${rawAuthToken}`;

    try {
            console.log("INSIDE ProcessCallback.......");
            axios.post(callURL, callbackData, {
                headers: {
                    Authorization: authToken,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                console.log("ProcessCallback Response SUCCESS.......", response.data);
            })
            .catch(error => {
                if (error.response) {
                    console.error("ProcessCallback Response ERROR.......", error.response.data);
                } else if (error.request) {
                    console.error("ProcessCallback Response ERROR....... No response received", error.request);
                } else {
                    console.error("ProcessCallback Response ERROR.......", error.message);
                }
            });
        
    } catch (error) {
        console.error("ProcessCallback Authentication failed:", error.response?.data || error.message);
        return { statusCode: 403, body: JSON.stringify({ error: "ProcessCallback Invalid token" }) };
    }
    return callbackData;
};