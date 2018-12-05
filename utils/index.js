exports.vk   = require('./vk.js');
exports.task = require('./task.js');
exports.user = require('./user.js');
exports.anticaptcha = require('./anticaptcha.js')

exports.sleep = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}