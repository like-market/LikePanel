var path    = require("path");
var express = require('express')
var router = express.Router()

router.get('/', function(req, res) {
	// Если юзер авторизован - перенаправляем его в панель
	if (req.isAuthenticated()) return res.redirect('/panel');
	res.sendFile(path.join(__dirname + '/../public/forgotPassword.htm'));
});

module.exports = router