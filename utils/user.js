const db = require('../db');

exports.addBalance = function(username, count) {
	let money = count;
	db.users.findByUsername(username, function(err, data) {
		if (err) return console.error(err);

		var user_id = data.id;

		// Увеличиваем баланс пользователя
		db.finance.AddBalance(user_id, count);

		// Добавляем 'пополнение' в recent_activity
		db.activity.addMoney(user_id, count)
	})
}

exports.subtractBalance = function(username, count) {
	let money = count;
	db.users.findByUsername(username, function(err, data) {
		if (err) return console.error(err);

		var user_id = data.id;

		// Уменьшаем баланс пользователя
		db.finance.spend(user_id, count);

		// Добавляем 'уменьшение' в recent_activity
		db.activity.spendMoney(user_id, count)
	})
}