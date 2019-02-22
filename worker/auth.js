/**
 * @name /worker/vk.js
 * @description Функции для работы с аккаунтами вк
 */
const queue = require('./index.js').queue;
const logger = require('../logger.js')
const db = require('../db')
const vkapi = require('../vkapi')

/**
 * Добавляем новый аккаунт
 *
 * Алгоритм
 * 1. Проверить что аккаунта нет в БД
 *    Обновляем данные только когда аккаунт не валидный
 * 2. Авторизовать аккаунт
 * 3. Добавить в бд
 *
 * @parallel 5
 * @params {login, password}
 */
queue.process('auth', 1, async function(job, done) {
	const login    = job.data.login
	const password = job.data.password

	const proxy = await db.proxy.getRandom();

	// Проверяем аккаунт в бд
	const account = await db.vk.getAccount(login)
	if (account && account.length != 0) {
		// Изменились ли какие-нибудь данные (пароль)
		if (account.password == password || account.status == 'active') {
			logger.warn('Попытка добавления существующего аккаунта ' + login)
			return done()
		}
	}

	const response = await vkapi.authorize(login, password, proxy);

	// Если неправильный логин или пароль
	if (response.error_type && response.error_type == 'username_or_password_is_incorrect') {
		logger.warn('Не удалось добавить новый аккаунт ' + login + ' - неверый пароль')
		return done()
	}
	if (response.error && response.error == 'need_captcha') {
		logger.error('Нужна капча для авторизации ' + login)
		return done()
	}
	if (response.error && response.error == 'need_validation') {
		logger.warn('Нужна валидация ' + login)
		return done()
	}

	// Если нет токена - значит произошла какая-то ошибка
	if (!response.access_token) {
		logger.error('Неотслеживаемая ошибка ' + login)
		console.log(response)
		return done()
	}

	// На этом этапе авторизация прошла успешно
	if (row && row.length != 0) {
		await db.vk.removeAccount(response.user_id) // Удаляем старую инфу о клиенте
		db.vk.addAccount(response.user_id, login, password, response.access_token, proxy.id)
		logger.info('Обновили данные о пользователе ' + response.user_id)
	}else {
		db.vk.addAccount(response.user_id, login, password, response.access_token, proxy.id)
		logger.info('Добавили нового пользователя ' + response.user_id)
	}
	done()
})