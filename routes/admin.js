var express = require('express');
var router = express.Router();
var path    = require("path");
var utils = require('../utils');
var db = require('../db');

router.get('/', function(req, res){
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	res.render('admin', {user: req.user});
})

/**
 * Изменяем баланс
 * @param type - тип операции [add / spend]
 * @param count - количество десятых долей копейки
 */
router.post('/change_balance', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	const user = await db.users.findByUsername(req.body.username)
	if (!user) return res.send('User not found')

	utils.user.changeBalance(user, req.body.type, req.body.count, 'Изменение через админку')
	
	res.send('Success')
})

/**
 * Добавляем новые аккаунты вк
 */
router.post('/add_account', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	var accounts = [];
	var data = req.body.accounts.split("\n");

	for (i = 0; i < data.length; i++) {
		data[i] = data[i].split(':')
		accounts.push({login: data[i][0], password: data[i][1]});
	}
	
	utils.vk.addAccounts(accounts);

	res.send('Success')
})

module.exports = router