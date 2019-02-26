const db = require('../db');
const logger = require('../logger.js')
const worker = require('../worker');
const vkapi  = require('../vkapi');
const utils = require('../utils')

/**
 * Получаем информацию о новых постах во всех активных группах
 */
exports.updateAll = async function () {
	const groups = await db.posthunter.getEnabled();

nextgroup:
	for (group of groups) {
		// Проверяем появилась ли новая запись
		var posts = await vkapi.getWall(group.group_id, 1);

		let new_post_id;
		if (posts.response.items.length == 0) new_post_id = 0;
		else new_post_id = posts.response.items[0].id;

		if (new_post_id <= group.last_post_id) continue;
		// Получаем количество доступных аккаунтов
		accountsCount = await db.vk.getActiveAccountsCount();
		accountsCount = Math.floor(accountsCount * 0.9);

		// Получаем больше записей
		var posts = await vkapi.getWall(group.group_id, 10);
		var max_post_id = group.last_post_id;
		for (post of posts.response.items) {
			// Если на этот пост мы уже ставили лайки
			if (post.id <= group.last_post_id) continue;

			var likes_count = utils.randInt(group.min_likes, group.max_likes);
			if (likes_count > accountsCount) likes_count = accountsCount;

			var comments_count = utils.randInt(group.min_comments, group.max_comments);
			if (comments_count > accountsCount * 4) comments_count = accountsCount * 4;

			// Проверка на наличие баланса
			var balance = db.finance.getBalance(group.owner_id);
			if (balance < (likes_count * 10 + comments_count * 10)) {
				db.posthunter.setStatus(group.id, 'disable');
				logger.info('Постхантер отключен для id=' + group.id + ': недостаточно средств')
				db.posthunter.setLastPostId(group.id, max_post_id);
				continue nextgroup;
			}


			if (comments_count != 0) {
				await utils.task.addComments(
					group.owner_id,
					'post',
					'Постхантер ' + group.group_id,
					group.group_id,
					post.id,
					group.comments_ids.split(','),
					comments_count
				);
			}
			await utils.task.addLikes(
				group.owner_id,
				'Постхантер ' + group.group_id,
				group.group_id,
				'post',
				post.id,
				likes_count
			);

			if (max_post_id < post.id) max_post_id = post.id;
		}
		db.posthunter.setLastPostId(group.id, max_post_id);
	}
	logger.info('Постхантер обновлен')
}

