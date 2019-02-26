const logger = require('../logger.js')
const utils = require('../utils')
const axios = require('axios-https-proxy-fix')

/**
 * Возвращает записm со стены пользователя или сообщества
 */
exports.getById = async function(owner_id, post_id) {
    const params = {
    	posts: owner_id + '_' + post_id,
        access_token: utils.vk.random_access_token,
        v: 5.56
    }

    const response = await axios.get('https://api.vk.com/method/wall.getById', {params});
    return response.data;
}