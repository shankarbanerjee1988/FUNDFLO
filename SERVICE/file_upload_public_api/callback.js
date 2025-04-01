require("dotenv").config();
const axios = require("axios");

exports.processCallback = async (event, callbackData, callURL) => {
    console.info("ProcessCallback DATA......", callbackData);
    console.info("ProcessCallback URL......", callURL);
    let processCallbackDataResp = {};

    // Return immediately if callURL is not present
    if (!callURL) {
        console.error("ProcessCallback CALLBACK_URL is not present");
        return null;
    }

    // Extract and validate auth token
    const rawAuthToken = event.headers?.Authorization?.trim();
    if (!rawAuthToken) {
        console.warn("Unauthorized request: No auth token provided");
        processCallbackDataResp = { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const authToken = rawAuthToken.startsWith("Bearer ") ? rawAuthToken : `Bearer ${rawAuthToken}`;

    console.info("ProcessCallback DATA AFTER ADDITION......", callbackData);

    try {
        console.log("INSIDE ProcessCallback.......");

        // Await axios post request
        const response = await axios.post(callURL, callbackData, {
            headers: {
                Authorization: authToken,
                "Content-Type": "application/json",
            },
        });

        console.log("ProcessCallback Response SUCCESS.......", response.data);
        processCallbackDataResp =  { statusCode: 200, body: JSON.stringify(response.data) };

    } catch (error) {
        console.error("ProcessCallback Error.......", error);
        // Handle axios errors properly
        if (error.response) {
            processCallbackDataResp =  { statusCode: error.response.status, body: JSON.stringify(error.response.data) };
        } else if (error.request) {
            processCallbackDataResp =  { statusCode: 500, body: JSON.stringify({ error: "No response received from callback URL" }) };
        } else {
            processCallbackDataResp =  { statusCode: 500, body: JSON.stringify({ error: error.message }) };
        }
    }
    return processCallbackDataResp;
};