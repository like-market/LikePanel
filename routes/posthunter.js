var logger = require('../logger.js')
var db = require('../db');
var app = require('../app.js');
var utils = require('../utils');
var path  = require("path");
var vkapi = require('../vkapi')
var express = require('express')
var router  = express.Router()

var moment = require('moment');
require('moment/locale/ru');

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	comments = await db.comments.getUserComments(req.user.id, true);
	groups = await db.posthunter.getByOwner(req.user.id); // Получаем все группы

	res.render('posthunter', {user: req.user, comments, groups, moment});
});

/**
 * Добавляем новую группу
 */
router.post('/add', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	// TODO: получить id по названию
})

/**
 * Обновляем статус
 */
router.post('/update_status', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	group = await db.posthunter.getById(req.body.id);
	
	// Проверка прав
	if (group.owner_id != req.user.id) {
		return res.send('Forbidden');
	}
	// Проверка корректности данных
	if (req.body.status != 'enable' && req.body.status != 'disable') {
		return res.send('Invalid data');
	}

	db.posthunter.setStatus(req.body.id, req.body.status);

	res.send('Success')
})

module.exports = router
