var mysql = require('mysql');

var db = mysql.createConnection({
    host: "localhost",
    database: "likepanel",
    user: "root",
    password: "666666z"
});
db.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

exports.findById = function(id, cb) {
    process.nextTick(function() {
        var sql = "SELECT * FROM `auth` WHERE `id`=" + id;
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
        var sql = "SELECT * FROM `auth` WHERE `username`='" + username+ "'";
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