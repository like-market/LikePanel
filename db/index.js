const logger = require('../logger.js')
const mysql = require('mysql');

const db = mysql.createPool({
    connectionLimit: 5,
    host: "localhost",
    user: "devlikepanel",
    database: "devlikepanel",
    password: "r35ImTyr52Ks666",
    charset: 'utf8'
    //timezone: "+7"
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




exports.db = db;

exports.vk = require('./vk.js');
exports.users = require('./users.js');
exports.tasks = require('./tasks.js');
exports.proxy = require('./proxy.js');
exports.finance = require('./finance.js');
exports.comments = require('./comments.js');
exports.activity = require('./activity.js');
exports.posthunter = require('./posthunter.js');

exports.sessionStore = require('./session-store.js');
