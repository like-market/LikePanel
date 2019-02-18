const express = require('express')
const router = express.Router()
const logger = require('../logger.js')
const utils = require('../utils');
const db = require('../db');

const moment = require('moment');
require('moment/locale/ru');


router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	let transactions = await db.finance.getBalanceHistory(req.user, 15);

	res.render('payment', {
		moment: moment,
		user: req.user,
		transactions: transactions
	});
})

/**
 * Запрос на создание счета
 * @body amount - количество денег (в рублях)
 */
router.post('/pay', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	if (parseInt(req.body.amount) != req.body.amount /* || req.body.amount < 100 */ ) {
		return res.send('Error');
	}

	const url = await utils.payment.createBill(req.user, req.body.amount);
	res.send(url);
}) 

/**
 * Получаем данные после оплаты платежа с any-pay.org
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