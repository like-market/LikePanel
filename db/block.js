var db = require('./index.js').db;

/**
 * Заблокирован ли id группы
 * @param group_id - id группы
 */
exports.isBlocked = function(group_id) {
	return new Promise(function(resolve, reject) {
		// Убираем минус из group_id
		db.query("SELECT COUNT(*) FROM black_list WHERE group_id=?", [Math.abs(+group_id)], (err, rows) => {
            if (err) return reject(err) 

			resolve( !!+rows[0]['COUNT(*)'] );
        })
    })
}