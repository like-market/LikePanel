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

	// Получаем количество всех доступных аккаунтов
	accountsCount = await db.vk.getActiveAccountsCount();
	accountsCount = Math.floor(accountsCount * 0.9);

	// Получаем количество доступных аккаунтов для клиентских наборов
	сustomAccountCount = await db.vk.getActiveAccountsCount(1); // Группа аккаунтов равна 1
	customAccountCount = Math.floor(сustomAccountCount * 0.9);
	
	// Проверка на то, что хватает денег
	maxLikeCount = Math.floor(req.user.balance / req.user.like_price);
	if (maxLikeCount > accountsCount) maxLikeCount = accountsCount;
 
	maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
	if (maxCommentCount > 3500) maxCommentCount = 3500;

	// Максимальное количество комментариев по балансу
	maxCustomCommentCount = Math.floor(req.user.balance / req.user.comment_price);
	if (maxCustomCommentCount > customAccountCount * 3) maxCustomCommentCount = customAccountCount * 3;

	comments = await db.comments.getUserComments(req.user.id, true);
	
	res.render('addTask', {
		user: req.user,
		minLikeCount,
		maxLikeCount,
		minCommentCount,
		maxCustomCommentCount,
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

	// Проверка названия [длина] + замена запрещенных символов
	req.body.name = req.body.name.replace(/['"]/gi, '')
	if (req.body.name.length > 75) {
		res.send('Ошибка в названии')
	}

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
		if (likes.error.error_code == 5) {
			return res.send('Запись не найдена или не хватает прав для комментирования')
		} else {
			return res.send('Ошибка при получении информации о записе')
		}
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

	// Проверка названия [длина] + замена запрещенных символов
	req.body.name = req.body.name.replace(/['"]/gi, '')
	if (req.body.name.length > 75) {
		res.send('Ошибка в названии')
	}

	// Проверка url
	const data = utils.urlparser.parseURL(req.body.url)
    if (data == null) {
    	res.send("Error url");
    	return
    }

    // 
    if (!Array.isArray(req.body.comment_ids) || req.body.comment_ids.length == 0 || !req.body.comment_ids.includeOnlyNumbers()) {
    	return res.send('Ошибка в наборах комментариев')
    }
    // Получение данных о наборах комментариях
    const comments_data = await db.comments.getCommentsData(req.body.comment_ids);
    if (comments_data.length != req.body.comment_ids.length) {
    	return res.send('ID одного из наборов не существует')
    }
    let use_custom = false; // Используются ли пользовательские комментарии
    for (comment_data of comments_data) {
    	if (comment_data.owner_id != 0 && comment_data.owner_id != req.user.id) return res.send('Нет доступа к одному из наборов')
    	if (comment_data.status != 'accept') return res.send('Один из наборов не активен')
    	if (comment_data.owner_id != 0) use_custom = true;
    }

    if (use_custom) {
		// Получаем количество доступных аккаунтов для клиентских наборов
		customAccountCount = await db.vk.getActiveAccountsCount(1);
		var maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
		if (maxCommentCount > customAccountCount * 3) maxCommentCount = customAccountCount * 3;
    }else {
		var maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
		if (maxCommentCount > 3500) maxCommentCount = 3500;    
    }

    const comment_need = req.body.count

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
		req.body.count,      // Количество комментариев для накрутки
		use_custom      // Используются ли клиентские наборы комментариев
	);

	res.send('Success')
})

module.exports = router