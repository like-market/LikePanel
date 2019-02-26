exports.vk   = require('./vk.js');
exports.task = require('./task.js');
exports.user = require('./user.js');
exports.payment  = require('./payment.js');
exports.urlparser   = require('./urlparser.js');
exports.posthunter  = require('./posthunter.js');
exports.anticaptcha = require('./anticaptcha.js')

exports.sleep = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

exports.randInt = function(min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1)
    return Math.round(rand);
}

// Функция возаращает рандомное значение из массива
Array.prototype.random = function () {
	return this[Math.floor((Math.random() * this.length))];
}

Array.prototype.popRandom = function() {
	return this.splice(Math.floor(Math.random() * this.length), 1)[0];
}

/*
Object.prototype.parseSqlResult = function () {
    return JSON.parse(JSON.stringify(this))
}
*/