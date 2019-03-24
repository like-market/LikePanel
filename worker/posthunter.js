/**
 * @name /worker/posthunter.js
 * @description Функции для работы с постхантером
 */
const queue = require('./index.js').queue;
const logger = require('../logger.js')
const db = require('../db')
const vkapi = require('../vkapi')
const utils = require('../utils')

/**
 * Проверяем группу на наличие новых постов
 *
 * @parallel 5
 *
 * @param 
 */
queue.process('posthunter', 1, async function(job, done) {
	const group = job.data.group;
	const accountsCount       = job.data.accountsCount;
	const customAccountsCount = job.data.customAccountsCount;

	// Получаем рандомный активный аккаунт
	let account = await db.vk.getRandomAccount()
	
	let response = await vkapi.wall.getNewPosts(group.group_id, group.last_post_id, account);

	if (response.error) {
		switch (response.error.error_code) {
			case 5:
				logger.warn(`Невалидная сессия у + ${account.user_id}`, {json: response.error})
				db.vk.setAccountStatus(account.user_id, 'need_token')
				
				// Создаем еще такую же задачу
				queue.create('posthunter', { group, accountsCount, customAccountsCount }).removeOnComplete(true).save();
				return done();

			default:
				logger.warn('Неизвестная ошибка', {json: response})
				return done();
		}
	}

	let data = response.response;
	// Проверяем появилась ли новая запись
	// Если не появились новые посты
	if (!data.posts.length) return done();


	if (data.last_post_id > group.last_post_id) {
		db.posthunter.setLastPostId(group.id, data.last_post_id)
	}

	// Для всех новых постов
	for (post of data.posts) {
		console.log('Получили новый пост')
		// Проверка на время
		const date = new Date();
		date.setTime(post.date * 1000);

		var post_time = `${date.getFullHours()}:${date.getFullMinutes()}`;
		// Сравниваем время вида HH:MM 
		if (group.time_from > post_time || group.time_to < post_time) continue;


		// Проверка на вхождение текста
		if (post.text.indexOf(group.entry_text) == -1) continue;


		const is_ads = post.marked_as_ads;   // Рекламный ли пост с меткой
		const is_hide_ads = utils.posthunter.isHideAds(post); // Рекламный пост без метки
		const is_content  = (!is_ads && !is_hide_ads) // Пост является контентом

		// Если пост с рекламной меткой и его не нужно лайкать
		if (is_ads      && !group.like_ads)    continue;
		// Если пост со скрытой рекламой, а его не нужно лайкать
		if (is_hide_ads && !group.like_repost) continue
		// Если пост является контентом, а его не нужно лайкать
		if (is_content  && !group.like_content) continue;

	
		// Проверка комментариев
		let use_custom = 0
		const comments = group.comments_ids.split(',')
		const comments_data = await db.comments.getCommentsData(comments);
		if (comments_data.length != comments.length) {
			logger.error('Один из наборов комментариев не найден')
			continue;
		}

    	// Может ли пользователь использовать выбранные наборы
    	for (let comment of comments_data) {
	    	if (comment.owner_id != 0 && comment.owner_id != group.owner_id) {
	    		db.posthunter.setStatus(group.id, 'disable');
	    		logger.error('Нет доступа к одному из наборов комментариев')
	    		return done();
	    	}
	    	if (comment.status != 'accept') {
	    		db.posthunter.setStatus(group.id, 'disable');
	    		logger.error('Один из наборов комментариев не активен')
	    		return done();
	    	}
	    	// Проверка на то, что используются пользовательские наборы
	    	if (comment.owner_id != 0) use_custom = true;
		}

		// Случайное количество лайков
		let likes_count = utils.randInt(group.min_likes, group.max_likes);
		if (likes_count > accountsCount) likes_count = accountsCount;

		let comments_count = utils.randInt(group.min_comments, group.max_comments);
		// Проверяем максимальное количество комментариев
		if (use_custom && comments_count > customAccountsCount * 3) {
			comments_count = customAccountsCount * 3;
		}
		if (!use_custom && comments_count > accountsCount * 3) {
			comments_count = accountsCount * 3;
		}

		// Проверка баланса
		const user  = await db.users.findById(group.owner_id);
		const price = likes_count * user.like_price + comments_count * user.comment_price;
		
		if (user.balance < price) {
			db.posthunter.setStatus(group.id, 'disable');
			logger.info('Постхантер отключен для id=' + group.id + ': недостаточно средств')
			return done();
		}

		if (comments_count != 0) {
			await utils.task.addComments(
				user,
				'post',
				`[Хантер] ${group.name}`,
				group.group_id,
				post.id,
				comments,
				comments_count,
				use_custom
			);
		}
		if (likes_count != 0) {
			await utils.task.addLikes(
				user,
				`[Хантер] ${group.name}`,
				group.group_id,
				'post',
				post.id,
				likes_count
			);
		}

		if (group.autostop) {
			db.posthunter.setStatus(group.id, 'pause');
			return done();
		}
	}
})