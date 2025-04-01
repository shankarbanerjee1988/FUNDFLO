const { logger } = require('../config/logger');
let { adminUrl } = require('../config/envSettings');
const { default: axios } = require('axios');

const authentication = async (request, response, next) => {
    try {
        const token = request.headers.authorization;
        if (!token) {
            logger.customError('authentication', 'authentication', `token is mandatory for authentication in headers`);
            return response.status(401).json({ status: false, resp: "No token passed" });
        }
        let config = {
            url: `${adminUrl}/v1/authentication`,
            method: 'get',
            headers: {
                Authorization: token
            }
        }
        logger.customInfo('authentication', 'authentication', `calling admin api, config: ${JSON.stringify(config)}`);
        let resp = await axios.request(config);
        let authData = resp?.data?.data;
        addAuthDataInRequest(authData, request);
        next();

    } catch (error) {
        if (error.status == 401) {
            logger.customError('authentication', 'authentication', `token is invalid for authentication in headers`);
            return response.status(401).json({ status: error?.response?.data?.status, message: error?.response?.data?.message });
        }
        logger.customError('authentication', 'authentication', `error in authentication, error: ${error?.message}`);
        return response.status(500).json({ message: 'Internal Server Error' });
    }
}

const addAuthDataInRequest = (authData, request) => {
    request.loginUuid = authData.loginUuid;
    request.userUuid = authData.userUuid;
    request.enterpriseUuid = authData.enterpriseUuid;
    request.enterpriseCode = authData.enterpriseCode;
    request.legalEntityUuid = authData.legalEntityUuid;
    request.companyCode = authData.companyCode;
    request.userCode = authData.userCode;
    request.loginFullName = authData.loginFullName;
    request.userFullName = authData.userFullName;
    request.userMobile = authData.userMobile;
    request.userRole = authData.userRole;
    request.sessionId = authData.sessionId;
}

module.exports = {
    authentication
}