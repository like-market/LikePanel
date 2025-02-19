var db = require('./index.js').db;

/**
 * Функция нужна для получения данных аккаунта
 * @param key - либо user_id, либо login 
 */
exports.getAccount = function(key) {
	return new Promise(function(resolve, reject){
		var sql = `SELECT * FROM account_vk WHERE user_id='${key}' OR login='${key}'`;

		db.query(sql, function(err, rows) {
			if (err) return reject(err);

			if (rows.length == 0) return resolve(null)
			
			var account = JSON.parse(JSON.stringify(rows))[0]
			return resolve(account)
        })
    })
}

/**
 * Получаем все записи для логина
 * @param login - логин
 */
exports.getRowsByLogin = function(login) {
    return new Promise(function(resolve, reject) {
		var sql = `SELECT * FROM account_vk WHERE login='${login}'`;

		db.query(sql, function(err, rows) {
			if (err) return reject(err);

			if (rows.length == 0) return resolve([])
			
			resolve( JSON.parse(JSON.stringify(rows)) )
        })
    })
}

/**
 * Удаляем аккаунт из бд
 */
exports.removeAccount = function(user_id) {
	return new Promise(function(resolve, reject) {
		var sql = "DELETE FROM `account_vk` WHERE `user_id` = '" + user_id + "'";

		db.query(sql, function(err, rows) {
			if (err) return reject(err);

			return resolve()
        })
	})
}

/**
 * Добавляем аккаунт в бд
 */
exports.addAccount = function(user_id, login, password, access_token = null, proxy_id = null) {
	process.nextTick(function() {
		var sql = "INSERT INTO `account_vk`(user_id, login, password, proxy_id, access_token, status) VALUES('"
		sql += user_id + "', '" + login + "', '" + password + "', " + proxy_id + ", ";
		if (access_token != null) {
			sql += "'" + access_token + "', 'active')";
		} else {
			sql += "NULL, 'need_auth')"
		}

		db.query(sql, function(err, rows) {
			if (err) console.log(err);
        })
	})
}

/**
 * Добавляем данные о невалидном аккаунте
 * @param login    - логин
 * @param password - пароль
 */
exports.addInvalidAccount = function(login, password) {
	var sql = `INSERT INTO account_vk(login, password, status) VALUES('${login}', '${password}', 'incorrect')`;

	db.query(sql, function(err, rows) {
		if (err) console.log(err);
    })
}

/**
 * Получаем токены активных аккаунтов
 * @param group - группа комментариев (число или 'all')
 */
exports.getActiveAccounts = function(group = 'all') {
	return new Promise(function(resolve, reject) {
		let sql = "SELECT user_id, access_token, proxy_id FROM account_vk WHERE access_token IS NOT NULL AND status='active' "

		// Если выбираем группу аккаунтов - то добавляем еще одно условие
		if (group != 'all') sql += `AND account_vk.group=${group} `
		
		sql +=  "ORDER BY RAND()"

		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			if (rows.length == 0) return cb([])
			
			var accounts = JSON.parse(JSON.stringify(rows))
        	resolve(accounts)
        })
	})
}

/**
 * Получаем количество активных аккаунтов
 * @param group - группа комментариев (число или 'all')
 */
exports.getActiveAccountsCount = function(group = 'all') {
	return new Promise(function(resolve, reject){
		let sql = "SELECT COUNT(*) FROM account_vk WHERE access_token IS NOT NULL AND status='active' ";
		
		// Если выбираем группу аккаунтов - то добавляем еще одно условие
		if (group != 'all') sql += `AND account_vk.group=${group}`
	
		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			var count = JSON.parse(JSON.stringify(rows[0]))['COUNT(*)']
			resolve(count)
        })
	})
}

/**
 * Функция возаращает все аккаунты из бд
 */
exports.getAllAccounts = function() {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `account_vk`"

		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			var accounts = JSON.parse(JSON.stringify(rows))
			resolve(accounts)
        })
	})
}

exports.getOutdated = function () {
	return new Promise(function(resolve, reject){
		var sql = "SELECT `access_token` FROM `account_vk` WHERE `access_token` IS NOT NULL"
		sql += " AND `status` = 'active' ORDER BY RAND() LIMIT 1";

		db.query(sql, function(err, rows) {
			if (err) reject(err)

			var access_token = JSON.parse(JSON.stringify(rows[0])).access_token
			resolve(access_token)
        })
    })
}

exports.getRandomAccount = function() {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `account_vk` WHERE `access_token` IS NOT NULL"
		sql += " AND `status` = 'active' ORDER BY RAND() LIMIT 1";

		db.query(sql, function(err, rows) {
			if (err) return reject(err)
			if (!rows.length) return resolve(null);

			var access_token = JSON.parse(JSON.stringify(rows[0]))
			resolve(access_token)
        })
	})
}

exports.setAccountStatus = function(user_id, status) {
	return new Promise(function(resolve, reject){
		var sql = "UPDATE `account_vk` SET `status` = '" + status + "' WHERE `user_id` = " + user_id;
		
		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			resolve()
        })
	})
}

exports.setAccountToken = function(user_id, access_token) {
	return new Promise(function(resolve, reject){
		var sql = "UPDATE `account_vk` SET `access_token` = '" + access_token + "'"
		sql += " WHERE `user_id` = " + user_id;
			
		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			resolve()
        })
	})
}