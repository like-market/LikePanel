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

router.post('/add_likes', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

    const data = utils.urlparser.parse(req.body.url)
    console.log(data);
    if (data == null) {
    	res.send("Error url");
    	return
    }

    const owner_id = data.owner_id
    const item_id  = data.item_id
	const type     = data.type;
	const like_need = req.body.count

	// Проверка на количество лайков
	maxCount = await db.vk.getActiveAccountsCount();
	maxCount = Math.floor(maxCount * 0.9);

	if (like_need <= 0 || like_need > maxCount) {
		return res.send('Invalid amount likes')
	}
	if (like_need > req.user.balance * 10) {
		return res.send('Not enough money')
	}

	// Проверка на наличие объекта
	if (type == 'post') {
//		post = await vkapi.getWallData(post_id);	
//		if (!post.response || post.response.length == 0) return res.send('Not found')
	}
	// TODO: photo like

	utils.task.addLikes(req.user.id, req.body.name, owner_id, type, item_id, like_need);

	res.send('Success')
})

/**
 * Добавление задачи на накрутку комментариев
 *
 * @body name - название задачи
 * @body url  - url записи
 * @body count - колличество комментариев для накрутки
 * @body type - массив из id наборов комментариев, например  [ '1', '2' ]
 */
router.post('/add_comments', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	const data = utils.urlparser.parse(req.body.url)
    if (data == null) {
    	res.send("Error url");
    	return
    }

	// Проверка на количество лайков
	if (!req.body.count || req.body.count > req.user.balance * 10) {
		return res.send('Not enough money')
	}

	// TODO: Проверка на наличие объекта
	if (data.type == 'post') {
		// post = await vkapi.getWallData(data.item_id.post_id);	
		// if (!post.response || post.response.length == 0) return res.send('Not found')
	}
	// TODO: photo like

	// TODO: Проверка на принадлежность id комментов человеку 
	utils.task.addComments(
		req.user.id,       // Id пользователя, создающего задачу
		data.type,         // Тип задачи (пока что только 'post')
		req.body.name,     // Название задачи
		data.owner_id,     // Id юзера или сообщества, где находится запись
		data.item_id,      // Идентификатор записи
		req.body.type,     // Список Id наборов комментариев
		req.body.count     // Количество комментариев для накрутки
	);

	res.send('Success')
})

module.exports = router
