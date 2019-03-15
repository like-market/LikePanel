const logger = require('../logger.js')
const utils = require('../utils')
const db = require('../db');
const worker = require('../worker');

/**
 * Объект с выполняющимися задачами
 * Нужно чтобы получать доступ из асинхронных функций
 * @key   - id задачи
 * @value - данные задачи
 */
let tasks = worker.tasks;

/**
 * Обрабатываем запрос на комментирование
 * @param user     - объект пользователя, создавшего задачу
 * @param type     - тип объекта, который будем комментировать
 * @param name     - название задачи
 * @param owner_id - идентификатор пользователя или сообщества, на чьей стене находится запись
 * @param post_id  - идентификатор записи на стене
 * @param comments_ids - список id наборов комментариев
 * @param comment_need - количество комментариев для накрутки
 * @param use_custom - используются ли клиентские наборы комментариев
 */
exports.addComments = async function(user, type, name, owner_id, item_id, comments_ids, comment_need, use_custom) {
    logger.debug('Пришел запрос на комментирование')

    // Добавляем задачу в бд, получаем её id
    task_id = await db.tasks.createTask(user.id, 'comment', name, type, owner_id, item_id, comment_need, comments_ids);

    logger.debug('User: ' + user.username + ' Comment_need: ' + comment_need + ' TaskId: ' + task_id)

    // Уменьшаем баланс
    db.finance.changeBalance(user, 'spend', comment_need * user.comment_price, 'Задача ' + task_id + ' накрутка ' + comment_need + ' комментариев')

    task_data = {
        user_id: user.id,
        type,
        owner_id,
        item_id,
        comments_ids,
        comment_need,
        use_custom
    }

    // Создаем задачу в воркере
    worker.queue.create('comment', { task_id, task_data }).removeOnComplete(true).save();
}

/**
 * Обрабатываем запрос на лайканье
 * @param user_id  - id пользователя, создавшего задачу
 * @param name     - название задачи
 * @param owner_id - идентификатор владельца объекта
 * @param type     - тип объекта
 * @param item_id  - идентификатор объекта
 * @param like_need - количество лайков для накрутки
 */
exports.addLikes = async function(user, name, owner_id, type, item_id, like_need) {
    logger.debug('Пришел запрос на лайканье')

    // Добавляем задачу в бд, получаем её id
    task_id = await db.tasks.createTask(user.id, 'like', name, type, owner_id, item_id, like_need);
    logger.debug('User: ' + user.username + ' Like_need: ' + like_need + ' TaskId: ' + task_id)

    // Уменьшаем баланс
    db.finance.changeBalance(user, 'spend', like_need * user.like_price,  'Задача ' + task_id + ' накрутка ' + like_need + ' лайков')
    
    task_data = {
        user_id: user.id,
        type,
        owner_id,
        item_id,
        like_need,
    }

    // Создаем задачу в воркере
    worker.queue.create('like', { task_id, task_data }).removeOnComplete(true).save();
}

/**
 * Отменяем задачу, возаращаем деньги
 * @param task_id - номер задачи
 */
exports.cancelTask = async function(task_id) {
    // TODO
}


/**
 * Вызывается в случае возникновения ошибки при выполнении задачи
 * Ждем завершения всех асинхронных функций и возвращаем леньги
 *
 * @param task_id - инедтификатор задачи
 */
exports.onError = async function(task_id) {
    logger.info(`Ждем все асинхронные функции в задаче ${task_id}, чтобы завершить задачу`)

    // Ждем завершения всех асинхронных функций
    ttl = 20; // Время ожидания - 10 секунд, после чего принудительно завершаем задачу
    while (ttl-- && tasks[task_id].async_count) {
        await utils.sleep(500);
    }
    if (!ttl) logger.error(`Принудительно завершаем задачу ${task_id}`);

    logger.warn(`Останавливаем задачу ${task_id}`)
    db.tasks.setStatus(task_id, 'error')


    const task = await db.tasks.findById(task_id)
    const user = await db.users.findById(task.owner_id)

    let price;
    if (task.type == 'like')    price = user.like_price
    if (task.type == 'comment') price = user.comment_price

    // Количество денег для возврата
    const amount = (task.need_add - task.now_add) * price; 
    utils.user.changeBalance(user, 'add', amount, `Возврат по задаче ${task_id}`);
    logger.warn(`Возвращаем пользователю ${user.username} ${(amount / 1000).toFixed(2)}₽`)

    delete tasks[task_id];
}

/**
 * Вызывается при успешном выполнении таска
 */
exports.onSuccess = async function(task_id) {
    logger.info('Задача ' + task_id + ' выполнена')
    db.tasks.setStatus(task_id, 'finish')

    ttl = 20; // Время жизни данных 10 секунд
    while (ttl-- && tasks[task_id].async_count) {
        await utils.sleep(500);
    }
    logger.info(`Все асинхронные функции в задаче ${task_id} завершены`);

    delete tasks[task_id];
}


// TODO: Функция, которая убирает задачи, находящиеся в ожидании при старте