const kue = require('kue')
const queue = kue.createQueue()

exports.queue = queue

exports.vk = require('./vk.js')
exports.like = require('./like.js')