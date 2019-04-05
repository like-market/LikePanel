const logger = require('../logger.js')
const axios = require('axios-https-proxy-fix')
const utils = require('../utils')
const db    = require('../db')


let proxies = utils.proxy.proxies;

/**
 * Получаем информация о группе
 * return [error, response]
 */
exports.getGroupInfo = async function(group_id) {
	const account = await db.vk.getRandomAccount()
    const proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

	// Стандартные параметры запроса
    const params = {
        access_token: account.access_token,
        group_id: (group_id.toString()[0] == '-' ? group_id.toString().replace('-', '') : group_id),
        fields: 'verified,members_count',
        v: 5.92
    }

    try {
        const res = await axios.get('https://api.vk.com/method/groups.getById', {
            params,
            proxy
        });

        if (res.data.response) {
        	return [null, res.data.response[0]];
        }

        // Обработка ошибок на стороне вк
        if (res.data.error) {
        	switch (res.data.error.error_code) {
        		case 5:
        			utils.vk.updateUserToken(account.user_id)
            		logger.warn(`Невалидная сессия у аккаунта ${account.user_id}`)
					return exports.getGroupInfo(group_id);

            	default:
            		logger.warn(`Неизвестная ошибка api /vkapi/group.js:getGroupInfo(${group_id})`, {json: res.data})
                    return [res.data.error, null];
            }
		}

		logger.error(`Как мы сюда зашли? /vkapi/group.js:getGroupInfo(${group_id})`, {json: res.data})
		return [true, null]

    }catch (error) {
    	// Если ошибка в axios запросе
        logger.error(`Ошибка в axios запросе  /vkapi/group.js:getGroupInfo(${group_id})`, {json: error.code})
        return [error, null];
    }
}

/**
 * Вступаем в группу
 * @param account  - аккаунт
 * @param group_id - id группы
 *
 * @return bool - удалось ли вступить
 */
exports.join = async function(account, group_id) {
    const proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

    const params = {
        access_token: account.access_token,
        group_id: (group_id.toString()[0] == '-' ? group_id.toString().replace('-', '') : group_id),
        v: 5.92
    }

    try {
        const res = await axios.get('https://api.vk.com/method/groups.join', {
            params,
            proxy,
            timeout: 5000
        });

        if (res.data.response) return true;

        // Обработка ошибок на стороне вк
        if (res.data.error) {
            switch (res.data.error.error_code) {
                case 5:
                    utils.vk.updateUserToken(account.user_id)
                    logger.warn(`Невалидная сессия у аккаунта ${account.user_id}`)
                    return false;

                default:
                    logger.warn(`Неизвестная ошибка api /vkapi/group.js:join(${account.login}, ${group_id})`, {json: res.data})
                    return false;
            }
        }

        logger.error(`Как мы сюда зашли? /vkapi/group.js:join(${account.login}, ${group_id})`, {json: res.data})
        return false;

    }catch (error) {
        // Если ошибка в axios запросе
        logger.error(`Ошибка в axios запросе  /vkapi/group.js:join(${account.login}, ${group_id})`, {json: error.code})
        return exports.join(account, group_id);
        
        return false;
    }
}