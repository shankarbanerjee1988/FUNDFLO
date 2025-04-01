require("dotenv").config();
const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

exports.sourceSystemInfo = async (event) => {

    let sourceSystem = {};

    //Get Source IP Address
    const sourceIp = sourceSystem.sourceIp =  event.requestContext?.identity?.sourceIp || 
                                        event.headers["X-Forwarded-For"]?.split(",")[0] || 
                                        "Unknown";
    //Get Domain Name
     sourceSystem.domain = event.headers["Host"] || "Unknown";
    //Fetch Geolocation (Country & Region) from IP
    let country = "Unknown", region = "Unknown";
            try {
                if (sourceIp !== "Unknown") {
                    const response = await axios.get(`http://ip-api.com/json/${sourceIp}`);
                    sourceSystem.country = country = response.data.country || "Unknown";
                    sourceSystem.region = region = response.data.regionName || "Unknown";
                }
            } catch (error) {
                console.error("Failed to fetch location:", error.message);
            }
    console.log("SourceSystemDetails....",sourceSystem);
    return sourceSystem;
 };