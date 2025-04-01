const express = require('express');
const cors = require('cors');
const app = express();
const { fundFloWebUrl} = require('./envSettings');

app.use(cors());


const restOptions = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
    allowedHeaders: 'Content-type, Accept, X-XSRF-TOKEN, Cache-Control, Authorization, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Request-Credentails, X-SESSION-ID',
    optionsSuccessStatus: 204
};

let whitelist = [];
if(process.env.NODE_ENV == 'prod'){
    whitelist = [
        fundFloWebUrl,
        'ionic://localhost',
        'app://mobile-app.fundflo.ai', 
        'https://mobile-app.fundflo.ai', 
        'ionic://mobile-app.fundflo.ai',
        'https://cashflo.dev.fundflo.ai',
        'https://ar.fundflo.ai',
        'https://siyaram.fundflo.ai',
        'https://fundflo.ai',
        'http://mobile-app.fundflo.ai',
        'https://wwww.fundflo.ai',
        'https://admin.fundflo.ai',
        'https://internal-admin.fundflo.ai',
        'https://ap.fundflo.ai',
        'https://product.fundflo.ai',
        'https://cashflo.fundflo.ai'
    ];
}else{
    whitelist = [fundFloWebUrl, 'http://localhost:4200', 'http://localhost',
        'ionic://localhost', 'app://localhost', 'app://mobile-app.fundflo.ai', 'https://mobile-app.fundflo.ai', 'ionic://mobile-app.fundflo.ai',
        'http://localhost:8115', 'http://localhost:8100', 'http://localhost:8080',
        'https://ap.dev.fundflo.ai', 'https://admin.dev.fundflo.ai', 'https://admin.uat.fundflo.ai', 'https://ar.dev.fundflo.ai','https://cashflo.dev.fundflo.ai',
        'https://ar.qa.fundflo.ai', 'https://enterprise.fundflo.ai', 'https://ar.uat.fundflo.ai', 'https://ap.uat.fundflo.ai',
        'https://www.fundflo.ai','http://mobile-app.fundflo.ai','https://fundflo.ai','https://ar-demo.uat.fundflo.ai'];
}
let corsOptionsDelegate = (req, callback) => {
    let corsOptions;
    console.log(req.header('Origin'));
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true, ...restOptions };
    }
    else {
        corsOptions = { origin: fundFloWebUrl, ...restOptions };
        console.log(corsOptions);
    }
    callback(null, corsOptions);
};

module.exports = {
    cors: cors(),
    corsWithOptions: cors(corsOptionsDelegate)
};
//corsWithOptions
