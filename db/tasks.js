const db = require('./index.js').db;
const promise = require('promise');


exports.findById = function(task_id) {
    return new Promise(function(resolve, reject){
        var sql = `SELECT * FROM tasks WHERE id= ${task_id}`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(null);

            // resolve( rows.parseSqlResult()[0] );
            resolve( JSON.parse(JSON.stringify(rows))[0] )
        })
    });
}

/**
 * Получаем список задач у пользователя
 * @param user_id - id пользователя
 * @param count  - количество задач
 * @param offset - смещение
 */
exports.getUserTasks = function(user_id, count = 10, offset = 0) {
	return new Promise(function(resolve, reject){
        var sql = `SELECT * FROM tasks WHERE owner_id = ${user_id} ORDER BY \`create\` DESC LIMIT ${count} OFFSET ${offset}`;
        
        db.query(sql, function(err, rows) {
        	if (err) return reject(err)
            if (rows.length == 0) return resolve([])

            // resolve( rows.parseSqlResult() )
            resolve( JSON.parse(JSON.stringify(rows)) )
        })
    });
}


/**
 * Получаем количество задач у пользователя
 * @param owner_id - id пользователя
 * @param type - тип задачи [like, comment]
 */
exports.getUserTaskCount = function(owner_id, type = 'all') {
    return new Promise(function(resolve, reject){
        if (type == 'all') {
            var sql = `SELECT COUNT(*) as COUNT FROM tasks WHERE owner_id=${owner_id}`
        }else {
            var sql = `SELECT COUNT(*) as COUNT FROM tasks WHERE owner_id=${owner_id} AND type=${type}`
        }

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(0)

            // resolve( rows.parseSqlResult()[0]['COUNT'] )
            resolve( JSON.parse(JSON.stringify(rows))[0]['COUNT'] )
        })
    });
}

/**
 * Получаем количество лайков/комментариев в задачах у пользователя
 * @param owner_id - id пользователя
 * @param type - тип задачи [like, comment]
 */
exports.getSumInTask = function(owner_id, type) {
    return new Promise(function(resolve, reject){
        var sql = `SELECT SUM(now_add) as SUM FROM tasks WHERE owner_id=${owner_id} AND type='${type}'`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            if (rows.length == 0) return resolve(0)
            
            // resolve( rows.parseSqlResult()[0]['SUM'] )
            let sum = JSON.parse(JSON.stringify(rows))[0]['SUM'];
            if (sum) return resolve(sum);
            
            resolve(0);
        })
    });
}

/**
 * Создаем задачу
 * @param owner_id    - владелец задачи
 * @param type        - тип задачи [like, comment]
 * @param name        - название задачи
 * @param object_type - тип объекта [post, photo, video, market]
 * @param user_id     - вледелец объекта в вк
 * @param item_id     - идентефикатор объекта в вк
 * @param need_add    - количество лайков/комментов для накрутки
 * @param comment_ids - набор комментариев
 */
exports.createTask = function(owner_id, type, name, object_type, user_id, item_id, need_add, comment_ids = '') {
    return new Promise(function(resolve, reject){
        let sql = "INSERT INTO tasks(owner_id, type, name, object_type, user_id, item_id, need_add, comment_ids) "
        sql    += `VALUES(${owner_id}, '${type}', '${name}', '${object_type}', '${user_id}', '${item_id}', ${need_add}, '${comment_ids}')`;

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            // resolve(rows.insertId)
            resolve( JSON.parse(JSON.stringify(rows)).insertId )
        })
    })
}

/**
 * Увеличить количество добавленных лайков/комментариев
 * @param task_id - id задачи
 */
exports.inrement = function(task_id) {
    return new Promise(function(resolve, reject){
        var sql = `UPDATE tasks SET now_add = now_add + 1 WHERE id = ${task_id}`
 
        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve()
        })
    })    
}

exports.updateCount = function(task_id, count) {
    return new Promise(function(resolve, reject) {
        var sql = `UPDATE tasks SET now_add = ${count} WHERE id = ${task_id}`
 
        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve()
        })
    })     
}

/**
 * Установить статус задаче
 * @param task_id - id задачи
 * @param status  - статус
 */
exports.setStatus = function(task_id, status) {
    return new Promise(function(resolve, reject){
        var sql = `UPDATE tasks SET status = '${status}' WHERE id = ${task_id}`

        db.query(sql, function(err, rows) {
            if (err) return reject(err)

            resolve()
        })
    })
}