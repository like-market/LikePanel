var passport = require('passport');
var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');


router.get('/', function(req, res) {
	// Если юзер авторизован - перенаправляем его в панель
	if (req.isAuthenticated()) return res.redirect('/panel');
	res.sendFile(path.join(__dirname + '/../public/login.htm'));
});

router.post('/', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) return next(err);
		
		if (info == 'Missing credentials') {
			return res.send('Bad Request');
		}else if (!user) {
			return res.send('Unauthorized');
		}
		req.logIn(user, function(err) {
      		if (err) return next(err);
      		res.send('Success')
      		ip = req.connection.remoteAddress.split(':').pop();
      		db.activity.auth(user, ip);
    	});
  	})(req, res, next);
});

module.exports = router