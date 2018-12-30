var db = require('./index.js').db;


exports.get = function(id) {
    return new Promise(function(resolve, reject){
        var sql = "SELECT * FROM `recent_activity` WHERE `user_id`=" + id;
        sql += " AND (`type`='auth' OR `type`='register') ORDER BY `create` DESC LIMIT 5";

        db.query(sql, function(err, rows) {
            if (err || rows.length == 0) reject(err)

            var data = JSON.parse(JSON.stringify(rows))
            return resolve(data)
        })
    })
}

// Вызывается при успешной авторизации
exports.auth = function(user_id, ip) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('auth', " + user_id + ", '" + ip + "')";

        db.query(sql, function(err, rows) {
            if (err) reject(err);
        })
        resolve()
    })
}

// Вызывается при успешной регистрации
exports.register = function(user_id, ip) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('register', " + user_id + ", '" + ip + "')";

        db.query(sql, function(err, rows) {
            if (err) reject(err);
        })
        resolve()
    })
}

exports.createTask = function(user_id, task_id) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('create_task', " + user_id + ", '" + task_id + "')"

        db.query(sql, function(err, rows) {
            if (err) reject(err);
        })
        resolve()
    })
}

exports.spendMoney = function(user_id, count, task_id = null) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`, `data2`)"
        sql += " VALUES('spend', " + user_id + ", '" + count + "', "
        
        if (task_id != null) {
            sql += task_id + ")"
        }else {
            sql += "NULL)"
        }

        db.query(sql, function(err, rows) {
            if (err) reject(err);
        })
        resolve()
    })
}

exports.addMoney = function(user_id, count) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('refill', " + user_id + ", '" + count + "')"

        db.query(sql, function(err, rows) {
            if (err) reject(err);
        })
        resolve()
    })
}