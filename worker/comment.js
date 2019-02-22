/**
 * @name /worker/comment.js
 * @description Функции для работы с добавлением комментариев
 */
const queue = require('./index.js').queue;
const logger = require('../logger.js')
const db = require('../db')
const vkapi = require('../vkapi')
const utils = require('../utils')

/**
 * Добавляем комментарий
 * @parallel 1
 * @param type - тип объекта, на что нужно ставить коммент
 * @param owner_id - владелец объекта
 * @param item_id  - id объекта
 * @param comments_ids - id набора комментов для накрутки
 * @param comment_need - количество накручевыемых комментов
 * @param task_id - id задачи в бд
 */
queue.process('comment', 1, async function(job, done){
	logger.info("Начала выполнятся задача на накрутку комментов")
	const data = job.data
	
	await db.tasks.setStatus(data.task_id, 'run')
	

    // Получаем все аккаунты
	const accounts = await db.vk.getActiveAccounts();
	// Получаем все комментарии
	const comments = await db.comments.getComments(data.comments_ids);

	// Счетчик ошибок, чтобы выйти из-за неотслеживаемой ошибки
	let errors = 0;

	for (now = 0; now < data.comment_need;) {
		// Выбираем случайные значения из массивов
		const message = comments.random()
		const account = accounts.random()

		// Пытаемся добавить комментарий
		const response = await vkapi.createComment(data.type, data.owner_id, data.item_id, message, account);

		// Если лайк успешно поставлен
		if (response.response) {
			now++; // Увеличиваем количество поставленных комментов
			db.tasks.inrement(data.task_id);
			logger.debug('Добавлен комментарий')
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
			case 213:
				logger.warn('Нет доступа к комментированию записи', {json: response.error})
				utils.task.onError(data.task_id)
				return done();

			// Fatal Error - прекращаем выполнение накрутки
			case 223:
				logger.warn('Превышен лимит комментариев на стене', {json: response.error})
				utils.task.onError(data.task_id)
				return done();

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

	db.tasks.setStatus(data.task_id, 'finish')
	logger.info('Задача ' + data.task_id + ' выполнена')
	done();
});