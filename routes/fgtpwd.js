const express = require('express')
const router = express.Router()
const db = require('../db');

const fgtpwd = require('../utils/fgtpwd.js');


router.get('/', async function(req, res) {
	// Если юзер авторизован - перенаправляем его в панель
	if (req.isAuthenticated()) return res.redirect('/tasks');
	
    // Если в параметрах передан токен
    if (req.query.token) {
        // Поиск данных по токену
        const data = await db.fgtpwd.getByToken(req.query.token); // Используется escapeString
        
        // Если токен найден
        if (data) {
            const password = await fgtpwd.generateNewPassword(data.id, data.user_id);
            res.render('forgotPassword', { need_fields: false, password });
        // Если токен не найден
        }else {
            res.render('forgotPassword', { need_fields: false, password: false });
        }
    }else {
        res.render('forgotPassword', { need_fields: true });
    }
});

router.post('/send', async function(req, res) {
	// Приводим почту или логин к нижнему регистру
    const data = req.body.data.toLowerCase();

    // Формат для логина и пароля
    const login = /^[a-zA-Z0-9а-яА-Я]+$/;
    // Формат для почты
    const mail = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/

    let type;

    // Если вход по логину
    if (login.test(data)) {
        // Проверка длины логина
        if (data.length < 5 || data.length > 20) {
            return res.send('Логин может содержать от 5 до 20 символов')
        }
        type = 'login';
    // Если входим по почте
    } else if (mail.test(data)) {
        if (data.length > 50) {
            return res.send("Почта может содержать до 50 символов");
        }
        type = 'mail';
    // Если написан ни логин, ни почта
    } else {
        return res.send("Неправильный логин или почта")
    }

    if (type == 'login') {
    	var user = await db.users.findByUsername(data)
    }
    if (type == 'mail') {
    	var user = await db.users.findByMail(data)
    }
    if (!user) return res.send('Ok');

    const ip = req.headers["x-real-ip"].split(":").pop(); // Nginx IP
    fgtpwd.requestPassword(user, ip);

    res.send('Ok')
})

module.exports = router