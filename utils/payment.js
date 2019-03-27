const db = require('../db');
const md5 = require('md5');
const utils  = require('../utils')
const logger = require('../logger.js')
const querystring = require('querystring');
const axios = require('axios')

// wUAlQ4H155j3OyQ
const secret_key = 'VdTH9K2lTBE3V9q'; // Секретный ключ
const merchant_id = 3567;             // ID проекта в системе «AnyPay»

/**
 * Создаем новый счет для оплаты в системе AnyPay
 * @param user - пользователь
 * @param amount - количество денег (в рублях)
 */
exports.createBill = async function(user, amount) {
	// Создаем счет, получаем его id
	const pay_id = await db.finance.createBill(user.id, amount);

	// Создаем подпись
	const sign = md5(`RUB:${amount}:${secret_key}:${merchant_id}:${pay_id}`)
	const desc = `Пополнение баланса пользователя ${user.username} на ${amount}₽`;

	params = {
		merchant_id, // ID проекта в системе «AnyPay»
		amount,     // Сумма к оплате
		currency: "RUB", // Валюта платежа по стандарту ISO 4217 (RUB, USD, EUR)
		pay_id, // Идентификатор платежа в моей системе
		desc,   // Описание платежа
		sign    // Подпись платежа
	}

	return 'https://any-pay.org/merchant?' + querystring.stringify(params);
}

/**
 * Проверяем информацию от агрегатора об оплаченом платеже
 * @param pay_id - идентификатор счета
 * @amount - количество (в рублях)
 * @sign   - подпись
 */
exports.checkBill = async function(pay_id, amount, sign) {
	const bill = await db.finance.getBill(pay_id);

	// Проверяем данные, которые пришли с платежного агрегатора
	if (!bill || bill.status != 'not paid' || bill.amount != amount) {
		logger.warn(`Данные не корректны pay_id: ${pay_id}  amount: ${amount}`)
		console.log(bill)
		return;
	}

	const verify = md5(`${merchant_id}:${amount}:${pay_id}:${secret_key}`);
	if (sign != verify) {
		logger.warn(`Подписи не совпадают  pay_id: ${pay_id}  amount: ${amount}`)
		return;
	}

	user = await db.users.findById(bill.user_id);

	const blocks = ['dnoarta', 'z74enkf3'];
	if (blocks.indexOf(user.username) != -1) {
		console.log(`${user.username} хотел пополнить баланс, по пошел на хуй`);
		return;
	}

	utils.user.changeBalance(user, 'add', amount * 1000, `Пополнение баланса. Платеж №${pay_id}`);
	db.finance.setBillStatus(pay_id, 'paid');


	/** Раздел акций */
	if (amount >= 1000) {
		let bonus = Math.ceil(amount / 10) // Получаем 10% от пополненной суммы
		utils.user.changeBalance(user, 'add', bonus * 1000, `Бонус к платежу №${pay_id}`);
	}


	// СМС о пополнении
	{
		const params = {
			login: "gistrec",
			psw: "SibXavxq4H8eseE",
			phones: "+79617370099",
			mes: `${user.username} пополнил ${amount} рублей`
		}
		axios.get('https://smsc.ru/sys/send.php', {params} );
	}

	logger.info(`Пользователь ${user.username} пополнил баланс на ${amount} рублей`);
}