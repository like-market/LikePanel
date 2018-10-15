var db = require('./index.js').db;

const REGISTER = 1;
const ADD_MONEY = 2;
const AUTH = 3;
const CREATE_TASK = 3;
const REMOVE_MONEY = 4;


exports.getActivity = function(id, cb) {
    process.nextTick(function() {
        var sql = "SELECT * FROM `recent_activity` WHERE `user_id`=" + id;
        sql += " AND `type`<>4 ORDER BY `create` DESC LIMIT 5";

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
exports.auth = function(user, ip) {
    process.nextTick(function() {
        var sql = "INSERT INTO `recent_activity`(`user_id`, `type`, `data`)"
        sql += " VALUES(" + user.id + "," + AUTH + ",'" + ip + "')";

        db.query(sql, function(err, rows) {
            if (err) console.log(err);
        })
    })
}