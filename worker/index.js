const kue = require('kue')
const queue = kue.createQueue({
	prefix: 'd'
})

/**
 * Объект с выполняющимися задачами
 * Нужно чтобы получать доступ из асинхронных функций
 * @key - id задачи
 * @value - параметры задачи
 */

exports.queue = queue


// TODO: Отложить подключение очереди т.к. может случиться ситуация
// при которой в редисе задачи есть, а бд и access_token еще не готовы
if (!require('cluster').isMaster) {
	exports.tasks = { }

	exports.auth = require('./auth.js')
	exports.like = require('./like.js')
	exports.comment = require('./comment.js')
}