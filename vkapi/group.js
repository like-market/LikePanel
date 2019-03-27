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