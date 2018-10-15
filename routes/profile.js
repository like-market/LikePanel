var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
require('moment/locale/ru');

router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	db.activity.getActivity(req.user.id, function(err, data) {
		res.render('profile', {moment: moment, user: req.user, activities: data});
	})
});

module.exports = router