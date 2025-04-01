const moment = require('moment');

let omsLogger= console;

omsLogger.customInfo = (location,passMsg) => 
{
    const msg = `DMS_CONSOLE_INFO:${process.env.NODE_ENV}), INFO_LOCATION: ${location}, MESSAGE_IS: ${passMsg}`
    omsLogger.info(msg);
};

omsLogger.customError = (location,passMsg) => 
    {
        const msg = `DMS_CONSOLE_ERROR:${process.env.NODE_ENV}), ERROR_LOCATION: ${location}, MESSAGE_IS: ${passMsg}`
        omsLogger.error(msg);
    };

    omsLogger.customDebug = (location,passMsg) => 
    {
        const msg = `DMS_CONSOLE_ERROR:${process.env.NODE_ENV}), ERROR_LOCATION: ${location}, MESSAGE_IS: ${passMsg}`
        omsLogger.debug(msg);
    };

module.exports = {
    omsLogger
};
