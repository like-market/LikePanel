var db = require('./index.js').db;

/**
 * Получить пользователя по id
 */
exports.findById = function(user_id) {
    return new Promise(function(resolve, reject){
        var sql = `SELECT * FROM users WHERE id= ${user_id}`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(null);

            // resolve( rows.parseSqlResult()[0] );
            resolve( JSON.parse(JSON.stringify(rows))[0] )
        })
    });
}

/**
 * Получить пользователя по логину
 * @param username - логин
 */
exports.findByUsername = function(username) {
    return new Promise(function(resolve, reject){
        var sql = `SELECT * FROM users WHERE username = '${username}'`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(null);

            // resolve( rows.parseSqlResult()[0] );
            resolve( JSON.parse(JSON.stringify(rows))[0] )
        })
    })
}

/**
 * Добавляем нового пользователя
 * @param username - логин
 * @param password - пароль
 * @param email - почта
 */
exports.addUser = function(username, password, email = "") {
    return new Promise(function(resolve, reject){
        var sql = `INSERT INTO users(username, password, email) VALUES('${username}', '${password}', '${email}')`
        
        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve(true)
        })
    })
}

/**
 * Обновляем пароль и почту у пользователя
 * @param username - логин
 * @param password - пароль
 * @param email - почта
 */
exports.updateData = function(username, password, email) {
    return new Promise(function(resolve, reject){
        var sql = `UPDATE users SET password='${password}', email='${email}' WHERE username='${username}'`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve()
        })
    })
}