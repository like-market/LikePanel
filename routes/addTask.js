var db = require('../db');
var app = require('../app.js');
var utils = require('../utils');
var path  = require("path");
var vkapi = require('../vkapi')
var express = require('express')
var router  = express.Router()

let maxCount;

router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	db.vk.getActiveAccountsCount(function(err, maxCount) {
		if (err) return console.error(err);

		console.log(maxCount)
		// Убераем 10% на всякий случай
		maxCount = Math.floor(maxCount * 0.9);

		// Уменьшаем максимальное кол-во, если баланс не позволяет
		if (req.user.balance * 10 < maxCount) {
			maxCount = req.user.balance * 10; 
		}

		res.render('addTask', {user: req.user, like_price: 0.10, max_count: maxCount});
	})
});

router.post('/get_wall', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	let post_id = req.body.post_id
	let name    = req.body.name
	let like_need = req.body.like_count
	let type = req.body.type

	// Проверка на тип таска
	if (!utils.tasks.isCorrectTaskType(type)) {
		return res.send('Incorrect task type');
	}
	// Проверка на кол-во лайков
	if (like_need <= 0 || like_need > maxCount || like_need > req.user.balance * 10) {
		return res.send('Too much likes count')
	}
	// Проверка на наличие нужного поста
	vkapi.getWallData(post_id, function(err, data) {
		data = data.response;
		if (data.length == 0) {
			return res.send('Post not found')
		}

		app.addTask(req.user.id, name, type, post_id, like_need);

		return res.send('Success')
	})

})

module.exports = router