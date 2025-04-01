const { logger } = require('./../config/logger');
const shouldPrintMiddlewareLogs = true;

function middlewareLogs(request, response, next) {
    const { enterpriseUuid, legalEntityUuid, userUuid,loginUuid, userRole } = request;
    if(shouldPrintMiddlewareLogs){
        let requestIP= "";
        let loginInfo = `ENTERPRISE:${enterpriseUuid}, COMPANY:${legalEntityUuid},LOGIN_USER:${loginUuid},USER_ROLE:${userRole},USER_UUID:${userUuid}`
        let currentOperation = `OPERATIONS:${request.originalUrl}`
        let requestBody = {};
        try {
            let requestIPAddr= request.headers['x-forwarded-for'] || request.socket.remoteAddress;
            // const UserAgent = request.headers['user-agent'];
            requestIP = `REQUEST_IP:${requestIPAddr},REQUEST_METHOD:${request?.method}`;
        } catch (error) {
            logger.middlewareErrorLogs('MiddlewareLogs', 'middlewareLogs', error.message);
        }
        try {
            if(request?.body){
                requestBody = `BODY:${JSON.parse(request.body)}`;
            }
        } catch (error) {
            // logger.middlewareErrorLogs('MiddlewareLogs', 'middlewareLogs', error.message);
        }
        logger.middlewareInfoLogs(`${requestIP},${currentOperation},${loginInfo},${requestBody}`);

        next();
    }else{
        next();
    }

}

module.exports = { middlewareLogs }