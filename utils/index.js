exports.vk   = require('./vk.js');
exports.task = require('./task.js');
exports.user = require('./user.js');
exports.urlparser   = require('./urlparser.js');
exports.anticaptcha = require('./anticaptcha.js')

exports.sleep = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция возаращает рандомное значение из массива
Array.prototype.random = function () {
	return this[Math.floor((Math.random() * this.length))];
}