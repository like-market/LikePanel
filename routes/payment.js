const express = require('express')
const router = express.Router()
const config = require('../config.js')
const logger = require('../logger.js')
const utils = require('../utils');
const db = require('../db');

const moment = require('moment');
require('moment/locale/ru');

const min_payment = config.payment.min; // Минимальный размер пополнения
const max_payment = config.payment.max; // Максимальный размер пополнения

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	res.render('payment', {
		min_payment,
		max_payment,
		moment: moment,
		user: req.user,
		// Последние 10 транзакций
		last_transactions: await db.finance.getUserTransactions(req.user.id, 10),
		// Транзакции за последние 15 дней
		transactions: await db.finance.getBalanceHistory(req.user, 15),
		transactions_count: await db.finance.getTransactionsCount(req.user),
	});
})

/**
 * Получаем список транзакций
 * @rapam count  - количество задач
 * @param offset - смещение
 */
router.post('/get_transactions', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	if (parseInt(req.body.count)  != req.body.count || parseInt(req.body.offset) != req.body.offset) {
		return res.send('Error params');
	}

	transactions = await db.finance.getUserTransactions(req.user.id, req.body.count, req.body.offset);
	
	// Форматируем время
	transactions.forEach(function(trx) {
		trx.date = moment(trx.date).format("DD MMMM YYYY")
	})
	res.send(JSON.stringify(transactions))
})

/**
 * Запрос на создание счета
 * @body amount - количество денег в рублях
 */
router.post('/pay', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	if (parseInt(req.body.amount) != req.body.amount || req.body.amount < min_payment || req.body.amount > max_payment) {
		return res.send(`Пополнять можно от ${min_payment}₽ до ${max_payment}₽`);
	}

	const url = await utils.payment.createBill(req.user, req.body.amount);
	res.send(url);
}) 

/**
 * Получаем данные после оплаты платежа с any-pay.org
 * @body pay_id - счет платежа в таблице payment
 * @body amount - количество денег в рублях
 * @body sign   - контрольная подпись платежа
 */
router.post('/result', async function(req, res) {
	// Проверяем IP
	ip = req.headers["x-real-ip"].split(":").pop();
	if (ip != '185.162.128.88') {
		logger.warn(`Получены сведения об оплате с некорректного IP: ${ip}`)
		console.log(req.body, req.query);
		return res.send('Error IP')
	}

	utils.payment.checkBill(req.body.pay_id, req.body.amount, req.body.sign);

	res.send('Ok');
})

module.exports = router