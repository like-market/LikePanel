const db = require('./index.js').db;
const logger = require('../logger.js')

/**
 * Возвращаем наборы комментариев, которые доступны пользователю
 * @param activeOnly - получаем только активные наборы
 */
exports.getUserComments = function(user_id, activeOnly = false) {
	return new Promise(function(resolve, reject){
		var sql = "SELECT * FROM `comments` WHERE (`owner_id`=" + user_id + " OR `owner_id`=0)";
		if (activeOnly) sql += " AND `status`='accept'";
		else sql += " AND `status`<>'inactive'";

		db.query(sql, function(err, rows) {
            if (err) return reject(err) 

            // Превращаем RowDataPacket в json
            var comments = JSON.parse(JSON.stringify(rows));

            return resolve(comments)
        })
    })
}

/**
 * Получаем массив комментариев
 * @param ids - список id наборов комментариев
 */
exports.getComments = function(ids) {
	return new Promise(async function(resolve, reject) {
		var sql = "SELECT `type`, `text` FROM `comments` WHERE "
		for (i = 0; i < (ids.length - 1); i++) {
			sql += "`id`=" + ids[i] + " OR "
		}
		sql += "`id`=" + ids[ids.length - 1]

		db.query(sql, function(err, rows) {
        	if (err) console.log(err);
        	// Наборы комментариев
        	const sets = JSON.parse(JSON.stringify(rows));
			
			// Объекты комментариев
			// {type: text/sticker, value: 'комментарий/id стикера'}
        	var comments = [];

        	// Для всех наборов
        	for (let set of sets) {
        		// Для всех комментариев в наборе
        		for (comment of set.text.split('|||')) {
        			comments.push({type: set.type, value: comment})
        		}
        	}
        	resolve(comments);
		});
	})
}

/**
 * Получаем массив с данными комментариев
 * @param ids - список id наборов комментариев
 */
exports.getCommentsData = function(ids) {
	return new Promise(async function(resolve, reject) {
		var sql = "SELECT `owner_id`, `status` FROM `comments` WHERE "
		for (i = 0; i < (ids.length - 1); i++) {
			sql += "`id`=" + ids[i] + " OR "
		}
		sql += "`id`=" + ids[ids.length - 1]

		db.query(sql, function(err, rows) {
			if (err) {
				logger.error(err);
				return resolve([]);
			}
        	if (rows.length == 0) return resolve([])

        	resolve( JSON.parse(JSON.stringify(rows)) );
		});
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