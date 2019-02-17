var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
require('moment/locale/ru');

// Секретнйы ключ
const secret = "9JUhp8Pqw4mObBl";


router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	let transactions = await db.finance.getBalanceHistory(req.user, 15);
	console.log(req.query)
	res.render('payment', {
		moment: moment,
		user: req.user,
		transactions: transactions
	});
})

/**
 * Получаем данные после оплаты платежа с any-pay.org
 */
router.post('/result', async function(req, res) {
	console.log(req.body)
	
	res.send('Ok');
})


module.exports = router