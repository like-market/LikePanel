var logger = require('../logger.js')
var db = require('../db');
var worker = require('../worker');


/**
 * Обрабатываем запрос на комментирование
 * @param user_id  - id пользователя, создавшего задачу
 * @param type     - тип объекта, который будем комментировать (пока что post)
 * @param name     - название задачи
 * @param owner_id - идентификатор пользователя или сообщества, на чьей стене находится запись
 * @param post_id  - идентификатор записи на стене
 * @param comments_ids - список id наборов комментариев
 * @param comment_need - количество комментариев для накрутки
 */
exports.addComments = async function(user_id, type, name, owner_id, item_id, comments_ids, comment_need) {
    logger.debug('Пришел запрос на комментирование')
    logger.debug('UID: ' + user_id + '  PostId: ' + item_id + '  Count: ' + comment_need);

    db.finance.spend(user_id, comment_need * 10) // Уменьшаем баланс

    // Добавляем задачу в бд
    task_id = await db.tasks.createTask(user_id, 'comment', name, 'URL', comment_need)

    // Добавляем в активность потраченные деньги
    db.activity.spendMoney(user_id, comment_need * 10, task_id)
    // Добавляем в активность создание задачи
    db.activity.createTask(user_id, task_id)

    // Создаем задачу в воркере
    worker.queue.create('comment', {
        user_id, type, owner_id, item_id, comments_ids, comment_need, task_id
    }).save();
}

/**
 * Обрабатываем запрос на лайканье
 * @param user_id  - id пользователя, создавшего задачу
 * @param name     - название задачи
 * @param owner_id - идентификатор владельца объекта
 * @param type     - тип объекта
 * @param item_id  - идентификатор объекта
 * @param like_need - список id наборов комментариев
 */
exports.addLikes = async function(user_id, name, owner_id, type, item_id, like_need) {
    logger.debug('Пришел запрос на лайканье')
    logger.debug('UID: ' + user_id + '  type: ' + type + '  like_need: ' + like_need)

    db.finance.spend(user_id, like_need * 10) // Уменьшаем баланс

    // Добавляем задачу в бд
    // TODO: correct_url
    task_id = await db.tasks.createTask(user_id, type, name, '', like_need)
    
    // Добавляем в активность потраченные деньги
    db.activity.spendMoney(user_id, like_need * 10, task_id)
    // Добавляем в активность создание задачи
    db.activity.createTask(user_id, task_id)

    // Создаем задачу в воркере
    worker.queue.create('like', {
        user_id, type, owner_id, item_id, like_need, task_id
    }).save();
}