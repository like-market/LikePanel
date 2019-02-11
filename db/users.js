var db = require('./index.js').db;

exports.findById = function(id) {
    return new Promise(function(resolve, reject){
        var sql = "SELECT * FROM `users` WHERE `id`=" + id;
        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length != 0) {
                var data = JSON.parse(JSON.stringify(rows[0]))
                return resolve(data)
            }else {
                return resolve(null)
            }
        })
    });
}

exports.findByUsername = function(username) {
    return new Promise(function(resolve, reject){
        var sql = "SELECT * FROM `users` WHERE `username`='" + username+ "'";
        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length != 0) {
                var data = JSON.parse(JSON.stringify(rows[0]))
                return resolve(data)
            }else {
                return resolve(null)
            }
        })
    })
}

exports.getBasicStatistic = function(id) {
    return new Promise(function(resolve, reject){
        var sql = "SELECT COUNT(*) AS data FROM `tasks` WHERE `user_id`=" + id;
        sql += " UNION SELECT COALESCE(SUM(`data`), -1) FROM `recent_activity` WHERE `type`='refill' AND `user_id`=" + id;
        sql += " UNION SELECT COALESCE(SUM(`like_need`), -2) FROM `tasks` WHERE `user_id`=" + id;

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            var data = JSON.parse(JSON.stringify(rows))

            var statistic = {};
            statistic.tasks = data[0].data;
            // Говнокод - чтобы делать один запрос, а не три
            statistic.money = data[1].data != -1 ? data[1].data : 0;

            // TODO: Если кол-во лайков равно кол-ву тасков
            if (data[2] == undefined) data[2] = data[1]
            statistic.likes = data[2].data != -2 ? data[2].data : 0;
            statistic.comments = 0;

            return resolve(statistic)
        })

    })
}

exports.register = function(username, password, email) {
    return new Promise(function(resolve, reject){
        var sql = "INSERT INTO `users`(username, password, email) VALUES";
        sql += "('" + username + "','" + password + "','" + email + "')";
        
        db.query(sql, function(err, rows) {
            if (err) return reject(err)
            resolve(true)
        })
    })
}