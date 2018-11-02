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
		else console.log('Создана задача в воркере с id: ' + job.id)
	});
}
function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}
taskQueue.process('post', function(job, done){
	let data = job.data // { user_id: 12, type: 'post', url: '266510818_67', like_need: '2', task_id: 12 }

	const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(data.url)


    let post = match[4].split('_')
    let owner_id = post[0]
    let item_id  = post[1]

	db.vk.getActiveAccounts(async function(err, accounts) {
		if (err) return done(err)

		var account_index = 0;

		for (var like_now = 0; like_now < data.like_need;) {
			await sleep(500)
			var access_token = accounts[account_index].access_token;
			account_index++;

			var result = await vkapi.addLike(data.type, owner_id, item_id, access_token);
			if (result.data.hasOwnProperty('error')) {
				msg = result.data.error.error_msg
				if (msg.indexOf('User authorization failed: invalid session.')) {
					db.vk.setAccountStatus(accounts[account_index].user_id, 'need_token')
					console.log('Нужно запросить токен (1)')
				}
				if (msg.indexOf('User authorization failed: invalid access_token (2).')) {
					db.vk.setAccountStatus(accounts[account_index].user_id, 'need_token')
					console.log('Нужно запросить токен (2)')
				}else {
					console.error(msg);
				}
				console.log('Account user_id: ' + accounts[account_index].user_id)
			}else {
				like_now++
				db.tasks.inrementLikes(data.task_id);
				console.log('Поставлен лайк')
			}
			if (accounts[account_index] == undefined) {
				console.error('Не получается завершить задачу ' + data.task_id)
				break;
			}
		}
		// Если все лайки поставлены - завершаем задачу
		if (like_now == data.like_need) {
			db.tasks.setFinish(data.task_id)
		}else {
			db.task.setWait(data.task_id)
		}
		done()
	})
});