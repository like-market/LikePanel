var logger = require('./logger.js')
var db = require('./db');

const utils = require('./utils')

const fs = require('fs');

const http = require('http');
const https = require('https');

var express = require('express');
var router = express.Router()

var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')

var passport = require('passport')
var Strategy = require('passport-local').Strategy;



passport.use(new Strategy(
    async function(username, password, cb) {
        user = await db.users.findByUsername(username);
        if (!user) { 
            return cb(null, false);
        }
        if (user.password != password) {
            return cb(null, false);
        }
        return cb(null, user);
    }
));
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(async function(id, cb) {
    user = await db.users.findById(id)
    cb(null, user);
});

var app = express();

app.use(cookieParser());
app.use(bodyParser.json());       // To support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // To support URL-encoded bodies
    extended: true
})); 

app.set('view engine', 'ejs');
app.set('views', require("path").join(__dirname, '/public'));

app.use(session({
    secret: 'KJjsdz',
    store: db.sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 5 } // 5 дней
}))

app.use(passport.initialize());
app.use(passport.session());



app.use(require('./routes/routes.js'))



// Сертификаты
const privateKey = fs.readFileSync('/etc/letsencrypt/live/like-market.ru-0001/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/like-market.ru-0001/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/like-market.ru-0001/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpServer = http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
})
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
    logger.info('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
    logger.info('HTTPS Server running on port 443');
});

// Получаем рандомный валидный токен
utils.vk.getRandomToken(async function() {
    // Обновляем аккаунты в бд,
    await utils.vk.updateAccounts()
    await utils.posthunter.updateAll();

    setInterval(utils.vk.updateAccounts, 1000 * 60 * 5)
    setInterval(utils.posthunter.updateAll,  1000 * 30)
})