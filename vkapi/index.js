const logger = require('../logger.js')
const utils = require('../utils')
const db    = require('../db')
const axios = require('axios-https-proxy-fix')


exports.wall = require('./wall.js');
// exports.likes = require('./likes.js');
exports.comments = require('./comments.js');


let proxies;
// После загрузки модуля utils.proxy
setTimeout(function() { proxies = utils.proxy.proxies; }, 1000);

/**
 * Авторизация пользователя
 * Алгоритм:
 *    1. Авторизуем пользователя
 *    2. Если попросят ввести капчу
 *        2.1 Скачиваем base64 капчу
 *        2.2 Формируем запрос к anticaptcha 
 */
exports.authorize = async function(login, password, account_proxy = null, captcha_sid = null, captcha_key = null) {
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

    // Добавляем прокси
    let proxy = {}
    if (account_proxy) {
        proxy = {
            host: account_proxy.ip,
            port: account_proxy.port,
            auth: {
                username: account_proxy.login,
                password: account_proxy.password
            }
        }
    }

    // Если нужно ввести капчу (т.е. есть данные капчи), то добавляем их
    if (captcha_sid && captcha_key) {
        params.captcha_sid = captcha_sid
        params.captcha_key = captcha_key // текст капчи
    }

    try {
        const response = await axios.get('https://oauth.vk.com/token', {params, proxy});

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
                const response = await exports.authorize(login, password, account_proxy, captcha_sid, captcha_key);
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
 * Функция получает записи со стены сообщества
 */
exports.getWall = async function(owner_id, count = 10) {
    // Стандартные параметры запроса
    var params = {
        access_token: utils.vk.random_access_token,
        owner_id,
        count,
        v: 5.56
    }

    try {
        const response = await axios.get('https://api.vk.com/method/wall.get', {params});
        return response.data;
    }catch (error) {
        return error.response.data;
    }
}

/**
 * Добавить лайк
 */
exports.addLike = async function(type, owner_id, item_id, account) {
    let params = { type, owner_id, item_id, access_token: account.access_token, v: 5.56 }

    // Получаем прокси
    let proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

    const response = await axios.get('https://api.vk.com/method/likes.add', {params, proxy});
    return response.data
}

/**
 * Получить список пользователей, кто поставил лайк записи
 */
exports.getLikeList = async function(type, owner_id, item_id, count = 1000) {
    const params = { type, owner_id, item_id, count, filter: 'likes', v: 5.56, access_token: utils.vk.random_access_token}

    const response = await axios.get('https://api.vk.com/method/likes.getList', {params})

    return response.data;
}

/**
 * Добавляем комментарий
 * @param type - тип комментария
 * @param owner_id - идентификатор пользователя или сообщества
 * @param item_id  - идентификатор
 * @param message  - текст комментария
 * @param account  - данные об аккаунте
 */
exports.createComment = async function(type, owner_id, item_id, message, account, captcha_sid = null, captcha_key = null) {
    let params = { owner_id, message, access_token: account.access_token, v: 5.56 }

    let method;
    switch (type) {
        case 'photo':
            method = 'photos.createComment';
            params.photo_id = item_id;
            break;
        case 'post':
            method = 'wall.createComment';
            params.post_id = item_id;
            break;
        case 'video':
            method = 'video.createComment';
            params.video_id = item_id
            break;
        case 'market':
            method = 'market.createComment';
            params.item_id = item_id
            break;
    }    

    // Получаем прокси
    let proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

    // Если нужно ввести капчу (т.е. есть данные капчи), то добавляем их
    if (captcha_sid && captcha_key) {
        params.captcha_sid = captcha_sid
        params.captcha_key = captcha_key // текст капчи
    }

    const response = await axios.get('https://api.vk.com/method/' + method, {params, proxy});

    // Если нужно ввести капчу
    if (response.data.error && response.data.error.error_code == 14) {
        logger.debug(`Нужно ввести капчу для акк ${account.user_id}`)
        let captcha_img = response.data.error.captcha_img
        let captcha_sid = response.data.error.captcha_sid

        let [error, captcha_key] = await utils.anticaptcha.getCaptcha(captcha_img)
        logger.debug(`Получена капча ${captcha_key} для акк ${account.user_id}`)
        if (!error) {
            const response = await exports.createComment(type, owner_id, item_id, message, account, captcha_sid, captcha_key);
            return response;
        }else {
            logger.error("Ошибка от капчи")
        }
    }

    return response.data
}

exports.getCommentList = async function(type, owner_id, item_id, count = 100) {
    const params = { owner_id, count, v: 5.56, access_token: utils.vk.random_access_token}

    let method;
    switch (type) {
        case 'photo':
            method = 'photos.getComments';
            params.photo_id = item_id;
            break;
        case 'post':
            method = 'wall.getComments';
            params.post_id = item_id;
            break;
        case 'video':
            method = 'video.getComments';
            params.video_id = item_id
            break;
        case 'market':
            method = 'market.getComments';
            params.item_id = item_id
            break;
    }

    const response = await axios.get('https://api.vk.com/method/' + method, {params})

    return response.data;
}

/**
 * Получаем тип объекта по короткому имени
 */
exports.getTypeByName = async function(screen_name) {
    var params = { screen_name, access_token: utils.vk.random_access_token, v: 5.56 }
    const response = await axios.get('https://api.vk.com/method/utils.resolveScreenName', {params});

    return response.data.response;
}