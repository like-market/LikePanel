const db = require('./index.js').db;
const mysql = require('mysql');

const moment = require('moment');
require('moment/locale/ru');

exports.getRequestCount = function(ip) {
	return new Promise(function(resolve, reject) {
		const from = moment().subtract(1, 'days').format();

		const sql = `SELECT COUNT(*) as COUNT FROM forgot_password WHERE ip='${ip}' AND \`create\` > '${from}'`;

		db.query(sql, function(err, rows) {
        	if (err) return reject()

            resolve( rows[0].COUNT )
        })
	})
}

exports.addRequest = function(user_id, token, ip) {
	const sql = `INSERT INTO forgot_password(user_id, token, ip) VALUES(${user_id}, '${token}', '${ip}')`;

	db.query(sql, function(err, rows) {
		console.log(err)
    })
}

exports.getByToken = function(token) {
	return new Promise(function(resolve, reject) {
		const sql = mysql.format("SELECT * FROM forgot_password WHERE token=? AND status='enable'", [token]);

		db.query(sql, function(err, rows) {
        	if (err) return reject()
        	if (rows.length == 0) return resolve(null);

            resolve( JSON.parse(JSON.stringify(rows[0])) );
        })
	})
}

exports.setUsed = function(token_id) {
	return new Promise(function(resolve, reject) {
		const sql = mysql.format("UPDATE forgot_password SET status='apply' where id=?", [token_id]);

		db.query(sql, function(err, rows) {
        	if (err) return reject()
        	resolve();
        })
	})
}