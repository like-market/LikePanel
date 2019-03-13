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
 * Объект с выполняющимися задачами
 * Нужно чтобы получать доступ из асинхронных функций
 * @key   - id задачи
 * @value - данные задачи
 *     now_add - количество успешно поставленных лайков
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
 * @param account - аккаунт
 */
const createRequest = async function(task_id, account) {
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
	const response = await vkapi.addLike(tasks[task_id].type, tasks[task_id].owner_id, tasks[task_id].item_id, account);

	// Если лайк успешно поставлен
	if (response.response) {
		// db.tasks.inrement(task_id);
		logger.debug(`Лайк поставлен: ${response.response.likes}`)
		
		tasks[task_id].async_count--;
		return;
	}

	// Уменьшаем количество успешно поставленных лайков на один
	// Так как при вызове асинхронной функции мы предположили, что лайк поставится
	tasks[task_id].now_add--;

	// Если не удалось поставить лайк
	if (response.error) {
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
			case 30:
				logger.warn(`Профиль приватный`, {json: response.error})
				db.vk.setAccountStatus(account.user_id, 'need_token')
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
				logger.warn('Неизвестная ошибка', {json: response})
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
 * Воркер, в котором ставим лайки
 * @parallel 1
 *
 * @param task_id   - id задачи в бд
 * @param task_data - данные задачи
 */
queue.process('like', 3, async function(job, done){
	const task_id = job.data.task_id
	tasks[task_id] = job.data.task_data;
	logger.info(`Начала выполнятся задача ${task_id} на накрутку лайков`)

	
	await db.tasks.setStatus(task_id, 'run')
	
	tasks[task_id]['now_add'] = 0;         // Лайков поставлено
	tasks[task_id]['async_count'] = 0;     // Текущее количество асинхронных запросов
	tasks[task_id]['error_count'] = 0;     // Количество ошибок
	tasks[task_id]['fatal_error'] = false; // Флаг фатальной ошибки (прекращения накрутки)

	// Получаем все аккаунты
	const all_accounts = await db.vk.getActiveAccounts();

	// Аккаунты, которые еще не поставили лайки
	let accounts = [];

	// Получаем аккаунты, которые уже поставили лайки
	let already_set = await vkapi.getLikeList(tasks[task_id].type, tasks[task_id].owner_id, tasks[task_id].item_id);
	if (!already_set || !already_set.response || !already_set.response.items) {
		console.log(already_set);
		logger.error('getLikeList вернуло null')
		already_set = []	
	}else {
		already_set = already_set.response.items;
	}

    for (let account of all_accounts) {
    	// Если аккаунт не поставил лайк, добавляем его в массив аккаунтов
        if (already_set.indexOf(account.user_id) == -1) {
        	accounts.push(account);
        }
    }



	let timerID; // ID таймера

	// Функция, которая проверяет количество асинхронных задач
	// И добавляет новые, если есть свободные места
	const addRequests = async function() {
		// Синхронный режим (когда осталось накрутить мало лайков)
		if (tasks[task_id].like_need - tasks[task_id].now_add < 60) {
			if (timerID != -1) {
				clearInterval(timerID)
				timerID = -1;
			}
			while (tasks[task_id].like_need > tasks[task_id].now_add) {
				// Выбираем случайный аккаунт и удаляем из массива аккаунтов
				const account = accounts.popRandom()

				// Если нет аккаунта или в асинхронных функциях произошла фатальная ошибки
				if (!account || tasks[task_id].fatal_error || tasks[task_id].error_count > 50) {
					utils.task.onError(task_id);
					return done();
				}

				// Создаем синхронный запрос
				await createRequest(task_id, account);

				db.tasks.updateCount(task_id, tasks[task_id].now_add);

				// Проверка на то, что все лайки поставлены
				if (tasks[task_id].now_add == tasks[task_id].like_need) {
					utils.task.onSuccess(task_id);
					return done();
				}
			}
			// Перекрутили комментов
			utils.task.onSuccess(task_id);
			return done();
		// Асинхронный режим
		}else {
			db.tasks.updateCount(task_id, tasks[task_id].now_add);

			// Создаем асинхронные запросы
			while (tasks[task_id].async_count < 50) {
				// Выбираем случайный аккаунт и удаляем из массива аккаунтов
				const account = accounts.popRandom()

				// Если нет аккаунтов
				if (!account) {
					logger.error('Закончились аккаунты')
					clearInterval(timerID)
					utils.task.onError(task_id);
					return done();
				}

				createRequest(task_id, account);
			}
			// Если в асинхронных функция произошла фатальная ошибки
			if (tasks[task_id].fatal_error || tasks[task_id].error_count > 50) {
				clearInterval(timerID)
				utils.task.onError(task_id);
				return done();
			}
		}
	}
	// Запускаем функцию каждую секунду
	timerID = setInterval(addRequests, 500);
});