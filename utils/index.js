exports.proxy = require('./proxy.js');

exports.vk   = require('./vk.js');
exports.task = require('./task.js');
exports.user = require('./user.js');
exports.lang = require('./lang.js');
exports.payment  = require('./payment.js');
exports.urlparser   = require('./urlparser.js');
exports.posthunter  = require('./posthunter.js');
exports.anticaptcha = require('./anticaptcha.js');

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

Array.prototype.includeOnlyNumbers = function() {
	let numbers = true;
	this.forEach(function(elem) {
		if (parseInt(elem) != elem) numbers = false;
	})
	return numbers;
}

String.prototype.replaceArray = function(find, replace) {
	let replaceString = this;
	let regex;
	for (let i = 0; i < find.length; i++) {
		regex = new RegExp(find[i], "g");
		replaceString = replaceString.replace(regex, replace[i]);
	}
	return replaceString;
}

/**
 * Получаем время с ведущими нулями, если нужно
 */
Date.prototype.getFullMinutes = function() {
	if (this.getMinutes() <= 9) return `0${this.getMinutes()}`;
	return this.getMinutes()
}
Date.prototype.getFullHours = function() {
	if (this.getHours() <= 9) return `0${this.getHours()}`;
	return this.getHours()
}

/**
 * Преобразуем время к формату mysql TIMESTAMP
 */
Date.prototype.toMySQL = function() {
	let utc = this.getTime();
	this.setTime(utc - this.getTimezoneOffset() * 60000) // Смещение на часовой пояс
	let result = this.toISOString().substring(0, 19).replace('T', ' ')
	this.setTime(utc);
	return result;
}

Object.prototype.parseSqlResult = function () {
    return JSON.parse(JSON.stringify(this));
};

/**
 * Проверяем наличие всех параметров в теле запроса
 * @param params - массив параметров
 */
exports.needBodyParams = function(params) {
	return function(req, res, next) {
		for (let param of params) {
			if (req.query[param]) req.body[param] = req.query[param];

			if (typeof req.body[param] == 'undefined') {
				return res.send(`Не задан параметр ${param}`)
			}
		}
    	next();
  	}
}

/**
 * Проверяем авторизован ли юзер
 * @param redirect - перемещать ли на страницу /login
 */
exports.needAuth = function(redirect) {
	return function(req, res, next) {
		if (!req.isAuthenticated()) {
			if (redirect) return res.redirect('/login');
			else res.send('Ошибка авторизации')
		}
    	next();
  	}
}