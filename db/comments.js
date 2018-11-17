var db = require('./index.js').db;

/**
 * Возвращаем наборы комментариев, которые доступны пользователю
 */
exports.getUserComments = function(user_id) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `comments` WHERE (`owner_id`=" + user_id + " OR `owner_id`=0)";
		sql += " AND `status`<>'inactive'";

		db.query(sql, function(err, rows) {
            if (err) return reject(err) 

            // Превращаем RowDataPacket в json
            var comments = JSON.parse(JSON.stringify(rows));

            return resolve(comments)
        })
    })
}

/**
 * Добавляем новый набор комментариев
 */
exports.add = function(user_id, name, text, count) {
	var sql = "INSERT INTO `comments`(`owner_id`, `status`, `name`, `text`, `count`)"
	sql += " VALUES(" + user_id + ",'checking','" + name + "', '" + text + "'," + count + ")";

	db.query(sql, function(err, rows) {
        if (err) console.log(err);
	});
}

/**
 * Возвращает набор комментариев по его id
 */
exports.get = function(comments_id) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `comments` WHERE `id`=" + comments_id;

		db.query(sql, function(err, rows) {
            if (err) return reject(err) 

            // Превращаем RowDataPacket в json
            var comment = JSON.parse(JSON.stringify(rows[0]));
            return resolve(comment)
        })
	})
}

/**
 * Возвращает неподтвержденный набор комментариев
 * Со смещением offset
 */
exports.getOneChecking = function(offset) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `comments` WHERE `status` = 'checking' AND `id`>" + offset + " LIMIT 1";

		db.query(sql, function(err, rows) {
            if (err) return reject(err) 

            if (rows.length == 0) return resolve(null);

            // Превращаем RowDataPacket в json
            var comment = JSON.parse(JSON.stringify(rows[0]));
            return resolve(comment)
        })
	})
}

/**
 * Изменяем набор комментариев
 * @return void
 */
exports.edit = function(comments_id, name, text, count) {
	process.nextTick(function() {
		var sql = "UPDATE `comments` SET `name`='" + name + "', `text`='" + text + "'";
		sql += ", `count`=" + count + ", `status`='checking' WHERE `id`=" + comments_id;

		db.query(sql, function(err, rows) {
			if (err) console.err(err);
		})
	})
}

exports.setStatus = function(comments_id, status) {
	process.nextTick(function() {
		var sql = "UPDATE `comments` SET `status`='" + status + "' WHERE `id`=" + comments_id;

		db.query(sql, function(err, rows) {
			if (err) console.err(err);
		})
	})
}