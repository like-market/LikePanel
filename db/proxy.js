const logger = require('../logger.js');
const db = require('./index.js');

const PROXY_ID = {
    UNUSED: 0
}

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
	logger.info('Начало перепривязки прокси для всех акк');

	let accounts = await require('./vk.js').getAllAccounts();
	let proxies  = await exports.getProxy();

	// Если нет аккаутов или прокси
	if (!accounts.length || !proxies) return;
	
	let proxy_id = 0;
	for (account of accounts) {
		if (proxy_id >= proxies.length) proxy_id = 0;
		//let proxy = proxies.random();

		let sql = "UPDATE `account_vk` SET `proxy_id`=" + proxies[proxy_id].id + " WHERE `user_id`=" + account.user_id;
		proxy_id++;

		db.query(sql, function(err, rows) {
			if (err) console.log(err)
		});
	}
	logger.info('Прокси перепривязаны для всех аккаунтов');
}

exports.get = function(id) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `proxy` WHERE `id`=" + id;

		db.query(sql, function(err, rows) {
			if (err) return reject(err);
			
			if (rows.length == 0) return resolve(null);

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



/**
 * Получаем количество нераспользуемых прокси
 */
exports.getUnusedProxiesCount = async function() {
    const sql = `SELECT COUNT(*) FROM proxy WHERE proxy.group = ${PROXY_ID.UNUSED}`;
    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result[0]))['COUNT(*)'];
};

/**
 * Получаем неиспользуемые прокси
 * @param count - количество прокси
 */
exports.getUnusedProxies = async function(count) {
    const sql = `SELECT * FROM proxy WHERE proxy.group = ${PROXY_ID.UNUSED} LIMIT ${count}`;
    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result));
};

/**
 * Устанавливаем группу у прокси
 * @param proxy_id - id прокси
 * @param group_id   - id набора аккаунтов
 */
exports.setProxyGroup = function(proxy_id, group_id) {
    const sql = `UPDATE proxy SET proxy.group = ${group_id} WHERE id = ${proxy_id}`;
    db.async_query(sql);
};