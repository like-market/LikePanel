const config = require('../config.js')
const logger = require('../logger.js')
const mysql = require('mysql');

const db = mysql.createPool({
    connectionLimit: 5,
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    database: config.db.database,
    password: config.db.password,
    charset: 'utf8mb4'
});

db.on('connection', function (connection) {
    logger.info("Подключение к БД прошло успешно");

    var options = "SET character_set_client='utf8mb4';"
    options += "SET character_set_connection='utf8mb4';"
    options += "SET character_set_results='utf8mb4';"
    options += "SET NAMES utf8mb4;"

    connection.query(options)
});

db.on('error', function(err) {
    logger.warn("Ошибка при подключении к бд")
    console.log(err);
    process.exit(1);
})

// Асинхронный запрос
exports.async_query = function(query) {
    return new Promise(function(resolve, reject) {
        db.query(query, function(err, rows) {
            if (err) {
                logger.error(query);
                logger.error(err);
                reject(err);
            }

            if (rows === undefined) resolve(undefined);
            else resolve(rows.parseSqlResult());
        });
    });
};

// TODO: Убрать
// Перегрузка функции query
exports.query = function(sql, callback) {
    db.query(sql ,callback);
};


exports.db = db;

exports.vk = require('./vk.js');  // Аккаунты вк
exports.users = require('./users.js'); // Пользователи на сайте
exports.block = require('./block.js'); // Черный список групп
exports.tasks = require('./tasks.js'); // Задачи
exports.proxy = require('./proxy.js'); // Прокси
exports.fgtpwd = require('./fgtpwd.js');   // Данные для восстановления пароля
exports.finance = require('./finance.js'); // Финансовая часть
exports.comments = require('./comments.js'); // Наборы комментариев
exports.activity = require('./activity.js'); // Активность пользовател
exports.posthunter = require('./posthunter.js'); // Постхантер
exports.accounts_group = require('./accounts_group.js'); // Наборы аккаунтов

exports.sessionStore = require('./session-store.js');
