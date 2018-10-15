var db = require('./index.js').db;

exports.findById = function(id, cb) {
    process.nextTick(function() {
        var sql = "SELECT * FROM `users` WHERE `id`=" + id;
        db.query(sql, function(err, rows) {
            if (!err && rows.length != 0) {
                var data = JSON.parse(JSON.stringify(rows[0]))
                return cb(err, data)
            }else {
                return cb(err, null)
            }
        })
    });
}

exports.findByUsername = function(username, cb) {
    process.nextTick(function() {
        var sql = "SELECT * FROM `users` WHERE `username`='" + username+ "'";
        db.query(sql, function(err, rows) {
            if (!err && rows.length != 0) {
                var data = JSON.parse(JSON.stringify(rows[0]))
                console.log(data);
                return cb(err, data)
            }else {
                return cb(err, null)
            }
        })
    })
}

exports.getBasicStatistic = function(id, cb) {
    process.nextTick(function() {
        var sql = "SELECT COUNT(*) AS data FROM `tasks` WHERE `user_id`=" + id;
        sql += " UNION SELECT SUM(`data`) FROM `recent_activity` WHERE `type`=2 AND `user_id`=" + id;
        sql += " UNION SELECT SUM(`like_need`) FROM `tasks` WHERE `user_id`=" + id;
        db.query(sql, function(err, rows) {
            if (!err && rows.length != 0) {
                var data = JSON.parse(JSON.stringify(rows))

                var statistic = {};
                statistic.tasks = data[0].data;
                statistic.money = data[1].data;
                statistic.likes = data[2].data;
                statistic.comments = 0;

                return cb(err, statistic)
            }else {
                return cb(err, null)
            }
        })

    })
}

exports.register = function(username, password, email, cb) {
    process.nextTick(function() {
        var sql = "INSERT INTO `users`(username, password, email) VALUES";
        sql += "('" + username + "','" + password + "','" + email + "')";
        db.query(sql, function(err, rows) {
            cb(err);
        })
    })
}