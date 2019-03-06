const kue = require('kue')
const queue = kue.createQueue({
	prefix: 'd'
})


exports.queue = queue


// TODO: Отложить подключение очереди т.к. может случиться ситуация
// при которой в редисе задачи есть, а бд и access_token еще не готовы
if (!require('cluster').isMaster) {
	// Увеличиваем кол-во слушателей до 15
	// Т.к. параллельно могут выполнятся до 5 + 3 + 3 задач
	require('events').EventEmitter.defaultMaxListeners = 15;

	/**
	 * Объект с выполняющимися задачами
	 * Нужно чтобы получать доступ из асинхронных функций
	 * @key - id задачи
	 * @value - параметры задачи
	 */
	exports.tasks = { }

	exports.auth = require('./auth.js')
	exports.like = require('./like.js')
	exports.comment = require('./comment.js')
}