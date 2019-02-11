var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');


router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	data = await db.tasks.findById(req.user.id)
	res.render('tasks', {user: req.user, tasks: data});
});


module.exports = router