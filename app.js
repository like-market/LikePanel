var worker = require('./worker.js')

var express = require('express');
var router = express.Router()
var path    = require("path");
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var db = require('./db');
var session = require('express-session')

var passport = require('passport')
var Strategy = require('passport-local').Strategy;

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

app.listen(80);