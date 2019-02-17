const db = require('../db');

/**
 * Изменяем баланс
 * @param user - объект пользователя
 * @param type   - тип операции [add, spend]
 * @param ammount - колличество копеек
 */
exports.changeBalance = function(user, type, ammount, description = '') {
	db.finance.change(user.id, type, ammount, description, balance);

	// Уменьшаем баланс пользователя
	db.finance.spend(user_id, count);

	// Добавляем 'уменьшение' в recent_activity
	db.activity.spendMoney(user_id, count)
}