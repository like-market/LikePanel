var logger = require('../logger.js')
var db = require('../db');
var worker = require('../worker');

// String => Id
exports.types = {
	'post': 1
}

exports.isCorrectType = function(type) {
	return exports.types.hasOwnProperty(type);
}


exports.add = async function(user_id, name, type, url, like_need) {
    logger.debug('Пришел запрос на добавление нового задания')
    logger.debug('UID: ' + user_id + '  type: ' + type + '  like_need: ' + like_need)
    logger.debug('URL: ' + url)

    // Уменьшаем баланс
    db.finance.spend(user_id, like_need * 10)

    // Добавляем задачу в бд
    task_id = await db.tasks.createTask(user_id, type, name, url, like_need)
    
    // Добавляем в активность потраченные деньги
    db.activity.spendMoney(user_id, like_need * 10, task_id)
    // Добавляем в активность создание задачи
    db.activity.createTask(user_id, task_id)
    
    // Добавляем задачу в воркер
    worker.like.addTask(user_id, type, url, like_need, task_id);
}