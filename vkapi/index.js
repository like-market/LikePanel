const logger = require('../logger.js')
const utils = require('../utils')
const db    = require('../db')
const axios = require('axios-https-proxy-fix')


exports.wall  = require('./wall.js');
exports.group = require('./group.js');
exports.account  = require('./account.js');

let proxies = utils.proxy.proxies;

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
    if (account_proxy) {
        var proxy = {
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
        const response = await axios.get('https://oauth.vk.com/token', {
            params,        // Параметры запроса
            proxy,         // Прокси
            timeout: 5000  // Таймаут 5 секунд
        });

        return response.data;
    }catch (error) {
        // Если пришел ответ с сервера
        if (error.response) {
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

        // Если ошибка в axios запросе
        return error;
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
        v: 5.92
    }

    try {
        const response = await axios.get('https://api.vk.com/method/wall.get', {params});
        return response.data;
    }catch (error) {
        console.log(error.response.data);
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

    try {
        const response = await axios.get('https://api.vk.com/method/likes.add', {
            params,       // Параметры запроса
            proxy,        // Прокси
            timeout: 5000 // Таймаут
        });
        return response.data
    
    }catch (error) {
        // Если ошибка в axios запросе
        return error;
    }
}

/**
 * Получить список пользователей, кто поставил лайк записи
 */
exports.getLikeList = async function(type, owner_id, item_id) {
    const account = await db.vk.getRandomAccount();
    const proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

    const code = `
        var res = API.likes.getList({ owner_id: "${owner_id}", item_id: ${item_id}, type: "${type}", count: 1000 });
        var total_count = res.count;

        var result = res.items;

        var count = 1000;
        while (count < total_count && count < 25000) {
            res = API.likes.getList({ owner_id: "${owner_id}", item_id: ${item_id}, type: "${type}", count: 1000 });
            result = result + res.items;
            count = count + 1000;
        }
        return { count: total_count, likes: result };
    `

    let params = {
        access_token: account.access_token,
        code,
        v: '5.92'
    }

    try {
        const res = await axios.get('https://api.vk.com/method/execute', {
            params,
            proxy
        });

        if (res.data.error) {
            switch (res.data.error.error_code) {
                case 5:
                    utils.vk.updateUserToken(account.user_id)
                    logger.warn(`Невалидная сессия у аккаунта ${account.user_id}`)
                    return exports.getLikeList(type, owner_id, item_id);

                default:
                    logger.warn(`Неизвестная ошибка api /vkapi/index.js:getLikeList(${type}, ${owner_id}, ${item_id})`, {json: {code, response: res.data }});
                    return { response: {likes: []}}; // Пустой массив лайков
            }
        }

        return res.data;
    }catch (error) {
        logger.error('Какая-то ошибка ошибка в axios запросе /vkapi/index.js:getLikeList(${type}, ${owner_id}, ${item_id})', { json: error.code });
        return exports.getLikeList(type, owner_id, item_id);
    }
}

/**
 * Добавляем комментарий
 * @param type - тип комментария
 * @param owner_id - идентификатор пользователя или сообщества
 * @param item_id  - идентификатор
 * @param comment  - комментарий (Объект вида {type: 'text/sticker', value: 'текст/id стикера'})
 * @param account  - данные об аккаунте
 */
exports.createComment = async function(type, owner_id, item_id, comment, account, captcha_sid = null, captcha_key = null) {
    let params = { owner_id, access_token: account.access_token, v: 5.56 }

    if (comment.type == 'text') {
        params['message'] = comment.value;
    }
    if (comment.type == 'sticker') {
        params['sticker_id'] = comment.value;
    }

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

    try {
        const response = await axios.get('https://api.vk.com/method/' + method,{
            params,       // Параметры запроса
            proxy,        // Прокси
            timeout: 5000 // Таймаут
        });

        // Если нужно ввести капчу
        if (response.data.error && response.data.error.error_code == 14) {
            logger.debug(`Нужно ввести капчу для акк ${account.user_id}`)
            let captcha_img = response.data.error.captcha_img
            let captcha_sid = response.data.error.captcha_sid

            let [error, captcha_key] = await utils.anticaptcha.getCaptcha(captcha_img)
            logger.debug(`Получена капча ${captcha_key} для акк ${account.user_id}`)
            if (!error) {
                const response = await exports.createComment(type, owner_id, item_id, comment, account, captcha_sid, captcha_key);
                return response;
            }else {
                logger.error("Ошибка от капчи")
                // Создаем свою ошибку
                return {error: {error_code: -1}, descr: 'Ошибка от капчи'}
            }
        }
        return response.data

    }catch (error) {
        // Если ошибка в axios запросе
        return error;
    }
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



/**
 * Получаем информацию о возможных действиях
 * @param type - тип объекта [post, photo, video, market]
 * @param owner_id - владелец
 * @param item_id  - идентефикатор объекта
 *
 * Возвращаемое значение
 * {found, can_like, can_comment, can_repost}
 * Найден ли объект, можно ли лайкать|комментировать|репостить
 */
exports.getAvailableActions = async function(type, owner_id, item_id) {
    const account = await db.vk.getRandomAccount();
    const proxy = (account.proxy_id != null) ? proxies[account.proxy_id] : null;

    let params = {
        access_token: account.access_token,
        v:  '5.92'
    }

    switch (type) {
        case 'post':
            var method = 'wall.getById';

            params['posts'] = `${owner_id}_${item_id}`
            break;
        case 'photo':
            var method = 'photos.getById';

            params['photos']   = `${owner_id}_${item_id}`
            params['extended'] = 1 // Для полей can_comment и can_repost
            break;
        case 'video':
            var method = 'video.get';

            params['videos'] = `${owner_id}_${item_id}`
            params['extended'] = 1 // Для полей can_comment и can_repost
            break;
        case 'market':
            method = 'market.get';

            params['item_ids'] = `${owner_id}_${item_id}`
            break;
    }

    try {
        const res = await axios.get(`https://api.vk.com/method/${method}`, {
            params,
            proxy
        });
        
        // Если не удалось получить информацию о объекте
        if (res.data.error) {
            switch (res.data.error.error_code) {
                case 5:
                    utils.vk.updateUserToken(account.user_id)
                    logger.warn(`Невалидная сессия у аккаунта ${account.user_id}`)
                    return exports.getAvailableActions(type, owner_id, item_id);

                case 30:  // This profile is private
                case 200: // Access denied
                case 204: // Нет доступа
                    return { found: false, can_like: false, can_comment: false, can_repost: false };
                default:
                    logger.warn(`Неизвестная ошибка /vkapi/index.js:getAvailableActions(${type}, ${owner_id}, ${item_id})`, {json: res.data})
                    return { found: false, can_like: false, can_comment: false, can_repost: false };           
            }
        }
        if (res.data.response) {
            switch (type) {
                case 'post':
                    // Если пост не найден
                    if (!res.data.response.length) {
                        return { found: false, can_like: false, can_comment: false, can_repost: false };
                    }
                    const post = res.data.response[0];
                    return {
                        found:       true,
                        can_like:    post.likes.can_like,
                        can_comment: post.comments.can_post,
                        can_repost:  post.likes.can_publish
                    }

                case 'photo':
                    // Если фото не найдено
                    if (!res.data.response.length) {
                        return { found: false, can_like: false, can_comment: false, can_repost: false };
                    }
                    const photo = res.data.response[0];
                    return {
                        found:       true,
                        can_like:    true,
                        can_comment: photo.can_comment,
                        can_repost:  photo.can_repost
                    }
                case 'video':
                    // Если видео не найдено 
                    if (!res.data.response.items.length) {
                        return { found: false, can_like: false, can_comment: false, can_repost: false };
                    }
                    const video = res.data.response.items[0];
                    return {
                        found:       true,
                        can_like:    video.can_like,
                        can_comment: video.can_comment,
                        can_repost:  video.can_repost
                    }

                case 'market':
                    // Если товар не найден
                    if (!res.data.response.items.length) {
                        return { found: false, can_like: false, can_comment: false, can_repost: false };
                    }
                    const product = res.data.response.items[0];
                    return {
                        found:       true,
                        can_like:    product.can_like,
                        can_comment: product.can_comment,
                        can_repost:  product.can_repost
                    }
            }
        }
        // По идее сюда мы не должны были дойти
        loggger.error(res.data);
        return { found: false, can_like: false, can_comment: false, can_repost: false };

    }catch (error) {
        // Если ошибка в axios запросе
        logger.error(`Ошибка в axios запросе!  /vkapi/index.js:getAvailableActions(${type}, ${owner_id}, ${item_id})`, {json: error.code})
        return { found: false, can_like: false, can_comment: false, can_repost: false };
    }
}
