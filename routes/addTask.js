const logger = require('../logger.js')
const db = require('../db');
const vkapi = require('../vkapi')
const utils = require('../utils');
const lang = utils.lang;

const express = require('express')
const router  = express.Router()

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
	// maxLikeCount = Math.floor(req.user.balance / req.user.like_price);
	// if (maxLikeCount > accountsCount) maxLikeCount = accountsCount;
	// Кратно 25
 	maxLikeCount = accountsCount - (accountsCount % 25)

	// maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
	// if (maxCommentCount > 3500) maxCommentCount = 3500;
	maxCommentCount = 3500;

	// Максимальное количество комментариев по балансу
	// maxCustomCommentCount = Math.floor(req.user.balance / req.user.comment_price);
	// if (maxCustomCommentCount > customAccountCount * 3) maxCustomCommentCount = customAccountCount * 3;
	maxCustomCommentCount = customAccountCount * 3 - (customAccountCount * 3 % 25)

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
 * Добавление задачи на накрутку комментариев
 *
 * @body url           - url записи
 * @body like_count    - количество лайков для накрутки
 * @body comment_count - колличество комментариев для накрутки
 * @body comments      - массив из id наборов комментариев, например  [ '1', '2' ]
 */
const params = ['url', 'like_count', 'comment_count', 'comments']

router.post('/add', utils.needBodyParams(params), async(req, res) => {
	if (!req.isAuthenticated()) return res.redirect('/login');

    const data = utils.urlparser.parseURL(req.body.url)
    if (data == null) return res.send("Ошибка в URL");

	// Получаем все доступные действия для объекта
	const object = await vkapi.getAvailableActions(data.type, data.owner_id, data.item_id);
	if (!object.found) return res.send(`Не удалось найти ${lang(data.type).toLowerCase()}`)

    const accountsCount = await db.vk.getActiveAccountsCount();

	// Проверка количества лайков
    const like_need = parseInt(req.body.like_count);
    if (like_need) {
    	if (!object.can_like) return res.send(`${lang(data.type)} нельзя лайкать`)

    	maxLikeCount = Math.floor(req.user.balance / req.user.like_price);
		if (maxLikeCount > accountsCount) maxLikeCount = accountsCount;
    	
    	if (like_need < minLikeCount) return res.send(`Вы можете заказать минимум ${minLikeCount} лайков`)
    	if (like_need > maxLikeCount) return res.send(`Вы можете заказать максимум ${maxLikeCount} лайков`)
	}

	// Проверка количуства комментов 
	const comment_need = parseInt(req.body.comment_count);
	const comments = req.body.comments;
	let use_custom = false; // Используются ли пользовательские комментарии
	if (comment_need) {
		if (!object.can_comment) return res.send(`${lang(data.type)} нельзя комментировать`)

		if (!Array.isArray(comments))       return res.send('Нужно добавить хотя бы один набор комментариев')
		if (!comments.length)               return res.send('Нужно добавить хотя бы один набор комментариев')
		if (!comments.includeOnlyNumbers()) return res.send('Один из наборов комментариев не найден')

		// Получение данных о наборах
		const comments_data = await db.comments.getCommentsData(req.body.comments);
		if (comments_data.length != comments.length) return res.send('Один из наборов комментариев не найден')

    	// Может ли пользователь использовать выбранные наборы
    	for (comment_data of comments_data) {
	    	if (comment_data.owner_id != 0 && comment_data.owner_id != req.user.id) {
	    		return res.send('Нет доступа к одному из наборов комментариев')
	    	}
	    	if (comment_data.status != 'accept') {
	    		return res.send('Один из наборов комментариев не активен')
	    	}
	    	// Проверка на то, что используются пользовательские наборы
	    	if (comment_data.owner_id != 0) use_custom = true;
    	}

    	if (use_custom) {
			// Получаем количество доступных аккаунтов для клиентских наборов
			customAccountCount = await db.vk.getActiveAccountsCount(1);
			var maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
			if (maxCommentCount > customAccountCount * 3) maxCommentCount = customAccountCount * 3;
    		if (maxCommentCount > 3500) maxCommentCount = 3500;
    	}else {
			var maxCommentCount = Math.floor(req.user.balance / req.user.comment_price);
			if (maxCommentCount > 3500) maxCommentCount = 3500;    
    	}

    	if (comment_need < minCommentCount) return res.send(`Вы можете заказать минимум ${minCommentCount} комментариев`)
    	if (comment_need > maxCommentCount) return res.send(`Вы можете заказать максимум ${maxCommentCount} комментариев`)
    }

    if (!like_need && !comment_need) {
        return res.send('Необходимо ввести количество лайков и/или комментариев')
    }

    // Проверяем то, что эта группа не верицированна
    let [error, group_info] = await vkapi.group.getGroupInfo(data.owner_id);
    // if (error) return res.send('Что-то пошло не так. Попробуйте еще раз');
    if (group_info.verified) return res.send('Нельзя накручивать на данную запись.')
    if (group_info.members_count < 10000) return res.send('В группе должно быть минимум 10\'000 участников')

    // Проверка на то что группа не в блеклисте
	const inBlackList = await db.block.isBlocked(data.owner_id);
	if (inBlackList) return res.send('Нельзя накручивать на данную запись!')

	//
    // На этом этапе проверены все переменные
	//
	// Проверяем общую стоимость
	const price = like_need * req.user.like_price + comment_need * req.user.comment_price;
	if (price > req.user.balance) return res.send('Недостаточно средств')

	// Создаем задачи
	if (comment_need) {
		utils.task.addComments(
			req.user,            // Объект пользователя, создающего задачу
			data.type,           // Тип записи [post, photo, video, market]
			'',                  // Название задачи
			data.owner_id,       // Владелец записи
			data.item_id,        // ID записи
			comments,            // Список Id наборов комментариев
			comment_need,        // Количество комментариев для накрутки
			use_custom           // Используются ли клиентские наборы комментариев
		);
	}
	if (like_need) {
		utils.task.addLikes(
			req.user,            // Объект пользователя, создающего задачу
			'',                  // Название задачи
			data.owner_id,       // Владелец записи
			data.type,           // Тип записи [post, photo, video, market]
			data.item_id,        // ID записи
			like_need            // Количество лайков для накрутки
		);
	}

	res.send('Success')
})

module.exports = router