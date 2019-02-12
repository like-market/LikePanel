var logger = require('../logger.js')
var db = require('../db');
var app = require('../app.js');
var utils = require('../utils');
var path  = require("path");
var vkapi = require('../vkapi')
var express = require('express')
var router  = express.Router()

const likePrice    = 0.1; // Цена лайка
const commentPrice = 0.1; // Цена комментария

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	// Получаем количество доступных аккаунтов
	accountsCount = await db.vk.getActiveAccountsCount();
	accountsCount = Math.floor(accountsCount * 0.9);


	// Если ограничение по кол-ву аккаунтов
	if (req.user.balance * likePrice < accountsCount) {
		maxLikeCount = req.user.balance * likePrice; 
	}else {
		maxLikeCount = accountsCount;
	}

	// Максимальное колличество комментариев ограничено лишь балансом 
	maxCommentCount = Math.floor(req.user.balance * commentPrice);
	comments = await db.comments.getUserComments(req.user.id, true);
	
	res.render('addTask', {user: req.user, likePrice, commentPrice, maxLikeCount, maxCommentCount, comments});
});

/**
 * Добавление задачи на накрутку лайков
 *
 * @body name - название задачи
 * @body url  - url записи
 * @body count - колличество лайков для накрутки
 */
router.post('/add_likes', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

    const data = utils.urlparser.parseURL(req.body.url)
    console.log(req.body.url, data);
    if (data == null) {
    	res.send("Error url");
    	return
    }

	const like_need = req.body.count

	// Проверка на количество лайков
	maxCount = await db.vk.getActiveAccountsCount();
	maxCount = Math.floor(maxCount * 0.9);

	if (parseInt(like_need) != like_need || like_need == "" || like_need <= 0 || like_need > maxCount) {
		return res.send('Invalid amount')
	}
	if (like_need > req.user.balance * 10) {
		return res.send('Not enough money')
	}

	// Проверка на наличие объекта
	let likes = await vkapi.getLikeList(data.type, data.owner_id, data.item_id, 1);
	if (likes.error) {
		if (likes.error.error_code == 5) return res.send('Access restriction')
		else return res.send('Error')
	}

	utils.task.addLikes(req.user.id, req.body.name, data.owner_id, data.type, data.item_id, like_need);

	res.send('Success')
})

/**
 * Добавление задачи на накрутку комментариев
 *
 * @body name - название задачи
 * @body url  - url записи
 * @body count - колличество комментариев для накрутки
 * @body comment_ids - массив из id наборов комментариев, например  [ '1', '2' ]
 */
router.post('/add_comments', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	const data = utils.urlparser.parseURL(req.body.url)
    if (data == null) {
    	res.send("Error url");
    	return
    }

    const comment_need = req.body.count

	// Проверка на количество
	if (parseInt(comment_need) != comment_need || comment_need == "" || comment_need <= 0 || comment_need > 500) {
		return res.send('Invalid amount')
	}
	if (comment_need > req.user.balance * 10) {
		return res.send('Not enough money')
	}

	// Проверка на наличие объекта
	let comments = await vkapi.getCommentList(data.type, data.owner_id, data.item_id, 1);
	if (comments.error) {
		if (comments.error.error_code == 212) return res.send('Access restriction')
		else return res.send('Error')
	}

	utils.task.addComments(
		req.user.id,         // Id пользователя, создающего задачу
		data.type,           // Тип задачи
		req.body.name,       // Название задачи
		data.owner_id,       // Id юзера или сообщества, где находится запись
		data.item_id,        // Идентификатор записи
		req.body.comment_ids,// Список Id наборов комментариев
		req.body.count       // Количество комментариев для накрутки
	);

	res.send('Success')
})

module.exports = router
