var logger = require('./logger.js')
var db = require('./db')
var vkapi = require('./vkapi')

var kue = require('kue')
let taskQueue = kue.createQueue()


// TODO Получить все незавершенные задачи из БД и поместить их в очередь

exports.addTask = function(user_id, type, url, like_need, task_id) {
	var job = taskQueue.create(type, {
		user_id: user_id,
		type: type,
		url: url,
		like_need: like_need,
		task_id: task_id
	}).save(function(err) {
		if (err) console.error(err)
		else logger.info('Создана задача')
	});
}

taskQueue.process('post', async function(job, done){
	let data = job.data // { user_id: 12, type: 'post', url: '266510818_67', like_need: '2', task_id: 12 }

	const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(data.url)

    // Получаем данные о посте 
    var post = match[4].split('_')
    var owner_id = post[0]
    var item_id  = post[1]

    // Получаем все аккаунты
	all_accounts = await db.vk.getActiveAccounts();

	// Аккаунты, которые еще не поставили лайки
	accounts = [];

	// Получаем аккаунты, которые уже поставили лайки
	already_set = await vkapi.getLikeList('post', owner_id, item_id);
	console.log(already_set)
	all_accounts.forEach(function(account) {
		// Если аккаунт не поставил лайк, добавляем его в массив аккаунтов
		if (already_set.indexOf(account.user_id) == -1) {
			accounts.push(account);
		} else {
			console.log('Аккаунт уже поставил лайк : ' + account.user_id )
		}
	})

	var account_index = 0; // Аккаунт, который будет лайкать

	for (var like_now = 0; like_now < data.like_need;) {
		var access_token = accounts[account_index].access_token;

		// Пытаемся поставить лайк
		var result = await vkapi.addLike(data.type, owner_id, item_id, access_token);

		// Если есть ошибка
		if (result.hasOwnProperty('error')) {
			msg = result.error.error_msg
			if (msg.indexOf('User authorization failed: invalid session.')) {
				db.vk.setAccountStatus(accounts[account_index].user_id, 'need_token')
				logger.error('Невалидная сессия у акк:' + accounts[account_index].user_id)
			}
			if (msg.indexOf('User authorization failed: invalid access_token (2).')) {
				db.vk.setAccountStatus(accounts[account_index].user_id, 'need_token')
				logger.error('Невалидный токен у акк: ' + accounts[account_index].user_id)
			}else {
				logger.error('Неизвестная ошибка')
				logger.error(msg);
			}

		// Если лайк успешно поставлен
		}else if (result.hasOwnProperty('response')) {
			like_now++; // Увеличиваем кол-во лайков
			db.tasks.inrementLikes(data.task_id);
			logger.info('Поставлен лайк')
		}

		// Перемещаемся к следующему аккаунта
		account_index++;

		// Если больще нету аккаунтов, а задача не завершена
		if (accounts[account_index] == undefined) {
			logger.error('Не получается завершить задачу ' + data.task_id)

			break;
		}
	}
	// Если все лайки поставлены - завершаем задачу
	if (like_now == data.like_need) {
		db.tasks.setFinish(data.task_id)
	}else {
		db.tasks.setWait(data.task_id)
	}
	done()
});