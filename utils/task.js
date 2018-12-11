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


exports.addLikes = async function(user_id, name, type, url, like_need) {
    logger.debug('Пришел запрос на лайканье')
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
    
    // Получаем данные о записи
    const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(url)

    // Получаем данные о посте 
    const post_data = match[4].split('_')

    worker.queue.create(type, {
        user_id: user_id,
        type: type,
        owner_id: post_data[0],
        item_id:  post_data[1],
        like_need: like_need,
        task_id: task_id
    }).save();

}