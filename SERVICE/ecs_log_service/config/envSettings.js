let envApiInitial = '';
let envWebInitial = '';
let companyName = 'fundflo.ai';
let method = 'https';
let fundfloService = 'https://service-apis.dev.fundflo.ai';
let adminUrlInitial = '';

switch (process.env.NODE_ENV) {
    case 'local':
        envApiInitial = 'localhost:8115';
        envWebInitial = 'localhost:8115';
        companyName = '';
        method = 'http';
        adminUrlInitial = 'localhost:2000'
        break;
    case 'dev':
        envApiInitial = 'ar-apis-dev.uat.';
        envWebInitial = 'ar.dev.';
        adminUrlInitial = 'ac-apis-dev.uat.'
        break;
    case 'stage':
        envApiInitial = 'ar-apis.uat.';
        envWebInitial = 'ar.uat.';
        adminUrlInitial = 'ac-apis.uat.'
        break;
    case 'test':
        envApiInitial = 'ar-apis-qa.uat.';
        envWebInitial = 'ar.qa.';
        adminUrlInitial = 'ac-apis.uat.'
        break;
    case 'prod':
        envApiInitial = 'test-enterprise-api.';
        envWebInitial = 'ar.';
        fundfloService = 'https://service-apis.product.fundflo.ai';
        adminUrlInitial = 'ac.'
        break;
    case 'siyaram':
        envApiInitial = 'test-enterprise-api.';
        envWebInitial = 'siyaram.';
        fundfloService = 'https://service-apis.product.fundflo.ai';
        adminUrlInitial = 'ac.'
        break;
    case 'greenply':
        envApiInitial = 'test-enterprise-api.';
        envWebInitial = 'ar.';
        fundfloService = 'https://service-apis.product.fundflo.ai';
        adminUrlInitial = 'ac.'
        break;
    default:
        envApiInitial = 'ar-apis-dev.uat.';
        envWebInitial = 'ar.dev.';
        adminUrlInitial = 'ac-apis-dev.uat.'
        break;
}
module.exports = {
    fundFloAPIUrl: `${method}://${envApiInitial}${companyName}`,
    fundFloWebUrl: `${method}://${envWebInitial}${companyName}`,
    fundFloTPIntUrl: `${method}://tp.uat.fundflo.ai`,
    fundfloService,
    adminUrl: `${method}://${adminUrlInitial}${companyName}`,
};
