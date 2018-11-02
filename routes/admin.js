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

router.post('/add_account', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	var accounts = [];
	var data = req.body.accounts.split("\n");
	for (i = 0; i < data.length; i++) {
		data[i] = data[i].split(':')
		accounts.push({login: data[i][0], password: data[i][1]});
	}
	console.log(accounts);
	
	utils.vk.addAccount(accounts);

	res.send('Success')
})

module.exports = router