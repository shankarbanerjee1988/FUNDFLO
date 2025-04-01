const aws = require("aws-sdk");
const moment = require('moment');

let logger = console;


logger.customInfo = (module,subject, passMsg) => 
{
    const msg = `INFO: From...${process.env.NODE_ENV})....Module....${module}...For...${subject}..Message...${passMsg}`
    logger.info(msg);
};

logger.customError = (module,subject, passMsg) => 
{
    const msg = `ERROR: From...${process.env.NODE_ENV})....Module....${module}...For...${subject}..Message...${passMsg}`
    logger.error(msg);
};

logger.middlewareInfoLogs = (passMsg) => 
    {
            const msg = `MIDDLEWARE_LOGS_INFO: ${passMsg}`
            logger.info(msg);
    };
    logger.middlewareErrorLogs = (passMsg) => 
        {
                const msg = `MIDDLEWARE_LOGS_ERROR: ${passMsg}`
                logger.error(msg);
        };
module.exports = {
    logger
};
