var path    = require("path");
var express = require('express')
var router = express.Router()


router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	res.sendFile(path.join(__dirname + '/../public/profile.htm'));
});

module.exports = router