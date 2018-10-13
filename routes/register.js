var express = require('express');
var router = express.Router();
var path    = require("path");

router.get('/', function(req, res){
	if (req.isAuthenticated()) return res.redirect('/panel');
	res.sendFile(path.join(__dirname + '/../public/register.htm'));
})

router.post('/', function(req, res){
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

module.exports = router