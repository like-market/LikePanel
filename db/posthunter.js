const logger = require('../logger.js')
const db = require('./index.js').db;

exports.getById = function(id) {
	return new Promise(function(resolve, reject) {
		var sql = "SELECT * FROM `posthunter` WHERE `id`=" + id;
		db.query(sql, function(err, rows) {
			var data = JSON.parse(JSON.stringify(rows[0]))
	        return resolve(data);
    	})
    })
}

// Получить все активные группы
exports.getEnabled = function() {
    return new Promise(function(resolve, reject) {
        var sql = "SELECT * FROM `posthunter` WHERE `status`='enable'";

        db.query(sql, function(err, rows) {
            if (err) console.log(err)
            if (!rows.length) return resolve([])

            var data = JSON.parse(JSON.stringify(rows))
            return resolve(data)
        })
    })
}


// Получаем все группы владельца owner_id
exports.getByOwner = function(owner_id) {
    return new Promise(function(resolve, reject) {
        var sql = "SELECT * FROM `posthunter` WHERE `owner_id`=" + owner_id;
        sql += " ORDER BY `status`";

        db.query(sql, function(err, rows) {
            if (err || rows.length == 0) reject(err)

            var data = JSON.parse(JSON.stringify(rows))
            return resolve(data)
        })
    })
}

exports.setStatus = function(id, status) {
	var sql = "UPDATE `posthunter` SET `status`='" + status + "' WHERE `id`=" + id;
	db.query(sql, function(err, rows) {
		if (err) console.log(err);
	});
}

exports.setLastPostId = function(id, post_id) {
    var sql = "UPDATE `posthunter` SET `last_post_id`='" + post_id + "' WHERE `id`=" + id;
    db.query(sql, function(err, rows) {
        if (err) console.log(err);
    });
}