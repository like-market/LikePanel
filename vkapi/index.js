const logger = require('../logger.js')
const utils = require('../utils')
const axios = require('axios')
const db    = require('../db')

/**
 * Авторизация пользователя
 * Алгоритм:
 *    1. Авторизуем пользователя
 *    2. Если попросят ввести капчу
 *        2.1 Скачиваем base64 капчу
 *        2.2 Формируем запрос к anticaptcha 
 */
exports.authorize = async function(login, password, captcha_sid = null, captcha_key = null) {
    // Стандартные параметры запроса
    var params = {
        client_id:     2274003,                // Данные от приложения андроид
        client_secret: 'hHbZxrka2uZ6jB1inYsH', // Данные от приложения андроид
        grant_type:    'password',
        username:      login,
        password:      password,
        scope:         'notify,friends,photos,audio,video,pages,status,notes,messages,wall,ads,offline,docs,groups,notifications,stats,email,market',
        v: 5.56
    }
    // Если нужно ввести капчу (т.е. есть данные капчи), то добавляем их
    if (captcha_sid && captcha_key) {
        params.captcha_sid = captcha_sid
        params.captcha_key = captcha_key // текст капчи
    }

    try {
        const response = await axios.get('https://oauth.vk.com/token', {params});
        return response.data;
    }catch (error) {
        // Если нужно ввести капчу
        if (error.response.data.error == 'need_captcha') {
            logger.debug('Нужно ввести капчу для ' + login)
            var captcha_img = error.response.data.captcha_img
            var captcha_sid = error.response.data.captcha_sid

            var [error, captcha_key] = await utils.anticaptcha.getCaptcha(captcha_img)
            logger.debug('Получена капча ' + captcha_key + ' для ' + login)
            if (!error) {
                const response = await exports.authorize(login, password, captcha_sid, captcha_key);
                return response;
            }
        }

        return error.response.data;
    }
}

/**
 * Функция проверяет наличие записи на стене
 * Использует рандомный токен
 */
exports.getWallData = function(post_id) {
    return axios.get('https://api.vk.com/method/wall.getById', {
        params: {
            posts: post_id,
            access_token: utils.vk.random_access_token,
            v: 5.56
        }
    }).then(function (response) {
        return response.data
    }).catch(function (error) {
        return error.response.data
    });
}

/**
 * @return promise
 */
exports.addLike = function(type, owner_id, item_id, access_token) {
    return axios.get('https://api.vk.com/method/likes.add', {
        params: {
            type: type,
            owner_id: owner_id,
            item_id: item_id,
            access_token: access_token,
            v: 5.56
        }
    }).then(function (response) {
        return response.data
    }).catch(function (error) {
        return error.response.data
    });
}

/**
 * Получить список пользователей, кто поставил лайк записи
 */
exports.getLikeList = function(type, owner_id, item_id) {
    return axios.get('https://api.vk.com/method/likes.getList', {
        params: {
            type: type,
            owner_id: owner_id,
            item_id: item_id,
            access_token: utils.vk.random_access_token,
            filter: 'likes', // Возвращаем только лайки
            count: 1000, 
            v: 5.56
        }
    }).then(function (response) {
        return response.data.response.items
    }).catch(function (error) {
        return error.response.data
    });    
}