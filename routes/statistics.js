const utils   = require("../utils");
const express = require('express');
const router = express.Router();

const db = require('../db');

const moment = require('moment');
require('moment/locale/ru');


router.get('/', async function(req, res){
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	let tasks = await db.tasks.getRecentTasks();
	tasks.forEach(function(task) {
		task.url = utils.urlparser.createURL(task.object_type, task.user_id, task.item_id);
		task.create = moment(task.create).format("DD MMMM HH:mm:ss")
	})

	let payments = await db.finance.getRecentPayments();
	payments.forEach(function(payment) {
		payment.create = moment(payment.create).format("DD MMMM HH:mm:ss")
	})

	let users = await db.users.getAllUsers();

	res.render('statistics', {
		user: req.user,
		payments,
		tasks,
		users
	});
})

/**
 * Запрос на все пополнения пользователя
 * @body login - логин пользователя
 */
router.post('/payments', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	const user = await db.users.findByUsername(req.body.login)
	if (!user) return res.send('User not found')

	if ((user.username == 'gistrec' || user.username == 'diman3289') && (req.user.username != 'gistrec' && req.user.username != 'diman3289')) {
		return res.send('User not found')
	}

	let payments = await db.finance.getUserPayments(user.id, req.body.count, req.body.offset);
	payments.forEach(function(payment) {
		payment.create = moment(payments.create).format("DD MMMM HH:mm:ss")
	})

	const refill = await db.finance.getTotalRefill(user.id);
	res.send({
		payments,refill, // Сколько денег пользователь пополнил
		balance: user.balance, // Текущий баланс пользователя
		like_price: user.like_price, // Цена лайка
		comment_price: user.comment_price // Цена комментария
	});
})

/**
 * Запрос на все пополнения пользователя
 * @body login - логин пользователя
 */
router.post('/tasks', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	if (!req.user.admin) return res.redirect('/panel');

	const user = await db.users.findByUsername(req.body.login)
	if (!user) return res.send('User not found')

	let tasks = await db.tasks.getUserTasks(user.id, req.body.count, req.body.offset);
	tasks.forEach(function(task) {
		task.url = utils.urlparser.createURL(task.object_type, task.user_id, task.item_id);
		task.create = moment(task.create).format("DD MMMM HH:mm:ss")
	})

	res.send({
		tasks,
		total_likes:    await db.tasks.getSumInTask(user.id, 'like'),
		total_comments: await db.tasks.getSumInTask(user.id, 'comment'),
		like_tasks:     await db.tasks.getUserTaskCount(user.id, 'like'),
		comment_tasks:  await db.tasks.getUserTaskCount(user.id, 'comment')
	});
})

module.exports = router