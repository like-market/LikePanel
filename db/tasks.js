var db = require('./index.js').db;

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

/*exports.addTask = function(user_id, type, name, url, like_need) {
    var sql = "INSERT INTO `tasks`(`user_id`, `type`, `name`, `url`, `like_need`)"
    sql += " VALUES(" + user_id + ", '" + type + "', '" + name + "', '" + url + "', '" + like_need + "')"

    db.query(sql, function(err, rows) {
        if (err) console.error(err)
    })
}*/