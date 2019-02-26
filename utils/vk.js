const logger = require('../logger.js')
const db = require('../db');
const vkapi  = require('../vkapi');
const worker = require('../worker');

const utils = require('../utils')

const axios = require('axios');

exports.random_access_token = null;


/**
 * Функция нужна для получения любого валидного токена из бд
 * Токен нужен в процессе работы скрипта - чтобы проверять записи, например
 */
exports.getRandomToken = async function(update = false) {
	// Если нужно обновить токен
    if (update) exports.random_access_token = null
    
    while (exports.random_access_token == null) {
        var account = await db.vk.getRandomAccount()
        // Если аккаунт не найден
        if (account == null) {
        	logger.error('Нет активных аккаунтов в бд')
        	process.exit(1)
        }

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
		var proxy = await db.proxy.get(account.proxy_id)

		var data = await vkapi.authorize(account.login, account.password, proxy);

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
				logger.warn('У аккаунта ' + user_id + ' неверный логин')
				break;
			case 'invalid_request':
				// Слишком много запросов. Нужно попробовать позже.
				if (data.error_type == 'too_much_tries') {
					logger.warn('Авторизоваться ' + user_id + ' можно через пару часов')
					break;
				}
			case 'need_validation':
				// Скорее всего аккаунт потерян - нужно привязать номер телефона
				if (data.error_description == 'please open redirect_uri in browser [3]') {
					logger.warn('Аккаунт ' + user_id + ' требует валидации')
					logger.warn(data.redirect_uri)
					db.vk.setAccountStatus(user_id, 'invalid')
					break;
				}
			default:
				db.vk.setAccountStatus(user_id, 'error')
				logger.warn('Неотслеживаемая ошибка у аккаунта ' + user_id)
				console.log(data)
		}
		return resolve(false);
	})
}


/**
 * Добавляем новый аккаунт
 */
exports.addAccounts = async function(accounts) {
	for (account of accounts) {
		console.log('Добавили задачу на ' + account.login)
		worker.queue.create('auth', account).removeOnComplete(true).save()
	}
}

/**
 * Обновляем все аккаунты, где статус = need_token
 */
exports.updateAccounts = async function(cb = null) {
	var accounts = await db.vk.getAllAccounts();
	for (i = 0; i < accounts.length; i++) {
		if (accounts[i].status == 'need_token' || accounts[i].status == 'error') {
			// Обновляем токен
			var result = await exports.updateUserToken(accounts[i].user_id)
			await utils.sleep(500)
		}
	}
	logger.info('Все токены обновлены')
	if (cb != null) cb();
}