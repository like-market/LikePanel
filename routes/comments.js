var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');


router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	
	res.render('comments', {user: req.user});
});

module.exports = router