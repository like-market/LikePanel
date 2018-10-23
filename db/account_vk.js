var db = require('./index.js').db;

exports.addAccount = function(login, password, cb) {
	process.nextTick(function() {
		var sql = "INSERT INTO `account_vk`(login, password) VALUES('"
		sql += login+ "', '" + password + "')"

		db.query(sql, function(err, rows) {
			return cb(err)
        })
	})
}

exports.getAccounts = function(cb) {
	process.nextTick(function() {
		var sql = "SELECT `access_token` FROM `account_vk`";

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
		var sql = "SELECT COUNT(*) FROM `account_vk` WHERE `access_token` IS NOT NULL";
	
		db.query(sql, function(err, rows) {
			if (err) return cb(err, null)

			var count = JSON.parse(JSON.stringify(rows[0]))['COUNT(*)']
			cb(err, count)
        })
	})
}

exports.getRandomAccessToken = function(cb) {
	process.nextTick(function() {
		var sql = "SELECT `access_token` FROM `account_vk` ORDER BY RAND() LIMIT 1";

		db.query(sql, function(err, rows) {
			if (err) return cb(err, null)

			var access_token = JSON.parse(JSON.stringify(rows[0])).access_token
			cb(err, access_token)
        })
	})
}