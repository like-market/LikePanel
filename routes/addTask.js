var db = require('../db');
var app = require('../app.js');
var utils = require('../utils');
var path  = require("path");
var vkapi = require('../vkapi')
var express = require('express')
var router  = express.Router()

router.get('/', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	db.vk.getActiveAccountsCount(function(err, maxCount) {
		if (err) return console.error(err);

		// Убераем 10% на всякий случай
		maxCount = Math.floor(maxCount * 0.9);
	
		// Уменьшаем максимальное кол-во, если баланс не позволяет
		if (req.user.balance * 10 < maxCount) {
			maxCount = req.user.balance * 10; 
		}
		if (maxCount < 0) maxCount = 0

		res.render('addTask', {user: req.user, like_price: 0.10, max_count: maxCount});
	})
});

router.post('/add_task', function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(req.body.url)

    // Проверка на корректность URL
    if (match == null) {
        return res.send('Error url')
    }

    let post_id = match[4]
	let url  = req.body.url
	let type = req.body.type
	let name    = req.body.name
	let like_need = req.body.like_count


	// Проверка на тип таска
	if (!utils.task.isCorrectType(type)) {
		return res.send('Incorrect task type');
	}
	// Проверка на кол-во лайков
	db.vk.getActiveAccountsCount(function(err, maxCount) {
		maxCount = Math.floor(maxCount * 0.9);
		

		if (like_need <= 0 || like_need > maxCount) {
			return res.send('Invalid amount likes')
		}
		if (like_need > req.user.balance * 10) {
			return res.send('Not enough money')
		}
		// Проверка на наличие нужного поста
		vkapi.getWallData(post_id, function(err, data) {
			if (err) return console.log(err)

			data = data.response;
			if (data == undefined || data.length == 0) {
				return res.send('Post not found')
			}

			utils.task.add(req.user.id, name, type, url, like_need);

			return res.send('Success')
		})
	})
})

module.exports = router