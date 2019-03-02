var logger = require('../logger.js')
var db = require('../db');
var app = require('../app.js');
var utils = require('../utils');
var path  = require("path");
var vkapi = require('../vkapi')
var express = require('express')
var router  = express.Router()

const minLikeCount    = 50;
const minCommentCount = 50;

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	// Получаем количество доступных аккаунтов
	accountsCount = await db.vk.getActiveAccountsCount();
	accountsCount = Math.floor(accountsCount * 0.9);

	// Проверка на то, что хватает денег
	maxLikeCount = Math.floor(req.user.balance / req.user.like_price);
	if (maxLikeCount > accountsCount) maxLikeCount = accountsCount;
 
	maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
	if (maxCommentCount > 3500) maxCommentCount = 3500;

	comments = await db.comments.getUserComments(req.user.id, true);
	
	res.render('addTask', {
		user: req.user,
		minLikeCount,
		maxLikeCount,
		minCommentCount,
		maxCommentCount,
		comments
	});
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

	// Проверка URL
    const data = utils.urlparser.parseURL(req.body.url)
    if (data == null) {
    	res.send("Error url");
    	return
    }

    // Проверка количества лайков
	const like_need = req.body.count

	accountsCount = await db.vk.getActiveAccountsCount();
	accountsCount = Math.floor(accountsCount * 0.95);

	maxLikeCount = Math.floor(req.user.balance / req.user.like_price);
	if (maxLikeCount > accountsCount) maxLikeCount = accountsCount;

	if (parseInt(like_need) != like_need ||	like_need < minLikeCount || like_need > maxLikeCount) {
		return res.send('Invalid amount likes')
	}

	// Проверка на наличие объекта (пытаемся получить список поставленных лайков)
	let likes = await vkapi.getLikeList(data.type, data.owner_id, data.item_id, 1);
	if (likes.error) {
		if (likes.error.error_code == 5) return res.send('Access restriction')
		else return res.send('Error')
	}
	
	utils.task.addLikes(req.user, req.body.name, data.owner_id, data.type, data.item_id, like_need);

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

	maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
	if (maxCommentCount > 3500) maxCommentCount = 3500;    

	// Проверка на количество
	if (parseInt(comment_need) != comment_need || comment_need < minCommentCount || comment_need > maxCommentCount) {
		return res.send('Invalid amount comments')
	}

	// Проверка на наличие объекта
	let comments = await vkapi.getCommentList(data.type, data.owner_id, data.item_id, 1);
	if (comments.error) {
		if (comments.error.error_code == 212) return res.send('Access restriction')
		else return res.send('Error')
	}

	utils.task.addComments(
		req.user,            // Объект пользователя, создающего задачу
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