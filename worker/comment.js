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
 * Объект с выполняющимися задачами
 * Нужно чтобы получать доступ из асинхронных функций
 * @key   - id задачи
 * @value - данные задачи
 *     now_add - количество успешно поставленных комментариев
 *     async_count - количество асинхронных функций, в которых производится запрос к апи
 *     error_count - количество ошибок
 *     fatal_error - флаг фатальной ошибки
 */
let tasks = require('./index.js').tasks;

/**
 * Выполняем запрос к апи и обрабатываем ошибки
 * При начале выполнения запроса увеличиваем счетчик async_count
 * После выполнения запроса и обработки результата - уменьшаем счетчик async_count
 *
 * При возникновении критической ошибки устанавливаем флаг fatal_error
 * При обычной ошибки - увеличиваем счетчик error_count
 *
 * @param task_id - ID задания
 * @param message - комментарий для накрутки
 * @param account - аккаунт
 */
const createRequest = async function(task_id, message, account) {
	tasks[task_id].now_add++;
	tasks[task_id].async_count++;

	// Пытаемся добавить комментарий
	const response = await vkapi.createComment(tasks[task_id].type, tasks[task_id].owner_id, tasks[task_id].item_id, message, account);

	// Если коммент успешно добавлен
	if (response.response) {
		// db.tasks.inrement(task_id);
		logger.debug(`Добавлен комментарий: ${response.response.comment_id}`)

		tasks[task_id].async_count--;
		return;
	}

	// Уменьшаем количество успешно поставленных комментариев на один
	// Так как при вызове асинхронной функции мы предположили, что комментарий поставится
	tasks[task_id].now_add--;

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
		    break;

		// Fatal Error - прекращаем выполнение накрутки
		case 213:
			logger.warn('Нет доступа к комментированию записи', {json: response.error})
			tasks[task_id].fatal_error = true;
			break;

		// Fatal Error - прекращаем выполнение накрутки
		case 223:
			logger.warn('Превышен лимит комментариев на стене', {json: response.error})
			tasks[task_id].fatal_error = true;
			break;

		// Strange Error - прекращаем выполнения накрутки	
		case 100:
			logger.warn(`Один из параметров не верный`, {json: response.error})
			// Если запись была удалена
			if (response.error.error_msg == "One of the parameters specified was missing or invalid: object not found") {
				tasks[task_id].Fatall_error = true;
			}else {
				tasks[task_id].error_count++;
			}
			break;

		// Strange Error - лимит на количиство ошибок
		case 10:
			logger.warn('Внутренняя ошибка сервера', {json: response.error});
			// Если запись была удалена
			if (response.error.error_msg == "Internal server error: parent deleted") {
				tasks[task_id].fatal_error = true;
			}else {
				tasks[task_id].error_count++;
			}
			break;

		// Strange Error - лимит на количиство ошибок
		default:
			logger.warn('Неизвестная ошибка', {json: response})
			tasks[task_id].error_count++;
	}

	tasks[task_id].async_count--;
}



/**
 * Воркер, в котором добавляем комментарии
 * @parallel 1
 *
 * @param task_id - id задачи в бд
 */
queue.process('comment', 2, async function(job, done){
	const task_id = job.data.task_id
	tasks[task_id] = job.data.task_data;
	logger.info(`Начала выполнятся задача ${task_id} на накрутку комментов`)

	
	await db.tasks.setStatus(task_id, 'run')
	
	tasks[task_id]['now_add'] = 0;         // Комментариев поставлено
	tasks[task_id]['async_count'] = 0;     // Текущее количество асинхронных запросов
	tasks[task_id]['error_count'] = 0;     // Количество ошибок
	tasks[task_id]['fatal_error'] = false; // Флаг фатальной ошибки (прекращения накрутки)

    // Получаем все аккаунты
	const accounts = await db.vk.getActiveAccounts();
	// Получаем все комментарии
	const comments = await db.comments.getComments(tasks[task_id].comments_ids);

	let timerID; // ID таймера

	// Функция, которая проверяет количество асинхронных задач
	// И добавляет новые, если есть свободные места
	const addRequests = async function() {
		// Синхронный режим (когда осталось накрутить мало комментов)
		if (tasks[task_id].comment_need - tasks[task_id].now_add < 50) {
			if (timerID != -1) {
				clearInterval(timerID)
				timerID = -1;
			}
			while (tasks[task_id].comment_need > tasks[task_id].now_add) {
				// Выбираем случайные значения из массивов
				const message = comments.random()
				const account = accounts.random()

				// Создаем синхронный запрос
				await createRequest(task_id, message, account);

				db.tasks.updateCount(task_id, tasks[task_id].now_add);

				// Если в асинхронных функция произошла фатальная ошибки
				if (tasks[task_id].fatal_error || tasks[task_id].error_count > 50) {
					utils.task.onError(task_id);
					return done();
				}

				// Проверка на то, что все комменты поставлены
				if (tasks[task_id].comment_need == tasks[task_id].now_add) {
					utils.task.onSuccess(task_id);
					return done();
				}
			}
			// Как мы сюда попали - это уже отдельная история...
			utils.task.onSuccess(task_id);
			return done();
		// Асинхронный режим
		}else {
			db.tasks.updateCount(task_id, tasks[task_id].now_add);

			// Создаем асинхронные запросы
			while (tasks[task_id].async_count < 50) {
				// Выбираем случайные значения из массивов
				const message = comments.random()
				const account = accounts.random()

				createRequest(task_id, message, account);
			}
			// Если в асинхронных функция произошла фатальная ошибки
			if (tasks[task_id].fatal_error || tasks[task_id].error_count > 20) {
				clearInterval(timerID)
				utils.task.onError(task_id);
				done();
			}
		}
	}
	// Запускаем функцию каждую секунду
	timerID = setInterval(addRequests, 500);
});