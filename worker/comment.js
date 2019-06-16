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
 * @param comment - комментарий для накрутки
 * @param account - аккаунт
 */
const createRequest = async function(task_id, comment, account) {
	tasks[task_id].now_add++;
	tasks[task_id].async_count++;

	/**
     * В случае успеха возвращается
     * {response}
     *
     * В случае ошибки ошибки авторизации
     * {error}
     *
     * В случае ошибки в axios запросе
     * {code, ...}
     */
	const response = await vkapi.createComment(tasks[task_id].type, tasks[task_id].owner_id, tasks[task_id].item_id, comment, account);

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

	// Если не удалось поставить комментарий
	if (response.error) {
		switch (response.error.error_code) {
			case 17:
				logger.warn('Требуется валидация пользователя', {json: response.error});
				db.vk.setAccountStatus(account.user_id, 'need_valid')
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
					tasks[task_id].fatall_error = true;
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
				logger.warn('Неизвестная ошибка /worker/comments.js', {json: response})
				tasks[task_id].error_count++;
		}
	}

	// Если ошибка в axios запросе
    if (response.code) {
        logger.error(`Ошибка в axios запросе: ${response.code}`)
    }

	tasks[task_id].async_count--;
}



/**
 * Воркер, в котором добавляем комментарии
 * @parallel 1
 *
 * @param task_id - id задачи в бд
 */
queue.process('comment', 3, async function(job, done){
	const task_id = job.data.task_id
	tasks[task_id] = job.data.task_data;
	logger.info(`Начала выполнятся задача ${task_id} на накрутку комментов`)

	
	await db.tasks.setStatus(task_id, 'run')
	
	tasks[task_id]['now_add'] = 0;         // Комментариев поставлено
	tasks[task_id]['async_count'] = 0;     // Текущее количество асинхронных запросов
	tasks[task_id]['error_count'] = 0;     // Количество ошибок
	tasks[task_id]['fatal_error'] = false; // Флаг фатальной ошибки (прекращения накрутки)

    if (tasks[task_id].comment_need < 250) var account_count = 25;
    else var account_count = 50;
    // Получаем набор аккаунтов
    const accounts = await db.accounts_group.getAccountsForComment(account_count);
    // Обновляем время последнего использования
    db.accounts_group.updateLastUsedForGroup(accounts[0].group);

    tasks[task_id]['accounts_group'] = accounts[0].group;

	// Получаем все комментарии
	const comments = await db.comments.getComments(tasks[task_id].comments_ids);

	let timerID; // ID таймера

	// Функция, которая проверяет количество асинхронных задач
	// И добавляет новые, если есть свободные места
	const addRequests = async function() {
		// Синхронный режим (когда осталось накрутить мало комментов)
		if (tasks[task_id].comment_need - tasks[task_id].now_add < 60) {
			if (timerID != -1) {
				// При синхронном выполнении запросов говорим очереди
				// что эта фукнция выполнена - чтобы не занимать в kue
				// одну параллельную ячейку 
				done();
				clearInterval(timerID)
				timerID = -1;
			}
			while (tasks[task_id].comment_need > tasks[task_id].now_add) {
				// Выбираем случайные значения из массивов
				const comment = comments.random()
				const account = accounts.random()

				// Создаем синхронный запрос
				await createRequest(task_id, comment, account);

				db.tasks.updateCount(task_id, tasks[task_id].now_add);

				// Если в асинхронных функция произошла фатальная ошибки
				if (tasks[task_id].fatal_error || tasks[task_id].error_count > 50) {
					utils.task.onError(task_id);
					return;
				}

				// Проверка на то, что все комменты поставлены
				if (tasks[task_id].comment_need == tasks[task_id].now_add) {
					utils.task.onSuccess(task_id);
					return;
				}
			}
			// Как мы сюда попали - это уже отдельная история...
			// Перекрутили лайков
			utils.task.onSuccess(task_id);
			return;
		// Асинхронный режим
		}else {
			db.tasks.updateCount(task_id, tasks[task_id].now_add);

			// Создаем асинхронные запросы
			while (tasks[task_id].async_count < 2) {
				// Выбираем случайные значения из массивов
				const comment = comments.random()
				const account = accounts.random()

				createRequest(task_id, comment, account);
			}
			// Если в асинхронных функция произошла фатальная ошибки
			if (tasks[task_id].fatal_error || tasks[task_id].error_count > 20) {
				clearInterval(timerID)
				utils.task.onError(task_id);
				return done();
			}
		}
	}
	// Запускаем функцию каждую секунду
	timerID = setInterval(addRequests, 500);
});