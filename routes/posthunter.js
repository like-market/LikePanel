var logger = require('../logger.js')
var db = require('../db');
var app = require('../app.js');
var utils = require('../utils');
var path  = require("path");
var vkapi = require('../vkapi')
var express = require('express')
var router  = express.Router()

var moment = require('moment');
require('moment/locale/ru');

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	comments = await db.comments.getUserComments(req.user.id, true);
	groups   = await db.posthunter.getByOwner(req.user.id); // Получаем все группы

	res.render('posthunter', {user: req.user, comments, groups, moment});
});

/**
 * Добавляем новую группу
 * @body name - название задачи
 * @body group_name - название группы
 * @body min_likes
 * @body max_likes
 * @body min_comments
 * @body max_comments
 * @body comments_ids
 */
router.post('/add', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	data = req.body;

	// Проверка лайков
	if (parseInt(data.min_likes) != data.min_likes || parseInt(data.max_likes) != data.max_likes ||
		data.min_likes < 10 || data.min_likes > 1000 || data.max_likes < 10 || data.max_likes > 1000 ||
		data.min_likes > data.max_likes)
	{
		return res.send('Error likes');
	}

	// Проверка комментариев
	if (!data.min_comments) data.min_comments = 0;
	if (!data.max_comments) data.max_comments = 0;
	if (((parseInt(data.min_comments) != data.min_comments || parseInt(data.max_comments) != data.max_comments) &&
		data.min_comments != "" && data.max_comments != "") ||
		data.min_comments < 0 || data.min_comments > 500 || data.max_comments < 0 || data.max_comments > 500 ||
		data.min_comments > data.max_comments)
	{
		return res.send('Error comments');
	}
	// Проверка url группы
	const group_data = await vkapi.getTypeByName(data.group_name);

	if (data.group_name == "" || (group_data.type != 'page' && group_data.type != 'user' &&
		group_data.type != 'group'))
	{
		return res.send('Error group');
	}
	// Добавляем минус, если это сообщество
	if (group_data.type == 'page' || group_data.type == 'group') {
		group_data.object_id = '-' + group_data.object_id;
	}

	// Проверка на то, что группа еще не была добавлена
	const exists = await db.posthunter.getByGroupId(group_data.object_id);
	console.log(exists);
	if (exists.length) {
		return res.send('Already added')
	}

	let last_post_id;
	const wall = await vkapi.getWall(group_data.object_id, 1);
	
	if (wall.response.items.length == 0) last_post_id = 0
	else last_post_id = wall.response.items[0].id;
	
	if (parseInt(last_post_id) != last_post_id) last_post_id = 0;

	db.posthunter.add(
		req.user.id,          // Владелец записи в постхантере
		group_data.object_id, // Id группы/пользователя
		data.name,            // Название записи в постхантере
		last_post_id,    // Последний пост
		data.min_likes, data.max_likes,       // Количество лайков
		data.min_comments, data.max_comments, // Количество комментов
		data.comments_ids     // Id набора комментариев
	);
	res.send('Ok');
})

/**
 * Обновляем статус
 */
router.post('/update_status', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	group = await db.posthunter.getById(req.body.id);
	
	// Проверка прав
	if (group.owner_id != req.user.id) {
		return res.send('Forbidden');
	}
	// Проверка корректности данных
	if (req.body.status != 'enable' && req.body.status != 'disable') {
		return res.send('Invalid data');
	}

	db.posthunter.setStatus(req.body.id, req.body.status);

	res.send('Success')
})

module.exports = router
