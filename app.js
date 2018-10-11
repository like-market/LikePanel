var express = require('express');
var path    = require("path");
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var db = require('./db');

var session = require('express-session')

var passport = require('passport')
var Strategy = require('passport-local').Strategy;

const authenticated = (req, res, next) => {
  	if (req.isAuthenticated()) return next()
  	else return res.redirect('/login')
}

passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
  }));
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

app.use(session({
	secret: 'KJjsdz',
	resave: false,
	saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/vendor', express.static('public/vendor'))
app.use('/styles', express.static('public/styles'))
app.use('/images', express.static('public/images'))
app.use('/scripts', express.static('public/scripts'))

app.get('/login(.htm)?', function(req, res) {
	// Если юзер авторизован - перенаправляем его в панель
	if (req.user != undefined) {
		res.redirect('/panel');
	}else {
		res.sendFile(path.join(__dirname + '/public/login.htm'));
	}
});

app.post('/login(.htm)?', 
  passport.authenticate('local', { 
  	successRedirect: '/panel' }));

app.get('/logout', function(req, res){ 	
	req.logout();
	res.redirect('/login');
});

app.get('/register(.htm)?', function(req, res){
	if (!req.isAuthenticated()) return res.redirect('/login')
	res.sendFile(path.join(__dirname + '/public/register.htm'));
})

app.post('/register(.htm)?', function(req, res){
	// TODO
})



app.get('/panel(.htm)?',authenticated, function(req, res){
	res.sendFile(path.join(__dirname + '/public/index.htm'));
})

app.listen(80);