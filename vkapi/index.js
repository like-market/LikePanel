const vkapi = new (require('node-vkapi'))();
const axios = require('axios');
var db = require('../db');

var random_access_token;

db.vk.getRandomAccessToken(function(err, access_token) {
    random_access_token = access_token
    console.log('Random access token: ' + access_token.substring(0, 15) + "...")
})

/*vkapi.authorize({
    client:   'android',         // <String> Клиент (android, iphone)
    login:    '+79632703686',    // <String> Логин пользователя
    password: '56894KekNenana',     // <String> Пароль пользователя
    scope:    'notify,friends,photos,pages,status,notes,messages,wall,offline,docs,groups,notifications,stats,email'                  // <String> Строка разрешений. По умолчанию будут запрашиваться все возможные разрешения
}).then(response => console.log(response));*/

exports.authorize = function(login, password, cb) {
    vkapi.authorize({
        client:   'android',         // <String> Клиент (android, iphone)
        login:    login,             // <String> Логин пользователя
        password: password,          // <String> Пароль пользователя
        // <String> Строка разрешений
        scope:    'notify,friends,photos,pages,status,notes,messages,wall,offline,docs,groups,notifications,stats,email'
    }).then(function(response) {
        // response.{access_token, expires_in, 511453172}
        cb(null, response);
    }).catch(function(error) {
        console.error(error)
        cb(error, null);
    });
}

exports.getWallData = function(post_id, cb) {
    axios.get('https://api.vk.com/method/wall.getById', {
        params: {
            posts: post_id,
            access_token: random_access_token,
            v: 5.56
        }
    }).then(function (response) {
        return cb(null, response.data)
    }).catch(function (error) {
        return cb(error, null)
        console.error(error);
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
    })
}

/*
exports.addLike = async function(type, owner_id, item_id, access_token) {
    const res = await axios.get('https://api.vk.com/method/likes.add', {
        params: {
            type: type,
            owner_id: owner_id,
            item_id: item_id,
            access_token: access_token,
            v: 5.56
        }
    })
    return res;
}
*/