const express = require('express')
const router = express.Router()

const db = require('../db');

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const passport = require('passport')
const Strategy = require('passport-local').Strategy;


passport.use(new Strategy(
    async function(username, password, cb) {
        let user;

        // Если это почта
        if (username.indexOf('@') > -1) {
            user = await db.users.findByMail(username);
        }else {
            user = await db.users.findByUsername(username);
        }

        if (!user) {
            return cb(null, false);
        }
        if (user.password != password) {
            return cb(null, false);
        }
        return cb(null, user);
    }
));
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(async function(user_id, cb) {
    user = await db.users.findById(user_id)
    cb(null, user);
});


router.use(cookieParser());
router.use(bodyParser.json());       // To support JSON-encoded bodies
router.use(bodyParser.urlencoded({   // To support URL-encoded bodies
    extended: true
}));


router.use(session({
    secret: 'KJjsdz',
    store: db.sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 5 } // 5 дней
}))

router.use(passport.initialize());
router.use(passport.session());


router.get('/logout', function(req, res){ 	
	req.logout();
	res.redirect('/login');
});

// Вывод главной страницы
router.get('/', function(req, res) {
    // Если юзер авторизован - перенаправляем его в панель
    if (req.isAuthenticated()) return res.redirect("/addtask");
	
    res.render('index')
})

router.use('/api', require('./api.js'));
router.use('/admin', require('./admin.js'));
router.use('/statistics', require('./statistics/main.js'));
router.use('/account_group', require('./statistics/account_group.js'));

router.use('/login', require('./login.js'));
router.use('/register', require('./register.js'));
router.use('/forgotPassword', require('./fgtpwd.js'));

router.use('/news', require('./news.js'));
router.use('/tasks', require('./tasks.js'));
router.use('/payment', require('./payment.js'));
router.use('/support', require('./support.js'));
router.use('/profile', require('./profile.js'));
router.use('/comments', require('./comments.js'));

router.use('/addtask', require('./addTask.js'));
router.use('/posthunter', require('./posthunter.js'));

// Вывод страницы 404
router.use(function(req, res) {
	res.status(404).render('error')
})


module.exports = router
