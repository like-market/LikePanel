var express = require("express");
var db = require("../db");
var router = express.Router();
var path = require("path");

router.get("/", function(req, res) {
    if (req.isAuthenticated()) return res.redirect("/tasks");
    res.render('register');
});

router.post("/", async function(req, res) {
    // Формат для логина и пароля
    const format = /^[a-zA-Z0-9а-яА-Я]+$/;
    // Формат для почты
    const format_email = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/
    
    // Проверка пароля [длина, проверка запрещенных символов, совпадение паролей]
    let password = req.body.password;
    if (password.length < 6 || password.length > 30 || !format.test(password) || password != req.body.repeatpassword) {
        return res.send("Ошибка с паролем");
    }

    // Проверка логина [длина, наличие запрещенных символов]
    let username = req.body.username.toLowerCase();
    if (username.length < 5 || username.length > 20 || !format.test(username)) {
        return res.send("Ошибка с логином");
    }

    // Проверка почты [длина, совпадение с паттерном]
    let email = req.body.email.toLowerCase();
    if (email.length > 50 || !format_email.test(email)) {
        return res.send("Ошибка с почтой");
    }

    // Проверка на то, что ник уже занят
    let user = await db.users.findByUsername(username);
    if (user != null) return res.send("User already exist");

    // Регестрируем клиента
    await db.users.addUser(username, password, email);
    user = await db.users.findByUsername(username);

    // Авторизуем пользователя
    req.login(user, function(err) {
        if (err) return console.error(err);
        res.send("Success");

        // ip = req.connection.remoteAddress.split(":").pop();
        ip = req.headers["x-real-ip"].split(":").pop(); // Nginx IP
        db.activity.addActivity(user.id, 'register', ip);
    });
});

module.exports = router;
