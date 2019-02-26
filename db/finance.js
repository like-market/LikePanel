var db = require('./index.js').db;

var moment = require('moment');
require('moment/locale/ru');

exports.getBalanceAtDate = function(user_id, date) {
	return new Promise(async function(resolve, reject){
		sql = `SELECT balance FROM balance WHERE user_id=${user_id} AND date<='${date}' ORDER BY \`date\` ASC LIMIT 1`

		db.query(sql, function(err, rows) {
			if (err) return reject(err)

			if (rows.length == 0) return resolve(0);

			resolve( JSON.parse(JSON.stringify(rows[0]))['balance'] );
		})
	})
}

// Получить баланс за последние 15 дней
exports.getBalanceHistory = function(user, days) {
	let user_id = user.id;

	return new Promise(async function(resolve, reject){
		var from = moment().hour(0).minute(0).second(0).subtract(days - 1, 'days').format();
		var to = moment().format();

		var sql = `SELECT * FROM balance WHERE user_id=${user_id} AND date>='${from}' AND date<='${to}' ORDER BY \`date\` ASC`

		db.query(sql, async function(err, rows) {
			if (err) return reject(err)

			var balances = []

			// Получаем баланс, который был 15 дней назад
			balances.push( {id: 'start', date: from, balance: await exports.getBalanceAtDate(user_id, from)} );

			// Если есть транзакции
			if (rows.length) {
				JSON.parse(JSON.stringify(rows)).forEach(function(transaction) {
					balances.push( transaction );
				})
			}

			// Добавляем баланс, который у пользователя сейчас
			balances.push( {id: 'end', date: to, balance: user.balance} )

			resolve(balances);
		})
	})
}


/**
 * Получить колчисевто денег, который пополнил пользователь
 * @param user_id - ID пользователя
 */
exports.getTotalRefill = function(user_id) {
    return new Promise(function(resolve, reject){
        var sql = `SELECT SUM(amount) as SUM FROM balance WHERE user_id=${user_id} AND type='add'`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(0)

            // rows.parseSqlResult()[0]['SUM']
			let sum = JSON.parse(JSON.stringify(rows))[0]['SUM'];
			if (sum) return resolve(sum);
			
			resolve(0);
        })
    });
}

/**
 * Изменяем баланс
 * @param user_id - ID пользователя
 * @param type - тип операции [add, spend]
 * @param amount - колличество (в копейках)
 * @param description - описание
 */
exports.changeBalance = function(user, type, amount, description) {
	return new Promise(function(resolve, reject){
		// Добавляем транзакцию
		sql = "INSERT into balance(user_id, type, amount, description, balance) "
		sql += `VALUES(${user.id}, '${type}', ${amount}, '${description}', ${parseInt(amount) + parseInt(user.balance)});`

		db.query(sql, function(err, rows) {
			if (err) reject(err)

			if (type == 'add') sign = '+';
			else sign = '-';
			
			// Изменяем баланс
			sql = `UPDATE users SET balance = balance ${sign} ${amount} WHERE id = ${user.id}`			

			db.query(sql, function(err, rows) {
				if (err) reject(err)
				
				resolve()
			})
		})
	})
}

/**
 * Создаем счет для оплаты
 * @param owner_id  - владелец счета
 * @param amount   - сумма для пополнения (в рублях)
 */
exports.createBill = function(owner_id, amount) {
    return new Promise(function(resolve, reject){
        let sql = `INSERT INTO payment(user_id, amount) VALUES(${owner_id}, ${amount})`;

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            // resolve(rows.insertId)
            resolve( JSON.parse(JSON.stringify(rows)).insertId )
        })
    })
}

/**
 * Получаем информацию об оплате
 * @param pay_id - идентификатор платежа
 */
exports.getBill = function(pay_id) {
	return new Promise(async function(resolve, reject){
		sql = `SELECT * FROM payment WHERE id=${pay_id}`

		db.query(sql, function(err, rows) {
			if (err || rows.length == 0) return reject(err)

			resolve( JSON.parse(JSON.stringify(rows))[0] );
		})
	})
}

/**
 * Устанавливаем статус платежа
 * @param pay_id - идентификатор платежа
 */
exports.setBillStatus = function(pay_id, status) {
    return new Promise(function(resolve, reject){
        var sql = `UPDATE payment SET status = '${status}' WHERE id = ${pay_id}`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve()
        })
    })
}