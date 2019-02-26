var db = require('./index.js').db;

/**
 * Получаем историю активности пользователя
 * @param user_id - ID пользователя
 */
exports.getUserActivity = function(user_id, count = 4) {
    return new Promise(function(resolve, reject){
        var sql = `SELECT * FROM activity WHERE user_id=${user_id} ORDER BY \`date\` DESC LIMIT ${count}`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve([])

            // resolve( rows.parseSqlResult() )
            resolve( JSON.parse(JSON.stringify(rows)) )
        })
    })
}

/**
 * Добавляем новое действие в историю активности
 * @param user_id - ID пользователя
 * @param type - тип
 * @param ip   - адрес
 */
exports.addActivity = function(user_id, type, ip) {
    return new Promise(function(resolve, reject){
        var sql = `INSERT INTO activity(user_id, type, ip) VALUES(${user_id}, '${type}', '${ip}')`;

        db.query(sql, function(err, rows) {
            if (err) reject(err);
            resolve()
        })
    })
}