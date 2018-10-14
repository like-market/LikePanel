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

exports.register = function(username, password, email, cb) {
    process.nextTick(function() {
        var sql = "INSERT INTO `users`(username, password, email) VALUES";
        sql += "('" + username + "','" + password + "','" + email + "')";
        db.query(sql, function(err, rows) {
            cb(err);
        })
    })
}