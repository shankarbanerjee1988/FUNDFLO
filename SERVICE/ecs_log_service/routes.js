// const { cors, corsWithOptions } = require('../config/cors');

module.exports = function (app) {
    app.use('/logs', require('./logs/oms.route'))
};
