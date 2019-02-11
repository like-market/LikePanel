/**
 * @name /worker/comment.js
 * @description Функции для работы с добавлением комментариев
 */
var queue = require('./index.js').queue;
var logger = require('../logger.js')
var db = require('../db')
var vkapi = require('../vkapi')

/**
 * Добавляем комментарий
 * @parallel 1
 * @param type - тип объекта, на что нужно ставить коммент (пока только 'post')
 * @param owner_id - владелец объекта
 * @param item_id  - id объекта
 * @param comments_ids - id набора комментов для накрутки
 * @param comments_count - количество накручевыемых комментов
 * @param task_id - id задачи в бд
 */
queue.process('comment', 1, async function(job, done){
	logger.info("Начала выполнятся задача на накрутку комментов")
	const data = job.data

    // Получаем все аккаунты
	const accounts = await db.vk.getActiveAccounts();
	// Получаем все комментарии
	const comments = await db.comments.getComments(data.comments_ids);

	for (now = 0; now < data.comment_need;) {
		// Выбираем случайные значения из массивов
		var message = comments.random()
		var account = accounts.random()


		// Пытаемся добавить комментарий
		const response = await vkapi.createComment(data.type, data.owner_id, data.item_id, message, account);

		// Проверяем ошибки
		if (response.error && response.error.error_code == 17) {
			logger.warn('Требуется валидация пользователя')
			logger.warn('URL: ' + response.error.redirect_uri)
			db.vk.setAccountStatus(account.user_id, 'need_token')
			continue
		}
		if (response.error && response.error.error_code == 10) {
			logger.warn('Внутренняя ошибка сервера')
			console.log(response);
			console.log(response.error.request_params)
			continue
		}
		if (response.error && response.error.error_code == 5) {
			logger.warn('Невалидная сессия у ' + account.user_id)
			db.vk.setAccountStatus(account.user_id, 'need_token')
			continue
		}
		if (response.error) {
			logger.error('Неизвестная ошибка')
			console.log(response.error)
			continue;
		}
		
		// Если лайк успешно поставлен
		if (response.response) {
			now++; // Увеличиваем количество поставленных комментов
			db.tasks.inrementLikes(data.task_id);
			logger.debug('Добавлен комментарий')
		}else {
			logger.warn('Странный результат')
			console.log(response)
			continue;
		}
	}


	db.tasks.setFinish(data.task_id)
	logger.info('Задача ' + data.task_id + ' выполнена')
	done();
});