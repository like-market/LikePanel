var db = require('./index.js').db;

exports.findById = function(id, cb) {
	process.nextTick(function() {
        var sql = "SELECT `name`, `url`, `like_need`, `like_now`, `status`, `create`"
        sql += "FROM `tasks` WHERE `user_id`=" + id;
        
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
