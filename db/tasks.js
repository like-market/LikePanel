var db = require('./index.js').db;
var utils = require('../utils');
const promise = require('promise');

exports.findById = function(id) {
	return new Promise(function(resolve, reject){
        var sql = "SELECT `name`, `url`, `like_need`, `like_now`, `status`, `create`"
        sql += " FROM `tasks` WHERE `user_id`=" + id;
        sql += " ORDER BY `create` DESC";
        
        db.query(sql, function(err, rows) {
        	if (err) return reject(err)

            if (rows.length == 0) return resolve(null)

        	// Превращаем RowDataPacket в json
            var data = JSON.parse(JSON.stringify(rows));
            return resolve(data)    
        })
    });
}

exports.getCount = function(id) {
    return new Promise(function(resolve, reject){
        var sql = "SELECT COUNT(*) as COUNT FROM `tasks` WHERE `user_id`=" + id;
        
        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(null)
            
            // Превращаем RowDataPacket в json
            var data = JSON.parse(JSON.stringify(rows))[0]['COUNT'];
            return resolve(data)
        })
    });
}

exports.createTask = function(user_id, type, name, url, like_need) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `tasks`(`user_id`, `type`, `name`, `url`, `like_need`)"
        sql += " VALUES(" + user_id + ", '" + type + "', '" + name + "', '" + url + "', '" + like_need + "')"

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve(rows.insertId)
        })
    })
}

exports.inrementLikes = function(task_id) {
    return new Promise(function(resolve, reject){
        var sql = "UPDATE `tasks` SET `like_now` = `like_now` + 1"
        sql += " WHERE `id` = " + task_id;
 
        db.query(sql, function(err, rows) {
            if (err) reject(err)
            resolve()
        })
    })    
}

exports.setFinish = function(task_id) {
    return new Promise(function(resolve, reject){
        var sql = "UPDATE `tasks` SET `status` = 'finish' WHERE `id` = " + task_id;

        db.query(sql, function(err, rows) {
            if (err) reject(err)
            resolve()
        })
    })
}

exports.setWait = function(task_id) {
    return new Promise(function(resolve, reject){
        var sql = "UPDATE `tasks` SET `status` = 'wait' WHERE `id` = " + task_id;
        
        db.query(sql, function(err, rows) {
            if (err) reject(err)
            resolve()
        })
    })
}