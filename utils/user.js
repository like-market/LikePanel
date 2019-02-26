const db = require('../db');

/**
 * Изменяем баланс
 * @param user - объект пользователя
 * @param type   - тип операции [add, spend]
 * @param amount - колличество копеек
 */
exports.changeBalance = function(user, type, amount, description = '') {
	db.finance.changeBalance(user, type, amount, description);
}