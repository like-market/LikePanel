const logger = require('../logger.js')
const db = require('../db');
const utils = require('../utils');
const vkapi = require('../vkapi')
const validator = require('../validator/posthunter.js')

const express = require('express')
const router  = express.Router()

const moment = require('moment');
require('moment/locale/ru');

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	comments = await db.comments.getUserComments(req.user.id, true);
	groups   = await db.posthunter.getByOwner(req.user.id); // Получаем все группы
	for (group of groups) {
		group.url = utils.urlparser.createPageURL(group.group_id);
	}

	res.render('posthunter', {user: req.user, comments, groups});
});

/**
 * Получаем запись постхантера по ID
 * @body id - id записи в постхантере
 */
router.get('/id', utils.needBodyParams(['id']), async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	const group = await db.posthunter.getById(req.body.id);
	if (!group) return res.send('Запись не найдена')
	if (group.owner_id != req.user.id) return res.send('Не хватает прав')

	group.url = utils.urlparser.createPageURL(group.group_id);
	res.send(group);
})


/**
 * Добавляем новую группу
 * @body name - название постхантера
 * @body url  - ссылка на группу
 * @body min_likes    - минимальное  количество лайков
 * @body max_likes    - максимальное количество лайков
 * @body min_comments - минимальное  количество комментариев
 * @body max_comments - максимальное количество комментариев
 * @body comments     - набор комментариев
 */
const add_params = ['name', 'url', 'min_likes', 'max_likes', 'min_comments', 'max_comments', 
                    'comments', 'entry_text', 'autostop', 'like_ads', 'like_repost', 'like_content',
                    'time_from', 'time_to']

router.post('/add', utils.needBodyParams(add_params), async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	validator.validate(req, res);
	// Если валидатор отправил сообщение об ошибке
	if (res.headersSent) return;


    const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9_]+)(\?.+)?/;
	const group_name = regex.exec(req.body.url)[3];

	const group_data = await vkapi.getTypeByName(group_name);
	if (!group_data.type) return res.send('Группа/Страница не найдена');
	if (group_data.type != 'group' && group_data.type != 'user') return res.send('Группа/Страница не найдена');

	// Добавляем минус, если это сообщество
	if (group_data.type == 'page' || group_data.type == 'group') {
		group_data.object_id = '-' + group_data.object_id;
	}

	const last_post_id = vkapi.wall.getLastPostId(group_data.object_id);

	db.posthunter.add(
		req.user.id,    // Владелец записи в постхантере
		req.body.name,  // Название записи в постхантере
		group_data.object_id, // ID группы/страницы
		last_post_id,   // ID последнего поста
		req.body.min_likes,    req.body.max_likes,    // Количество лайков
		req.body.min_comments, req.body.max_comments, // Количество комментов
		req.body.comments,           // ID наборов комментариев
		req.body.autostop,           // Останавливать ли накрутку после нахождения поста
		req.body.time_from, req.body.time_to, // Диапазон времени
		req.body.like_ads,     //
		req.body.like_repost,  // Какие посты лайкать (с меткой, с ссылкой, или контент)
		req.body.like_content, // 
		req.body.entry_text    // Текст, вхождение которого ищем
	);
	res.send('Ok');
})

const change_params = ['id', 'name', 'url', 'min_likes', 'max_likes', 'min_comments', 'max_comments', 
                       'comments', 'entry_text', 'autostop', 'like_ads', 'like_repost', 'like_content',
                       'time_from', 'time_to']

router.post('/change', utils.needBodyParams(change_params), async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	const group = await db.posthunter.getById(req.body.id);
	if (!group) return res.send('Запись не найдена')
	if (group.owner_id != req.user.id) return res.send('Не хватает прав')

	validator.validate(req, res);
	// Если валидатор отправил сообщение об ошибке
	if (res.headersSent) return;

	const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9_]+)(\?.+)?/;
	const group_name = regex.exec(req.body.url)[3];

	const group_data = await vkapi.getTypeByName(group_name);
	if (!group_data.type) return res.send('Группа/Страница не найдена');
	
	// Добавляем минус, если это сообщество
	if (group_data.type == 'page' || group_data.type == 'group') {
		group_data.object_id = '-' + group_data.object_id;
	}

	const last_post_id = await vkapi.wall.getLastPostId(group_data.object_id);

	db.posthunter.changeData(
		req.body.id,          // ID записи
		req.body.name,        // Название записи в постхантере
		group_data.object_id, // ID группы/страницы
		last_post_id,         // ID последнего поста
		req.body.min_likes,    req.body.max_likes,    // Количество лайков
		req.body.min_comments, req.body.max_comments, // Количество комментов
		req.body.comments.join(','), // ID наборов комментариев
		req.body.autostop,           // Останавливать ли накрутку после нахождения поста
		req.body.time_from, req.body.time_to, // Диапазон времени
		req.body.like_ads,     //
		req.body.like_repost,  // Какие посты лайкать (с меткой, с ссылкой, или контент)
		req.body.like_content, // 
		req.body.entry_text    // Текст, вхождение которого ищем
	)
	res.send('Success');
})

/**
 * Удаляем группу
 * @body group_id - ID группы
 */
router.post('/delete', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	// Проверка на то, что group_id - число
	if (parseInt(req.body.group_id) != req.body.group_id) return res.send('Неверный параметр group_id');

	// Проверка прав
	const group = await db.posthunter.getById(req.body.group_id);
	if (group.owner_id != req.user.id) {
		return res.send('Forbidden');
	}

	// Удаляем постхантер
	db.posthunter.delete(req.body.group_id);

	res.send('Ok');
})

/**
 * Обновляем статус
 */
router.post('/update_status', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	// Проверка на то, что id - число
	if (parseInt(req.body.id) != req.body.id) return res.send('Неверный параметр id');

	group = await db.posthunter.getById(req.body.id);
	
	// Проверка прав
	if (group.owner_id != req.user.id) {
		return res.send('Forbidden');
	}
	// Проверка корректности данных
	if (req.body.status != 'enable' && req.body.status != 'disable') {
		return res.send('Invalid data');
	}
	
	// При включении ПХ нужно обновить last_post_id
	if (req.body.status == 'enable') {
		// Проверяем что группа существует
		if (group.group_id.toString()[0] == '-') {
			var group_id = 'public' + group.group_id.toString().replace('-', '');
		}else {
			var group_id = 'id' + group.group_id.toString().replace('-', '');
		}
		const group_data = await vkapi.getTypeByName(group_id);
		if (!group_data.type) return res.send('Группа/Страница не найдена');

		const last_post_id = await vkapi.wall.getLastPostId(group.group_id);
		console.log(group.id, last_post_id);
		await db.posthunter.setLastPostId(group.id, last_post_id);
	}

	db.posthunter.setStatus(req.body.id, req.body.status);

	res.send('Success')
})

module.exports = router
