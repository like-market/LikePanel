var db = require('./index.js').db;
var utils = require('../utils');
const promise = require('promise');

exports.findById = function(id, cb) {
	process.nextTick(function() {
        var sql = "SELECT `name`, `url`, `like_need`, `like_now`, `status`, `create`"
        sql += " FROM `tasks` WHERE `user_id`=" + id;
        sql += " ORDER BY `create` DESC";
        
        db.query(sql, function(err, rows) {
        	
            if (!err && rows.length != 0) {
            	// Превращаем RowDataPacket в json
                var data = JSON.parse(JSON.stringify(rows));
                return cb(err, data)
            }else {
                return cb(err, null)
            }
        })
    });
}

exports.getCount = function(id, cb) {
    process.nextTick(function() {
        var sql = "SELECT COUNT(*) as COUNT FROM `tasks` WHERE `user_id`=" + id;
        
        db.query(sql, function(err, rows) {
            if (!err && rows.length != 0) {
                // Превращаем RowDataPacket в json
                var data = JSON.parse(JSON.stringify(rows))[0]['COUNT'];
                return cb(err, data)
            }else {
                return cb(err, null)
            }
        })
    });
}

exports.createTask = function(user_id, type, name, url, like_need, cb) {
    var sql = "INSERT INTO `tasks`(`user_id`, `type`, `name`, `url`, `like_need`)"
    sql += " VALUES(" + user_id + ", '" + type + "', '" + name + "', '" + url + "', '" + like_need + "')"

    db.query(sql, function(err, rows) {
        if (err) return console.error(err)
        
        sql = "SELECT LAST_INSERT_ID() AS id"

        db.query(sql, function(err, rows) {
            var id = JSON.parse(JSON.stringify(rows[0]))['id'];

            cb(null, id)
        })
    })
}

exports.inrementLikes = function(task_id) {
    process.nextTick(function() {
        var sql = "UPDATE `tasks` SET `like_now` = `like_now` + 1"
        sql += " WHERE `id` = " + task_id;
 
        db.query(sql, function(err, rows) {
            if (err) console.error(err)
        })
    })    
}

exports.setFinish = function(task_id) {
    process.nextTick(function() {
        var sql = "UPDATE `tasks` SET `status` = 'finish' WHERE `id` = " + task_id;

        db.query(sql, function(err, rows) {
            if (err) console.error(err)
        })
    })
}

exports.setWait = function(task_id) {
    process.nextTick(function() {
        var sql = "UPDATE `tasks` SET `status` = 'wait' WHERE `id` = " + task_id;
        
        db.query(sql, function(err, rows) {
            if (err) console.error(err)
        })
    })
}