var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');

router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	db.tasks.findById(req.user.id, function(err, data) {
		if (err) return console.log(err);

		res.render('tasks', {login: req.user.username, tasks: data});
	})
});

// Создаем html код с задачами
/*router.get('/get', function(req, res){
	db.tasks.findById(req.user.id, function(err, data) {
		if (err) return console.log(err);

		res.render('taskslist', {tasks: data});
	})
})*/

module.exports = router