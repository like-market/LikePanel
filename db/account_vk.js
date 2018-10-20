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
			
			var transactions = JSON.parse(JSON.stringify(transactions))
        	return transactions
        })
	})
}