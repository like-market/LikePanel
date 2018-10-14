var path    = require("path");
var express = require('express')
var router = express.Router()


router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	res.render('profile', {login: req.user.username});
});

module.exports = router