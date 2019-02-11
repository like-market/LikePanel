var logger = require('./logger.js')
var db = require('./db');

const utils = require('./utils')

const fs = require('fs');

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


app.listen(8080, () => {
    logger.info('HTTP Server running on port 8080');
});

// Получаем рандомный валидный токен
utils.vk.updateAccounts(async function() {
    await utils.vk.getRandomToken();
    await utils.posthunter.updateAll();

    setInterval(utils.vk.updateAccounts, 1000 * 60 * 5)
    setInterval(utils.posthunter.updateAll,  1000 * 30)
});