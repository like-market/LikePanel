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

			let likes_count = utils.randInt(group.min_likes, group.max_likes);
			if (likes_count > accountsCount) likes_count = accountsCount;

			let comments_count = utils.randInt(group.min_comments, group.max_comments);

			// Проверка баланса
			const user = await db.users.findById(group.owner_id);
			const price = likes_count * user.like_price + comments_count * user.comment_price;
			
			if (user.balance < price) {
				db.posthunter.setStatus(group.id, 'disable');
				logger.info('Постхантер отключен для id=' + group.id + ': недостаточно средств')
				db.posthunter.setLastPostId(group.id, max_post_id);
				continue nextgroup;
			}

			if (comments_count != 0) {
				await utils.task.addComments(
					user,
					'post',
					`Постхантер "${group.name}" ${comments_count} комментов`,
					group.group_id,
					post.id,
					group.comments_ids.split(','),
					comments_count
				);
			}
			await utils.task.addLikes(
				user,
				`Постхантер "${group.name}" ${likes_count} лайков`,
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

