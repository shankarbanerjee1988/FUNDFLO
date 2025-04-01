let securityHeaders = (request, response, next) => {
    response.header("Cache-Control","no-cache, no-store, must-revalidate");
    response.header('Content-Security-Policy',"script-src 'self' *.fundflo.ai *.ccavenue.com  ");
    response.header("Server","");
    next();
};

module.exports = {
    securityHeaders
};
