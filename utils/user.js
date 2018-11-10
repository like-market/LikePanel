const db = require('../db');

exports.addBalance = function(user_id, count) {
	// Увеличиваем баланс пользователя
	db.finance.addBalance(user_id, count);

	// Добавляем 'пополнение' в recent_activity
	db.activity.addMoney(user_id, count)
}

exports.subtractBalance = function(user_id, count) {
	// Уменьшаем баланс пользователя
	db.finance.spend(user_id, count);

	// Добавляем 'уменьшение' в recent_activity
	db.activity.spendMoney(user_id, count)
}