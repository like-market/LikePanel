var mysql = require('mysql');

var db = mysql.createConnection({
    host: "localhost",
    database: "likepanel",
    user: "root",
    password: "666666z",
    timezone: '+7'
});

db.connect(function(err) {
    if (err) throw err;
    console.log("Database connected!");
});


exports.db = db;

exports.users = require('./users.js');
exports.tasks = require('./tasks.js');
exports.activity = require('./activity.js');

exports.sessionStore = require('./session-store.js');