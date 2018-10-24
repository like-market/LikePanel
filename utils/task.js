var db = require('../db');
var worker = require('../worker.js');

// String => Id
exports.types = {
	'post': 1
}

exports.isCorrectType = function(type) {
	return exports.types.hasOwnProperty(type);
}


exports.add = function(user_id, name, type, url, like_need) {
    console.log('Пришел запрос на добавление нового задания')
    console.log('UID: ' + user_id + '  type: ' + type + '  like_need: ' + like_need)
    console.log('URL: ' + url)

    // Уменьшаем баланс
    db.finance.spend(user_id, like_need * 10)

    // Добавляем задачу в бд
    db.tasks.createTask(user_id, type, name, url, like_need, function(err, task_id) {
        // Добавляем в активность потраченные деньги
        db.activity.spendMoney(user_id, like_need * 10, task_id)
        // Добавляем в активность создание задачи
        db.activity.createTask(user_id, task_id)
        
        // Добавляем задачу в воркер
        worker.addTask(user_id, type, url, like_need, task_id);
    });
    
}