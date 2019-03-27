const logger = require('../logger.js')
const db = require('./index.js').db;
const mysql = require('mysql');
/**
 * Добавляем новую группу в постхантер
 * @param owner_id      - Владелец записи в постхантере
 * @param name          - Название записи в постхантере
 * @param group_id      - ID группы/страницы
 * @param last_post_id   - ID последнего поста
 * @param min_likes - Минимальное  количество лайков
 * @param max_likes - Максимальное количество лайков
 * @param min_comments - Минимальное  количество комментариев
 * @param max_comments - Максимальное количество комментариев
 * @param comments - ID наборов комментариев
 * @param autostop - Останавливать ли накрутку после нахождения первого поста
 * @param time_from - Со скольки по МСК лайкаем
 * @param time_to   - До скольки по МСК лайкаем
 * @param like_ads     - Лайкать ли посты с рекламной меткой
 * @param like_repost  - Лайкать ли посты со скрытой рекламой
 * @param like_content - Лайкать ли посты с контентом 
 * @param entry_text - Какой текст ищем
 */
exports.add = function(owner_id, name, group_id, last_post_id, min_likes, max_likes,
                       min_comments, max_comments, comments, autostop, time_from, time_to,
                       like_ads, like_repost, like_content, entry_text)
{
    var sql = "INSERT INTO posthunter(owner_id, name, group_id, last_post_id, min_likes,"
    sql    += "max_likes, min_comments, max_comments, comments_ids, autostop, time_from, time_to, like_ads, like_repost, like_content, entry_text, status)"
    sql    += " VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enable')"

    var sql = mysql.format(sql, [owner_id, name, group_id, last_post_id, min_likes, max_likes, min_comments, max_comments, comments, autostop, time_from, time_to, like_ads, like_repost, like_content, entry_text]);

    db.query(sql, function(err, rows) {
        if (err) console.log(err)
    });
}

exports.changeData = function(id, name, group_id, last_post_id, min_likes, max_likes,
                              min_comments, max_comments, comments, autostop, time_from, time_to,
                              like_ads, like_repost, like_content, entry_text)
{
    var sql = "UPDATE posthunter SET name=?, group_id=?, last_post_id=?, min_likes=?,"
    sql    += "max_likes=?, min_comments=?, max_comments=?, comments_ids=?, autostop=?, time_from=?, time_to=?, like_ads=?, like_repost=?, like_content=?, entry_text=?"
    sql    += " WHERE id=?"

    var sql = mysql.format(sql, [name, group_id, last_post_id, min_likes, max_likes, min_comments, max_comments, comments, autostop, time_from, time_to, like_ads, like_repost, like_content, entry_text, id]);

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
        var sql = mysql.format('SELECT * FROM `posthunter` WHERE `id`=?', [id]);

		db.query(sql, function(err, rows) {
			if (!rows.length) return resolve(null);

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
        var sql = `SELECT * FROM posthunter WHERE owner_id=${owner_id} AND (status='enable' OR status='disable' OR status='pause')`;
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

/**
 * Установка id последнего поста
 */
exports.setLastPostId = function(id, post_id) {
    var sql = `UPDATE posthunter SET last_post_id=${post_id} WHERE id=${id}`;
    console.log(sql);
    db.query(sql, function(err, rows) {
        if (err) console.log(err);
    });
}

/**
 * Установка времени последнего обновления
 */
exports.setLastUpdateTime = function(id, date) {
    var sql = `UPDATE posthunter SET last_update='${date}' WHERE id=${id}`;

    db.query(sql, function(err, rows) {
        if (err) console.log(err);
    });
}