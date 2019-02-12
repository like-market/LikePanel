/**
 * @name /worker/like.js
 * @description Функции для работы с установкой лайков
 */
var queue = require('./index.js').queue;
var logger = require('../logger.js')
var db = require('../db')
var vkapi = require('../vkapi')

/**
 * Ставим лайк
 *
 * Алгоритм
 *
 * @parallel 1
 * @job params {user_id, owner_id, item_id, type, like_need, task_id}
 */
queue.process('like', async function(job, done){
	const data = job.data

    // Получаем все аккаунты
	all_accounts = await db.vk.getActiveAccounts();

	// Аккаунты, которые еще не поставили лайки
	accounts = [];

	// Получаем аккаунты, которые уже поставили лайки
	already_set = await vkapi.getLikeList(data.type, data.owner_id, data.item_id);
	already_set = already_set.response.items;

	for (let account of all_accounts) {
		// Если аккаунт не поставил лайк, добавляем его в массив аккаунтов
		if (already_set.indexOf(account.user_id) == -1) {
			accounts.push(account);
		} else {
			console.log('Аккаунт уже поставил лайк : ' + account.user_id )
		}
	}

	var like_now = 0;

	// Для всех аккаунтов
	for (let account of accounts) {
		// Пытаемся поставить лайк
		const response = await vkapi.addLike(data.type, data.owner_id, data.item_id, account);

		if (response.error && response.error.error_code == 17) {
			logger.warn('Требуется валидация пользователя')
			logger.warn('URL: ' + response.error.redirect_uri)
			db.vk.setAccountStatus(account.user_id, 'need_token')
			continue
		}
		if (response.error) {
			logger.error('Неизвестная ошибка')
			console.log(response.error)
		}
			/*msg = result.error.error_msg
			console.log(result.error)
			if (msg.indexOf('User authorization failed: invalid session.')) {
				db.vk.setAccountStatus(account.user_id, 'need_token')
				logger.error('Невалидная сессия у акк:' + account.user_id)
			}else if (msg.indexOf('User authorization failed: invalid access_token (2).')) {
				db.vk.setAccountStatus(account.user_id, 'need_token')
				logger.error('Невалидный токен у акк: ' + account.user_id)
			}else {
				logger.error('Неизвестная ошибка')
				logger.error(msg);
			}
			continue;
		}*/

		// Если лайк успешно поставлен
		if (response.response) {
			like_now++; // Увеличиваем кол-во лайков
			db.tasks.inrementLikes(data.task_id);
			logger.debug('Поставлен лайк')
		}else {
			logger.warn('Странный результат')
			console.log(response)
		}

		if (like_now == data.like_need) {
			db.tasks.setFinish(data.task_id)
			logger.info('Задача ' + data.task_id + ' выполнена')
			return done();
		}
	}

	logger.error('Не получается завершить задачу ' + data.task_id)
	db.tasks.setWait(data.task_id)
	done()
});