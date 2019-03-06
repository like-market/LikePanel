var passport = require("passport");
var path = require("path");
var express = require("express");
var router = express.Router();
var db = require("../db");

router.get("/", function(req, res) {
    // Если юзер авторизован - перенаправляем его в панель
    if (req.isAuthenticated()) return res.redirect("/tasks");
    res.sendFile(path.join(__dirname + "/../public/login.htm"));
});

router.post("/", function(req, res, next) {
    // Приводим логин к нижнему регистру
    req.body.username = req.body.username.toLowerCase();
    
    // Формат для логина и пароля
    const format = /^[a-zA-Z0-9а-яА-Я]+$/;
    
    // Проверка пароля [длина, проверка запрещенных символов, совпадение паролей]
    let password = req.body.password;
    if (password.length < 6 || password.length > 30 || !format.test(password)) {
        return res.send("Ошибка с паролем");
    }

    // Проверка логина [длина, наличие запрещенных символов]
    let username = req.body.username.toLowerCase();
    if (username.length < 5 || username.length > 20 || !format.test(username)) {
        return res.send("Ошибка с логином");
    }

    passport.authenticate("local", function(err, user, info) {
        if (err) return next(err);

        // Если не найден пользователь
        if (!user) return res.send("Unauthorized")

        // Пытаемся авторизовать
        req.logIn(user, function(err) {
            if (err) return next(err);
            res.send("Success");

            // ip = req.connection.remoteAddress.split(":").pop();
            ip = req.headers["x-real-ip"].split(":").pop(); // Nginx IP
            db.activity.addActivity(user.id, 'auth', ip);
        });
    })(req, res, next);
});

module.exports = router;
