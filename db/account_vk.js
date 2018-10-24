var db = require('./index.js').db;

exports.addAccount = function(user_id, login, password, access_token = null, cb) {
	process.nextTick(function() {
		var sql = "INSERT INTO `account_vk`(user_id, login, password, access_token, status) VALUES('"
		sql += user_id + "', '" + login + "', '" + password + "', ";
		if (access_token != null) {
			sql += "'" + access_token + "', 'active')";
		} else {
			sql += "NULL, 'need_auth')"
		}

		db.query(sql, function(err, rows) {
			if (err) console.error(err);

			return cb(err, rows)
        })
	})
}

exports.getActiveAccounts = function(cb) {
	process.nextTick(function() {
		var sql = "SELECT `user_id`, `access_token` FROM `account_vk`";
		sql += " WHERE `access_token` IS NOT NULL AND `status` = 'active' ORDER BY RAND()"

		db.query(sql, function(err, rows) {
			if (err) return cb(err, null)

			if (rows.length == 0) return cb(err, [])
			
			var accounts = JSON.parse(JSON.stringify(rows))
        	cb(err, accounts)
        })
	})
}

exports.getActiveAccountsCount = function(cb) {
	process.nextTick(function() {
		var sql = "SELECT COUNT(*) FROM `account_vk`"
		sql += " WHERE `access_token` IS NOT NULL AND `status` = 'active'";
	
		db.query(sql, function(err, rows) {
			if (err) return cb(err, null)

			var count = JSON.parse(JSON.stringify(rows[0]))['COUNT(*)']
			cb(err, count)
        })
	})
}

/**
 * Функция возаращает все аккаунты из бд
 */
exports.getAllAccounts = function(cb) {
	process.nextTick(function() {
		var sql = "SELECT * FROM `account_vk`"

		db.query(sql, function(err, rows) {
			if (err) return cb(err, null)

			var accounts = JSON.parse(JSON.stringify(rows))
			cb(err, accounts)
        })
	})
}

exports.getRandomAccessToken = function(cb) {
	process.nextTick(function() {
		var sql = "SELECT `access_token` FROM `account_vk` WHERE `access_token` IS NOT NULL"
		sql += " AND `status` = 'active' ORDER BY RAND() LIMIT 1";

		db.query(sql, function(err, rows) {
			if (err) return cb(err, null)

			var access_token = JSON.parse(JSON.stringify(rows[0])).access_token
			cb(err, access_token)
        })
	})
}

exports.setAccountStatus = function(user_id, status) {
	process.nextTick(function() {
		var sql = "UPDATE `account_vk` SET `status` = '" + status + "' WHERE `user_id` = " + user_id;
		
		db.query(sql, function(err, rows) {
			if (err) console.error(err)
        })
	})
}

exports.setAccountToken = function(user_id, access_token) {
	process.nextTick(function() {
		var sql = "UPDATE `account_vk` SET `access_token` = '" + access_token + "'"
		sql += " WHERE `user_id` = " + user_id;
			
		db.query(sql, function(err, rows) {
			if (err) console.error(err)
        })
	})
}