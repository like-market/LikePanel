var db = require('./index.js').db;

var moment = require('moment');
require('moment/locale/ru');

// time - new Date(), например 2018-10-15T12:04:27.000Z
exports.getBalanceAtDate = function(id, date, cb) {
	process.nextTick(function() {
		var sql = "SELECT `data`, `type` FROM `recent_activity` WHERE `user_id`=" + id;
		sql += " AND (`type`='refill' OR `type`='spend')";
		sql += " AND `create`<='" + date + "'";

		db.query(sql, function(err, rows) {
            if (err) return cb(err, null);
            if (rows.length == 0) return cb(null, 0) 

            // Превращаем RowDataPacket в json
            var transactions = JSON.parse(JSON.stringify(rows));
            var balance = 0;
            transactions.forEach(function(transaction) {
            	if (transaction.type == 'spend') {
            		balance -= parseInt(transaction.data);
            	}else if (transaction.type == 'refill') {
            		balance += parseInt(transaction.data);
            	}
            })
            return cb(err, balance)
        })
	})
}

// Получить баланс за последние 15 дней
exports.getIntervalBalance = function(id, cb) {
	process.nextTick(function() {
		var from = moment().hour(0).minute(0).second(0).subtract(14, 'days').format();
		var to = moment().format();
		exports.getBalanceAtDate(id, from, function(err, data) {
			let balance = parseInt(data);

			var sql = "SELECT * FROM `recent_activity` WHERE `user_id`=" + id;
			sql += " AND (`type`='refill' OR `type`='spend')";
			sql += " AND `create`>='" + from + "' AND `create`<='" + to + "'";
			sql += " ORDER BY `create` ASC";

			db.query(sql, function(err, transactions) {
				if (err) return cb(err, null)
				if (transactions.length == 0) {
					return cb(err, []);
					return;
				}
				var balances = []

				var transactions = JSON.parse(JSON.stringify(transactions));
				transactions.forEach(function(transaction) {
					if (transaction.type == 'refill') {
						balance += parseInt(transaction.data);
					}else if (transaction.type == 'spend') {
						balance -= parseInt(transaction.data);
					}
					transaction.balance = balance;
					balances.push( transaction );
				})
				return cb(err, balances);
			})
		})
	})
}

exports.spend = function(user_id, count) {
	process.nextTick(function() {
		var sql = "UPDATE `users` SET `balance` = `balance` - " + count
		sql += " WHERE `id` = " + user_id;

		db.query(sql, function(err, rows) {
			if (err) console.log(err);
		})
	})
}

exports.AddBalance = function(user_id, count) {
	process.nextTick(function() {
		var sql = "UPDATE `users` SET `balance` = `balance` + " + count
		sql += " WHERE `id` = " + user_id;

		db.query(sql, function(err, rows) {
			if (err) console.log(err);
		})
	})
}