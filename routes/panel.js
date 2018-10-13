var express = require('express');
var router = express.Router();
var path    = require("path");

router.get('/', function(req, res){
	if (!req.isAuthenticated()) return res.redirect('/login');
	res.sendFile(path.join(__dirname + '/../public/index.htm'));
})

module.exports = router