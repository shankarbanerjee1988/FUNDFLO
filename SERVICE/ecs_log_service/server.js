const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const { logger } = require('./config/logger');
const helmet = require('helmet');
const { securityHeaders } = require('./middlewares/securityHeader');
const rateLimit = require("express-rate-limit");


const port = process.env.PORT || 8110;

app.listen(port, () => {
    logger.info(`DMS Server is started on. : http://localhost:${port}/`);    
});

app.disable('x-powered-by');
app.set('trust proxy', false);

app.use((request, response, next) => {
    response.header('Cache-Control','no-cache, no-store, must-revalidate');
    response.header('Server','');
    next();
});


app.use(express.json({
    limit: '20mb'
}));

app.use(express.json({
    limit: '20mb'
}));

app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '20mb',extended: false }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

app.use(helmet({
    contentSecurityPolicy: true,
}));

// const twoHourInSeconds = 3600*2;
const fiveDaysInSeconds = 432000;
app.use(helmet.hsts({
  maxAge: fiveDaysInSeconds
}));
app.use(helmet.frameguard({ action: 'sameorigin' }));


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: process.env.RATE_LIMIT ? process.env.RATE_LIMIT : 2000, // limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
    statusCode: 429,
    headers: true
  
  });
app.use(limiter);

app.use(securityHeaders);

app.get('/', (request,response)=>{
        response.status(200).json({status: false, message: 'Welcome to Fundflo DMS APIS '});
        return;
    });

//include all routes
require('./OMS/oms.route')(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    logger.error(`Wrong URL RUN, URL : ${req.url}`);
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers



// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});
