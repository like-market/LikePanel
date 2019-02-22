/**
 * @name /worker/like.js
 * @description Функции для работы с установкой лайков
 */
const queue = require('./index.js').queue;
const logger = require('../logger.js')
const db = require('../db')
const vkapi = require('../vkapi')
const utils = require('../utils')

/**
 * Ставим лайк
 * @parallel 1
 * @param type - тип объекта, на что нужно ставить лайк
 * @param owner_id - владелец объекта
 * @param item_id  - id объекта
 * @param like_need - количество накручевыемых комментов
 * @param task_id   - id задачи в бд
 * @job params {user_id, owner_id, item_id, type, like_need, task_id}
 */
queue.process('like', async function(job, done){
	logger.info("Начала выполнятся задача на накрутку лайков")
	const data = job.data
	
	await db.tasks.setStatus(data.task_id, 'run')

    // Получаем все аккаунты
	const all_accounts = await db.vk.getActiveAccounts();

	// Аккаунты, которые еще не поставили лайки
	let accounts = [];

	// Получаем аккаунты, которые уже поставили лайки
	let already_set = await vkapi.getLikeList(data.type, data.owner_id, data.item_id);
	already_set = already_set.response.items;

	for (let account of all_accounts) {
		// Если аккаунт не поставил лайк, добавляем его в массив аккаунтов
		if (already_set.indexOf(account.user_id) == -1) {
			accounts.push(account);
		} else {
			logger.debug(`Аккаунт уже поставил лайк: ${account.user_id}`)
		}
	}

	// Счетчик ошибок, чтобы выйти из-за неотслеживаемой ошибки
	let errors = 0;

	let like_now = 0;

	// Для всех аккаунтов
	for (let account of accounts) {
		// Проверка на завершение задачи
		if (like_now >= data.like_need) {
			db.tasks.setStatus(data.task_id, 'finish')
			logger.info('Задача ' + data.task_id + ' выполнена')
			return done();
		}

		// Пытаемся поставить лайк
		const response = await vkapi.addLike(data.type, data.owner_id, data.item_id, account);


		// Если лайк успешно поставлен
		if (response.response) {
			like_now++; // Увеличиваем количество поставленных комментов
			db.tasks.inrement(data.task_id);
			logger.debug('Поставлен лайк')
			continue;
		}

		switch (response.error.error_code) {
			case 17:
				logger.warn('Требуется валидация пользователя', {json: response.error});
				db.vk.setAccountStatus(account.user_id, 'need_token')
				break;

			case 5:
				logger.warn(`Невалидная сессия у + ${account.user_id}`, {json: response.error})
				db.vk.setAccountStatus(account.user_id, 'need_token')
				break;

			case 6:
				logger.warn('Слишком много запросов в секунду')
				await utils.sleep(1000)
				break;

			// Fatal Error - прекращаем выполнение накрутки
			case 30:
				logger.warn(`Профиль приватный`, {json: response.error})
				db.vk.setAccountStatus(account.user_id, 'need_token')
				break;

			// Strange Error - прекращаем выполнения накрутки	
			case 100:
				logger.warn(`Один из параметров не верный`, {json: response.error})
				// Если запись была удалена
				if (response.error.error_msg == "One of the parameters specified was missing or invalid: object not found") {
					utils.task.onError(data.task_id)
					return done();
				}
				errors++;
				break;

			// Strange Error - лимит на количиство ошибок
			case 10:
				logger.warn('Внутренняя ошибка сервера', {json: response.error});
				// Если запись была удалена
				if (response.error.error_msg == "Internal server error: parent deleted") {
					utils.task.onError(data.task_id)
					return done();
				}
				errors++;
				break;

			// Strange Error - лимит на количиство ошибок
			default:
				logger.warn('Неизвестная ошибка', {json: response})
				errors++;
		}

		if (errors > 20) {
			utils.task.onError(data.task_id)
			return done();
		}
	}

	utils.task.onError(data.task_id)
	done()
});