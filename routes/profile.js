var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
require('moment/locale/ru');

router.get('/', async function(req, res) {

	if (!req.isAuthenticated()) return res.redirect('/login');
	activities   = await db.activity.get(req.user.id);
	transactions = await db.finance.getIntervalBalance(req.user.id);

	statistic    = await db.users.getBasicStatistic(req.user.id);

	res.render('profile', {
		moment: moment,
		user: req.user,
		activities: activities,
		transactions: transactions,
		statistic: statistic
	});
})

module.exports = router