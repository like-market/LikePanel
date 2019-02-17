const logger = require('../logger.js')
const db = require('./index.js').db;

/**
 * Получаем все прокси
 */
exports.getProxy = function() {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `proxy`;"

		db.query(sql, function(err, rows) {
			if (err) return reject(err)
			if (rows.length == 0) return cb([])
			
			var proxy = JSON.parse(JSON.stringify(rows))
        	resolve(proxy)
        })
	})
}

/**
 * Обновляем прокси у каждого аккаунта
 * Устанавливаем рандомное работающее прокси
 */
exports.updateAccounts = async function() {
	let accounts = await require('./vk.js').getActiveAccounts();
	let proxy    = await exports.getProxy();

	// Если нет аккаутов или прокси
	if (!accounts.length || !proxy) return;

	let proxy_id = 0;
	for (account of accounts) {
		if (proxy_id >= proxy.length) proxy_id = 0;

		let sql = "UPDATE `account_vk` SET `proxy_id`=" + proxy[proxy_id].id + " WHERE `user_id`=" + account.user_id;
		proxy_id++;

		db.query(sql, function(err, rows) {
			if (err) console.log(err)
		});
	}
	logger.info("Прокси для аккаунтов обновлены");
}

exports.get = function(id) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `proxy` WHERE `id`=" + id;

		db.query(sql, function(err, rows) {
			if (err) return reject(err);
			
			if (rows.length == 0) return null;

			var proxy = JSON.parse(JSON.stringify(rows))[0]
			return resolve(proxy)
        })
    })
}

exports.getRandom = function() {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `proxy` ORDER BY RAND() LIMIT 1";

		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			var proxy = JSON.parse(JSON.stringify(rows[0]))
			resolve(proxy)
        })
	})
}