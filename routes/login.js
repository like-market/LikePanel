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
  passport.authenticate("local", function(err, user, info) {
    if (err) return next(err);

    // Если не найден пользователь
    if (!user) {
      return res.send("Unauthorized");
    }

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
