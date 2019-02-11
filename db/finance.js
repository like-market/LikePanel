var db = require('./index.js').db;

var moment = require('moment');
require('moment/locale/ru');

exports.getBalance = function(user_id) {
	return new Promise(function(resolve, reject) {
		var sql = "SELECT `balance` FROM `users` WHERE `id`=" + user_id;
		db.query(sql, function(err, rows) {
			if (err) console.log(err)

			var balance = JSON.parse(JSON.stringify(rows));
			return resolve(balance)
		})
	})
}

// time - new Date(), например 2018-10-15T12:04:27.000Z
exports.getBalanceAtDate = function(id, date) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT `data`, `type` FROM `recent_activity` WHERE `user_id`=" + id;
		sql += " AND (`type`='refill' OR `type`='spend')";
		sql += " AND `create`<='" + date + "'";

		db.query(sql, function(err, rows) {
            if (err) return reject(err)
            if (rows.length == 0) return resolve(0) 

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
            return resolve(balance)
        })
	})
}

// Получить баланс за последние 15 дней
exports.getIntervalBalance = function(id) {
	return new Promise(async function(resolve, reject){
		var from = moment().hour(0).minute(0).second(0).subtract(14, 'days').format();
		var to = moment().format();

		var balance = await exports.getBalanceAtDate(id, from);
		balance = parseInt(balance);

		var sql = "SELECT * FROM `recent_activity` WHERE `user_id`=" + id;
		sql += " AND (`type`='refill' OR `type`='spend')";
		sql += " AND `create`>='" + from + "' AND `create`<='" + to + "'";
		sql += " ORDER BY `create` ASC";

		db.query(sql, function(err, transactions) {
			if (err) return reject(err)

			var balances = []

			// Если нет транзакций - то и а начале и в конце периода счет был нулевым 
			if (transactions.length == 0) {
				balances.push({create: from, balance: 0})
				balances.push({create: to,   balance: 0})
			}

			// Если есть только одна транзакция, то вначале баланс был нулевым
			if (transactions.length == 1) {
				balances.push({create: from, balance: 0})
			}

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
			resolve(balances);
		})
	})
}

exports.spend = function(user_id, count) {
	return new Promise(function(resolve, reject){
		var sql = "UPDATE `users` SET `balance` = `balance` - " + count
		sql += " WHERE `id` = " + user_id;

		db.query(sql, function(err, rows) {
			if (err) console.log(err)
			
			resolve()
		})
	})
}

exports.addBalance = function(user_id, count) {
	return new Promise(function(resolve, reject){
		var sql = "UPDATE `users` SET `balance` = `balance` + " + count
		sql += " WHERE `id` = " + user_id;

		db.query(sql, function(err, rows) {
			if (err) reject(err)
			
			resolve()
		})
	})
}