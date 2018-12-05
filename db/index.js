const logger = require('../logger.js')
var mysql = require('mysql');

var db = mysql.createPool({
    connectionLimit : 5,
    host: "localhost",
    database: "likepanel",
    user: "root",
    password: "666666z",
    //timezone: "+7"
});

db.on('connection', function (connection) {
    var options = "SET character_set_client='utf8mb4';"
    options += "SET character_set_connection='utf8mb4';"
    options += "SET character_set_results='utf8mb4';"
    options += "SET NAMES utf8mb4;"

    connection.query(options)
});




exports.db = db;

exports.vk = require('./vk.js');
exports.users = require('./users.js');
exports.tasks = require('./tasks.js');
exports.finance = require('./finance.js');
exports.comments = require('./comments.js');
exports.activity = require('./activity.js');

exports.sessionStore = require('./session-store.js');
