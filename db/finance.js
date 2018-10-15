var db = require('./index.js').db;

var moment = require('moment');
require('moment/locale/ru');

const ADD_MONEY = 2;
const REMOVE_MONEY = 4;


// time - new Date(), например 2018-10-15T12:04:27.000Z
exports.getBalanceAtDate = function(id, date, cb) {
	process.nextTick(function() {
		var sql = "SELECT `data`, `type` FROM `recent_activity` WHERE `user_id`=" + id;
		sql += " AND (`type`=" + ADD_MONEY + " OR `type`=" + REMOVE_MONEY + ")";
		sql += " AND `create`<='" + date + "'";

		db.query(sql, function(err, rows) {
            if (err) return cb(err, null);
            if (rows.length == 0) return cb(null, 0) 

            // Превращаем RowDataPacket в json
            var transactions = JSON.parse(JSON.stringify(rows));
            var balance = 0;
            transactions.forEach(function(transaction) {
            	if (transaction.type == REMOVE_MONEY) {
            		balance -= parseInt(transaction.data);
            	}else if (transaction.type == ADD_MONEY) {
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
			sql += " AND (`type`=" + ADD_MONEY + " OR `type`=" + REMOVE_MONEY + ")";
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
					if (transaction.type == ADD_MONEY) {
						balance += parseInt(transaction.data);
					}else if (transaction.type == REMOVE_MONEY) {
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