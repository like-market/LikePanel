var express = require('express');
var router = express.Router();
var path    = require("path");

router.get('/', function(req, res){
	if (!req.isAuthenticated()) return res.redirect('/login');
	res.render('panel', {user: req.user});
})

module.exports = router