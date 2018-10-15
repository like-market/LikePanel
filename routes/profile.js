var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
require('moment/locale/ru');

router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	db.activity.getActivity(req.user.id, function(err, activities) {
		db.finance.getIntervalBalance(req.user.id, function(err, transactions) {
			db.users.getBasicStatistic(req.user.id, function(err, statistic) {
				res.render('profile', {moment: moment,
					user: req.user,
					activities: activities,
					transactions: transactions,
					statistic: statistic
				});
			})
		})
	})
});

module.exports = router