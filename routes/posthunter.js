const logger = require('../logger.js')
const db = require('../db');
const utils = require('../utils');
const vkapi = require('../vkapi')
const validator = require('../validator/posthunter.js')

const express = require('express')
const router  = express.Router()

const moment = require('moment');
require('moment/locale/ru');


const minLikeCount = 50;
const minCommentCount = 50;


router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	// Получаем количество всех доступных аккаунтов
	accountsCount = await db.vk.getActiveAccountsCount();
	accountsCount = Math.floor(accountsCount * 0.9);

	// Получаем количество доступных аккаунтов для клиентских наборов
	сustomAccountCount = await db.vk.getActiveAccountsCount(1); // Группа аккаунтов равна 1
	customAccountCount = Math.floor(сustomAccountCount * 0.9);
	
 	maxLikeCount = accountsCount - (accountsCount % 25)
	maxCommentCount = 3500;
	maxCustomCommentCount = customAccountCount * 3 - (customAccountCount * 3 % 25)

	comments = await db.comments.getUserComments(req.user.id, true);
	groups   = await db.posthunter.getByOwner(req.user.id); // Получаем все группы
	for (group of groups) {
		group.url = utils.urlparser.createPageURL(group.group_id);
	}

	if (['dnoarta', 'z74enkf3', 'jrbdex'].indexOf(req.user.username) != -1) {
		maxCommentCount = 35300;
		maxCustomCommentCount = 27050
		maxLikeCount = 9750;
	}

	res.render('posthunter', {
		user: req.user,
		comments,
		groups,
		minLikeCount,
		maxLikeCount,
		minCommentCount,
		maxCommentCount,
		maxCustomCommentCount
	});
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


    const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9_.]+)(\?.+)?/;
	const group_name = regex.exec(req.body.url)[3];

	const group_data = await vkapi.getTypeByName(group_name);
	console.log(group_data);
	if (!group_data.type || ['group', 'page'].indexOf(group_data.type) == -1) return res.send('Группа не найдена');

	// Проверка на то что группа не в блеклисте
	const inBlackList = await db.block.isBlocked(group_data.object_id);
	if (inBlackList) {
		logger.warn(`${req.user.username} пытается накрутить в группу блек листа ${group_data.object_id}`);
		return res.send('Нельзя накручивать в данной группе')
	}


    // Проверяем то, что эта группа не верицированна
    let [error, group_info] = await vkapi.group.getGroupInfo(group_data.object_id);
    console.log(group_info)
    // if (error) return res.send('Что-то пошло не так. Попробуйте еще раз');
    if (group_info.verified) {
    	logger.warn(`${req.user.username} пытается накрутить в верефицированную группу ${group_data.object_id}`);
    	return res.send('Нельзя накручивать в данной группе.')
    }
    if (group_info.members_count < 10000) {
    	logger.warn(`${req.user.username} пытается накрутить в группу с менее 10'000 участников ${group_data.object_id}`);
    	return res.send('В группе должно быть минимум 10\'000 участников')
 	}
    if (group_info.name.toLowerCase().search(/бизнес|cpa|арбитраж|миллионер|блог/) != -1) {
    	logger.warn(`${req.user.username} пытается накрутить в группу, с запрещенными словами в названии ${group_data.object_id}`);
    	return res.send('Нельзя накручивать в данной группе!')
    }

	// Добавляем минус, если это сообщество
	if (group_data.type == 'page' || group_data.type == 'group') {
		group_data.object_id = '-' + group_data.object_id;
	}

	let last_post_id = await vkapi.wall.getLastPostId(group_data.object_id);

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
	res.send('Success');
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

	const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9_.]+)(\?.+)?/;
	const group_name = regex.exec(req.body.url)[3];

	const group_data = await vkapi.getTypeByName(group_name);
	if (!group_data.type || ['group', 'page'].indexOf(group_data.type) == -1) return res.send('Группа не найдена');
	
	// Проверка на то что группа не в блеклисте
	const inBlackList = await db.block.isBlocked(group_data.object_id);	if (inBlackList) {
		logger.warn(`${req.user.username} пытается создать ПХ в группу блек листа ${group_data.object_id}`);
		return res.send('Нельзя накручивать в данной группе')
	}

	// Проверяем то, что эта группа не верицированна
    let [error, group_info] = await vkapi.group.getGroupInfo(group_data.object_id);
    console.log(group_info)
    // if (error) return res.send('Что-то пошло не так. Попробуйте еще раз');
    if (group_info.verified) {
    	logger.warn(`${req.user.username} пытается создать ПХ в верефицированную группу ${group_data.object_id}`);
    	return res.send('Нельзя накручивать в данной группе.')
    }
    if (group_info.members_count < 10000) {
    	logger.warn(`${req.user.username} пытается создать ПХ в группу с менее 10'000 участников ${group_data.object_id}`);
    	return res.send('В группе должно быть минимум 10\'000 участников')
 	}
    if (group_info.name.toLowerCase().search(/бизнес|cpa|арбитраж|миллионер|блог/) != -1) {
    	logger.warn(`${req.user.username} пытается создать ПХ в группу, с запрещенными словами в названии ${group_data.object_id}`);
    	return res.send('Нельзя накручивать в данной группе!')
    }

	// Добавляем минус, если это сообщество
	if (group_data.type == 'page' || group_data.type == 'group') {
		group_data.object_id = '-' + group_data.object_id;
	}

	const last_post_id = await vkapi.wall.getLastPostId(group_data.object_id);

	db.posthunter.setLastUpdateTime(req.body.id, (new Date).toMySQL());
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

		await db.posthunter.setLastPostId(group.id, last_post_id);
	}

	db.posthunter.setLastUpdateTime(req.body.id, (new Date).toMySQL());
	db.posthunter.setStatus(req.body.id, req.body.status);

	res.send('Success')
})

module.exports = router
