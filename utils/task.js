var logger = require('../logger.js')
var db = require('../db');
var worker = require('../worker');


/**
 * Обрабатываем запрос на комментирование
 * @param user     - объект пользователя, создавшего задачу
 * @param type     - тип объекта, который будем комментировать (пока что post)
 * @param name     - название задачи
 * @param owner_id - идентификатор пользователя или сообщества, на чьей стене находится запись
 * @param post_id  - идентификатор записи на стене
 * @param comments_ids - список id наборов комментариев
 * @param comment_need - количество комментариев для накрутки
 */
exports.addComments = async function(user, type, name, owner_id, item_id, comments_ids, comment_need) {
    logger.debug('Пришел запрос на комментирование')

    // Добавляем задачу в бд, получаем её id
    task_id = await db.tasks.createTask(user.id, 'comment', name, type, owner_id, item_id, comment_need, comments_ids);

    logger.debug('User: ' + user.username + ' Comment_need: ' + comment_need + ' TaskId: ' + task_id)

    // Уменьшаем баланс
    db.finance.changeBalance(user, 'spend', comment_need * 10, 'Задача ' + task_id + ' накрутка ' + comment_need + ' комментариев')

    // Создаем задачу в воркере
    worker.queue.create('comment', {
        user_id: user.id, type, owner_id, item_id, comments_ids, comment_need, task_id
    }).removeOnComplete(true).save();
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
    db.finance.changeBalance(user, 'spend', like_need * 10,  'Задача ' + task_id + ' накрутка ' + like_need + ' лайков')
    
    // Создаем задачу в воркере
    worker.queue.create('like', {
        user_id: user.id, type, owner_id, item_id, like_need, task_id
    }).removeOnComplete(true).save();
}