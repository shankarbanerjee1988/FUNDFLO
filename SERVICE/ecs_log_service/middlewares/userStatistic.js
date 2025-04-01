const { logger } = require('../config/logger');
const UserStatistics = require('../V1/admin/models/auditLogs/user-statistic');
const { literal } = require('sequelize');

const _checkAppOrWeb = ( origin ) => {
    const appWhitelist = ['ionic://localhost', 'app://mobile-app.fundflo.ai', 'https://mobile-app.fundflo.ai', 'ionic://mobile-app.fundflo.ai', 'http://mobile-app.fundflo.ai'];
    if(appWhitelist.includes(origin)){
        return "APP";
    }else{
        return "WEB";
    }
}

const userAudit = async (request, response, next) => {
    try {
        let origin = _checkAppOrWeb( request.header('Origin') );
        logger.customInfo('Middleware', 'userAudit', `origin: ${origin}`);

        let seqNo = 0;
        if (!seqNo) { seqNo = 0; }
        seqNo = Number(seqNo) + 1;
        UserStatistics.create({
            enterpriseUuid: request.enterpriseUuid,
            loginUuid: request.loginUuid,
            userUuid: request.userUuid,
            loginTime: new Date(),
            origin: origin,
            IP: request.ip,
            module: '',
            sesId: request.sessionId,
            reqUrl: request.originalUrl,
            seqNo,
            createdDate: new Date()
        })

    } catch (error) {
        logger.customError('Middleware', 'error in userAudit', error.message);
    } finally {
        return;
    }
}

module.exports = userAudit