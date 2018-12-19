const kue = require('kue')
const queue = kue.createQueue()

exports.queue = queue

// TODO: Отложить подключение очереди т.к. может случиться ситуация
// при которой в редисе задачи есть, а бд и access_token еще не готовы
exports.vk = require('./vk.js')
exports.like = require('./like.js')
exports.comment = require('./comment.js')