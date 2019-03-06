var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
moment.locale('ru');


router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	res.render('profile', {
		moment: moment,
		user: req.user,
		activities: await db.activity.getUserActivity(req.user.id),
		money_add:  await db.finance.getTotalRefill(req.user.id),
		comment_count: await db.tasks.getSumInTask(req.user.id, 'comment'),
		like_count: await db.tasks.getSumInTask(req.user.id, 'like'),
		task_count: await db.tasks.getUserTaskCount(req.user.id)
	});
})

/**
 * Запрос на изменение данных
 * @body new_password - новый пароль
 * @body old_password - старый пароль 
 * @body mail - почта
 */
router.post('/change', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	data = req.body;

	// Форматы для пароля и почты
    const format = /^[a-zA-Z0-9а-яА-Я]+$/;
    const format_email = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/

	if (data.old_password != req.user.password) {
		return res.send('Старый пароль введен неверно');
	}

	if (data.new_password == "" && data.mail == "") {
		return res.send('Нужно изменить почту и/или пароль');
	}

	// Если изменен пароль
	if (data.new_password != "") {
		// Проверяем длину
		if (data.new_password.length < 6 || data.new_password.length > 30) {
			return res.send('Пароль может содержать от 6 до 30 символов')
		}
		// Проверяем на запрещенные символы
		if (!format.test(data.new_password)) {
			return res.send('Пароль может содержать только буквы и цифры')
		}
	}else {
		data.new_password = req.user.password;
	}

	// Если изменена почта
	if (data.mail != "") {
		if (!format_email.test(data.email)) {
			return res.send('Почтовый адрес не валиден')
		}
	}else {
		data.mail = req.user.email
	}


	await db.users.updateData(req.user.username, data.new_password, data.mail);

	res.send('Ok');
})

module.exports = router