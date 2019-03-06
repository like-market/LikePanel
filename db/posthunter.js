const logger = require('../logger.js')
const db = require('./index.js').db;

/**
 * Добавляем новую группу в постхантер
 */
exports.add = function(owner_id, group_id, name, last_post_id, min_likes,
                       max_likes, min_comments, max_comments, comments_ids)
{
    var sql = "INSERT INTO posthunter(owner_id, group_id, name, last_post_id, min_likes,"
    sql += "max_likes, min_comments, max_comments, comments_ids, status) VALUES("
    sql += owner_id + ", '" + group_id + "', '" + name + "', " + last_post_id + ", " + min_likes + ", " 
    sql += max_likes + ", " + min_comments + ", " + max_comments + ", '" + comments_ids + "', 'enable')";

    console.log(sql);
    db.query(sql, function(err, rows) {
        if (err) console.log(err)
    });
}

/**
 * Удаляем постхантер
 */
exports.delete = function(group_id) {
    var sql = `UPDATE posthunter SET status='removed' WHERE id=${group_id}`;
    db.query(sql, function(err, rows) {
        if (err) console.log(err);
    }); 
}

exports.getByGroupId = function(group_id) {
    return new Promise(function(resolve, reject) {
        var sql = "SELECT * FROM `posthunter` WHERE `group_id`=" + group_id;
        db.query(sql, function(err, rows) {
            if (!rows.length) return resolve([])

            var data = JSON.parse(JSON.stringify(rows[0]))
            return resolve(data);
        })
    })
}

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
        var sql = `SELECT * FROM posthunter WHERE owner_id=${owner_id} AND (status='enable' OR status='disable')`;
        sql += " ORDER BY `status`";

        db.query(sql, function(err, rows) {
            if (err) reject(err);
            if (!rows.length) return resolve([]);

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
