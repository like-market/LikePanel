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

	for (group of groups) {
		worker.queue.create('posthunter', { group, accountsCount, customAccountsCount }).removeOnComplete(true).save();
	}
	logger.info('Задачи для постхантера добавлены в очередь')
}

/**
 * Содержит ли пост скрытую рекламу
 * @param post - объект поста
 */
exports.isHideAds = function(post) {
	// Если это репост
	if (post.copy_history) return true;
	
	// Если прикреплена ссылка
	if (post.attachments) {
		for (attachment of attachments) {
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