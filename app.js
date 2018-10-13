var express = require('express');
var router = express.Router()
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

app.use(session({
	secret: 'KJjsdz',
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 9999999 }
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/vendor', express.static('public/vendor'))
app.use('/styles', express.static('public/styles'))
app.use('/images', express.static('public/images'))
app.use('/scripts', express.static('public/scripts'))

router.get('/login(.htm)?', function(req, res) {
	// Если юзер авторизован - перенаправляем его в панель
	if (req.isAuthenticated()) return res.redirect('/panel');
	res.sendFile(path.join(__dirname + '/public/login.htm'));
});

router.post('/login(.htm)?', 
  passport.authenticate('local', { 
  	successRedirect: '/panel' }));

router.get('/logout', function(req, res){ 	
	req.logout();
	res.redirect('/login');
});

router.get('/register(.htm)?', function(req, res){
	if (req.isAuthenticated()) return res.redirect('/panel');
	res.sendFile(path.join(__dirname + '/public/register.htm'));
})

router.post('/register(.htm)?', function(req, res){
	// Если одно из полей - пустое
	if (req.body.password == "" || req.body.username == "" || 
		req.body.email == "") {
		res.sendStatus(400)
		res.send('Empty field');
	// Если пароли не совпадают
	}else if (req.body.password != req.body.repeatpassword) {
		res.sendStatus(400)
		res.send('Password no match');
	// Проверка на то, что ник уже занят
	}else {
		db.users.findByUsername(req.body.username, function(err, user) {
			if (user != null) {
				res.sendStatus(400)
				res.send('User already exist');
			// Регестрируем клиента
			} else {
				b = req.body;
				db.users.register(b.username, b.password, b.email, function(err) {
					if (err) return console.error(err)
					db.users.findByUsername(b.username, function(err, user) {
						req.login(user, function(err) {
							if (err) return console.error(err);
							return res.redirect('/panel')
						})
					})
				})
			}
		})
	}
})

router.get('/panel(.htm)?', authenticated, function(req, res){
	res.sendFile(path.join(__dirname + '/public/index.htm'));
})

app.use(router, function (req, res) {
	res.redirect('/panel')
})

app.listen(80);