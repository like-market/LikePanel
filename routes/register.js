var express = require('express');
var db = require('../db');
var router = express.Router();
var path    = require("path");

router.get('/', function(req, res){
	if (req.isAuthenticated()) return res.redirect('/panel');
	res.sendFile(path.join(__dirname + '/../public/register.htm'));
})

router.post('/', function(req, res){
	// Если одно из полей - пустое
	if (req.body.password == "" || req.body.username == "" /*|| req.body.email == ""*/) {
		return res.send('Empty field');
	}

	// Если пароли не совпадают
	if (req.body.password != req.body.repeatpassword) {
		return res.send('Password no match');
	}
	
	// Проверка на то, что ник уже занят
	db.users.findByUsername(req.body.username, function(err, user) {
		if (user != null) return res.send('User already exist');
		
		// Регестрируем клиента		
		b = req.body;
		db.users.register(b.username, b.password, b.email, function(err) {
			if (err) return console.error(err)
			db.users.findByUsername(b.username, function(err, user) {
				req.login(user, function(err) {
					if (err) return console.error(err);
					res.send('Success')

					ip = req.connection.remoteAddress.split(':').pop();
      				db.activity.auth(user.id, ip);
				})
			})
		})
	})
})

module.exports = router