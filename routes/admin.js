var express = require('express');
var router = express.Router();
var path    = require("path");
var utils = require('../utils');

router.get('/', function(req, res){
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	res.render('admin', {user: req.user});
})

router.post('/change_balance', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	var username = req.body.username
	var count = req.body.count
	var type = req.body.type

	if (type == 'add') {
		utils.user.addBalance(username, count)
	}
	if (type == 'sub') {
		utils.user.subtractBalance(username, count)
	}
	res.send('Success')
})
module.exports = router