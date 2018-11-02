var worker = require('./worker.js')
var db = require('./db');

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

var path    = require("path");


passport.use(new Strategy(
    function(username, password, cb) {
        db.users.findByUsername(username, function(err, user) {
                if (err) { return cb(err); }
                if (!user) { return cb(null, false); }
                if (user.password != password) { return cb(null, false); }
                return cb(null, user);
            });
        }
));
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    db.users.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

var app = express();

app.use(cookieParser());
app.use(bodyParser.json());       // To support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // To support URL-encoded bodies
    extended: true
})); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/public'));

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

app.use(function (req, res) {
    res.redirect('/panel')
})


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
    console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});