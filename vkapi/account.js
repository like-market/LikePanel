const logger = require('../logger.js')
const axios = require('axios-https-proxy-fix')
const utils = require('../utils')
const vkapi = require('./index.js');

let proxies = utils.proxy.proxies;

exports.getProfileInfo = async function(account) {
	let params = { access_token: account.access_token, v: 5.56 }

    // Получаем прокси
    let proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

    try {
        const response = await axios.get('https://api.vk.com/method/account.getProfileInfo', {
            params,        // Параметры запроса
            proxy,         // Прокси
            timeout: 5000  // Таймаут 5 секунд
        });

        return response.data;
    }catch (error) {

        // Если ошибка в axios запросе
        return error;
    }
}