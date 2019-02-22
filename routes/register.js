var express = require("express");
var db = require("../db");
var router = express.Router();
var path = require("path");

router.get("/", function(req, res) {
    if (req.isAuthenticated()) return res.redirect("/tasks");

    res.sendFile(path.join(__dirname + "/../public/register.htm"));
});

router.post("/", async function(req, res) {
    // Если одно из полей - пустое
    if (
        req.body.password == "" ||
        req.body.username == "" /*|| req.body.email == ""*/
    ) {
        return res.send("Empty field");
    }

    // Если пароли не совпадают
    if (req.body.password != req.body.repeatpassword) {
        return res.send("Password no match");
    }

    // Проверка на то, что ник уже занят
    user = await db.users.findByUsername(req.body.username);
    if (user != null) return res.send("User already exist");

    // Регестрируем клиента
    await db.users.register(req.body.username, req.body.password, req.body.email);
    user = await db.users.findByUsername(req.body.username);

    req.login(user, function(err) {
        if (err) return console.error(err);
        res.send("Success");

        // ip = req.connection.remoteAddress.split(":").pop();
        ip = req.headers["x-real-ip"].split(":").pop(); // Nginx IP
        db.activity.addActivity(user.id, 'register', ip);
    });
});

module.exports = router;
