const db = require('../db');
const logger = require('../logger.js')
const worker = require('../worker');
const vkapi  = require('../vkapi');
const utils = require('../utils')

/**
 * Получаем информацию о новых постах во всех активных группах
 */
exports.updateAll = async function () {
	// Получаем список включеных постхантеров
	const groups = await db.posthunter.getEnabled();

	// Получаем количество доступных аккаунтов
	let accountsCount = await db.vk.getActiveAccountsCount();
	accountsCount = Math.floor(accountsCount * 0.9);

	let customAccountsCount = await db.vk.getActiveAccountsCount(1);
	customAccountsCount = Math.floor(customAccountsCount * 0.9);

	const date_now = (new Date()).getTime();
	for (let group of groups) {
		// Проверка то, что последний найденный пост был 2 дня назад
		const post_date = (new Date(group.last_update)).getTime();
		if (date_now - post_date > 172800000) { // 1000 * 60 * 60 * 24 * 2 == 172800000
			logger.warn(`У постхантера ${group.id} закончилось время активности`);
			db.posthunter.setStatus(group.id, 'pause');
		}else {
			logger.info(`Создали задачу для постхантера для ${group.group_id}`)
			worker.queue.create('posthunter', { group, accountsCount, customAccountsCount }).removeOnComplete(true).save();
		}
	}
	logger.info('Постхантер обновлен')
}

/**
 * Содержит ли пост скрытую рекламу
 * @param post - объект поста
 */
exports.isHideAds = function(post) {
	console.log(post);
	// Если это репост
	if (post.copy_history) return true;
	
	// Если прикреплена ссылка
	if (post.attachments) {
		for (let attachment of post.attachments) {
			if (attachment.type == 'link') return true;
		}
	}

	// Если текст содержит ссылку вида domain.ru
	let regex = /(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+/gm
	if (regex.test(post.text)) return true;

	// Если текст содержит ссылку вида [id1|тест]
	regex = /\[.*|.*\]/gm
	if (regex.test(post.text)) return true;

	return false;
}