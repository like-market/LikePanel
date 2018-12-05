const logger = require('../logger.js')
const db = require('../db');
const vkapi = require('../vkapi');

const utils = require('../utils')

const axios = require('axios');

exports.random_access_token = null;


/**
 * Функция нужна для получения любого валидного токена из бд
 * Токен нужен в процессе работы скрипта - чтобы проверять записи, например
 */
exports.getRandomToken = async function() {
    while (exports.random_access_token == null) {
        var account = await db.vk.getRandomAccount()

        // Проверяем access_token на валидность
        var isValid = await isTokenValid(account.access_token);
        if (!isValid) {
        	exports.updateUserToken(account.user_id)
            logger.warn('Невалидный токен у аккаунта ' + account.user_id)
        }else {
            exports.random_access_token = account.access_token
            logger.info('Random access token: ' + exports.random_access_token.substring(0, 15) + "...")
        }   
    }
}


/**
 * Функция нужна для проверки токена на валидность
 * @return boolean - true, если токен валидный, иначе false
 */
isTokenValid = function(access_token) {
    return axios.get('https://api.vk.com/method/account.getInfo', {
        params: {
            access_token: access_token,
            v: 5.56
        }
    }).then(function (response) {
    	// Если есть ошибка, то токен не валидный
        if (response.data.error) return false;
        else return true;
    }).catch(function (error) {
        return Promise.reject(error)
    });
}

/**
 * Функция нужна для обновления токена у пользователя в бд
 * Если данные клиента больше не валидные - в бд устанавливается запись 'incorrect'
 * @return bool - true, если токен успешно обновлен
 */
exports.updateUserToken = function(user_id) {
	return new Promise(async function(resolve, reject) {
		var account = await db.vk.getAccount(user_id)

		var data = await vkapi.authorize(account.login, account.password)

		// Если авторизация прошла успешно
		if (data.access_token) {
			logger.info('Обновлен токен у аккаунта ' + user_id)
			db.vk.setAccountToken(user_id, data.access_token)
			db.vk.setAccountStatus(user_id, 'active')
			return resolve(true);
		}

		// Отслеживание ошибок
		if (!data.error) return resolve(false);
		switch(data.error) {
			case 'invalid_client':
				db.vk.setAccountStatus(user_id, 'invalid')
				logger.info('У аккаунта ' + user_id + ' неверный логин')
				break;
			default:
			db.vk.setAccountStatus(user_id, 'error')
				logger.warn('Неотслеживаемая ошибка у аккаунта ' + user_id)
				console.log(data)
		}
		return resolve(false);
	})
}


/**
 * Добавляем новые аккаунты
 * Для этого нужно
 * 1. Проверить что аккаунта нет в БД
 *    Обновляем данные только когда аккаунт не валидный
 * 2. Авторизовать аккаунт
 * 3. Добавить в бд
 */
exports.addAccounts = async function(accounts) {
	for (account of accounts) {
		// Проверяем аккаунт в бд
		var row = await db.vk.getAccount(account.login)
		if (row && row.length != 0) {
			// Изменились ли какие-нибудь данные (пароль)
			if (row.password == account.password) {
				logger.warn('Попытка добавления существующего аккаунта ' + account.login)
				continue
			}
		}

		var data = await vkapi.authorize(account.login, account.password)

		// Если неправильный логин или пароль
		if (data.error_type && data.error_type == 'username_or_password_is_incorrect') {
			logger.warn('Не удалось добавить новый аккаунт ' + account.login + ' - неверый пароль')
			continue
		}
		if (data.error && data.error == 'need_captcha') {
			logger.error('Нужна капча для авторизации ' + account.login)
			continue
		}

		// Если нет токена - значит произошла какая-то ошибка
		if (!data.access_token) {
			logger.error('Неотслеживаемая ошибка')
			console.log(data)
			continue
		}

		// На этом этапе авторизация прошла успешно
		if (row && row.length != 0) {
			await db.vk.removeAccount(data.user_id) // Удаляем старую инфу о клиенте
			db.vk.addAccount(data.user_id, account.login, account.password, data.access_token)
			logger.info('Обновили данные о пользователе ' + data.user_id)
		}else {
			db.vk.addAccount(data.user_id, account.login, account.password, data.access_token)
			logger.info('Добавили нового пользователя ' + data.user_id)
		}
	}
}

/**
 * Обновляем все аккаунты, где статус = need_token
 */
exports.updateAccounts = async function() {
	var accounts = await db.vk.getAllAccounts();
	for (i = 0; i < accounts.length; i++) {
		if (accounts[i].status == 'need_token' || accounts[i].status == 'error') {
			// Обновляем токен
			var result = await exports.updateUserToken(accounts[i].user_id)
			await utils.sleep(500)
		}
	}
	logger.info('Все токены обновлены')
}