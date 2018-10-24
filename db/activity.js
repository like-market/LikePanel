var db = require('./index.js').db;

const REGISTER = 1;
const ADD_MONEY = 2;
const AUTH = 3;
const CREATE_TASK = 4;
const REMOVE_MONEY = 5;


exports.getActivity = function(id, cb) {
    process.nextTick(function() {
        var sql = "SELECT * FROM `recent_activity` WHERE `user_id`=" + id;
        sql += " AND `type`<>'spend' ORDER BY `create` DESC LIMIT 5";

        db.query(sql, function(err, rows) {
            if (!err && rows.length != 0) {
                var data = JSON.parse(JSON.stringify(rows))
                return cb(err, data)
            }else {
                return cb(err, null)
            }
        })
    })
}

// Вызывается при успешной авторизации
exports.auth = function(user_id, ip) {
    process.nextTick(function() {
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('auth', " + user_id + ", '" + ip + "')";

        db.query(sql, function(err, rows) {
            if (err) console.error(err);
        })
    })
}

// Вызывается при успешной регистрации
exports.register = function(user_id, ip) {
    process.nextTick(function() {
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('register', " + user_id + ", '" + ip + "')";

        db.query(sql, function(err, rows) {
            if (err) console.error(err);
        })
    })
}

exports.createTask = function(user_id, task_id) {
    process.nextTick(function() {
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('create_task', " + user_id + ", '" + task_id + "')"

        db.query(sql, function(err, rows) {
            if (err) console.error(err);
        })
    })
}

exports.spendMoney = function(user_id, count, task_id = null) {
    process.nextTick(function() {
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`, `data2`)"
        sql += " VALUES('spend', " + user_id + ", '" + count + "', "
        
        if (task_id != null) {
            sql += task_id + ")"
        }else {
            sql += "NULL)"
        }

        db.query(sql, function(err, rows) {
            if (err) console.error(err);
        })
    })
}

exports.addMoney = function(user_id, count) {
    process.nextTick(function() {
        var sql = "INSERT INTO `recent_activity`(`type`, `user_id`, `data`)"
        sql += " VALUES('refill', " + user_id + ", '" + count + "')"

        db.query(sql, function(err, rows) {
            if (err) console.error(err);
        })
    })
}