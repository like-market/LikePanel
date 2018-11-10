const logger = require('../logger.js')
const utils = require('../utils')
const axios = require('axios');
var db = require('../db');

exports.authorize = function(login, password) {
    return axios.get('https://oauth.vk.com/token', {
        params: {
            client_id:     2274003, // Данные от приложения андроид
            client_secret: 'hHbZxrka2uZ6jB1inYsH', // Данные от приложения андроид
            grant_type:    'password',
            username:      login,
            password:      password,
            scope:         'notify,friends,photos,audio,video,pages,status,notes,messages,wall,ads,offline,docs,groups,notifications,stats,email,market',
            v: 5.56
        }
    }).then(function (response) {
        return response.data
    }).catch(function (error) {
        return error.response.data;
        //return Promise.reject(error)
    });
}

/**
 * Функция проверяет наличие записи на стене
 * Использует рандомный токен
 */
exports.getWallData = function(post_id, cb) {
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
exports.addLike = function(type, owner_id, item_id, access_token, cb) {
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