var express = require('express')
var router = express.Router()


router.use('/vendor', express.static('public/vendor'))
router.use('/styles', express.static('public/styles'))
router.use('/images', express.static('public/images'))
router.use('/scripts', express.static('public/scripts'))


router.get('/logout', function(req, res){ 	
	req.logout();
	res.redirect('/login');
});


router.use('/admin', require('./admin.js'));
router.use('/panel', require('./panel.js'));
router.use('/login', require('./login.js'));
router.use('/register', require('./register.js'));
router.use('/forgotPassword', require('./forgotPassword.js'));

router.use('/news', require('./news.js'));
router.use('/tasks', require('./tasks.js'));
router.use('/support', require('./support.js'));
router.use('/profile', require('./profile.js'));
router.use('/addtask', require('./addTask.js'));
router.use('/comments', require('./comments.js'));

module.exports = router