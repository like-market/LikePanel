const vkapi = new (require('node-vkapi'))();
var db = require('../db');

/*vkapi.authorize({
    client:   'android',         // <String> Клиент (android, iphone)
    login:    '+79632703686',    // <String> Логин пользователя
    password: '56894KekNenana',     // <String> Пароль пользователя
    scope:    'notify,friends,photos,pages,status,notes,messages,wall,offline,docs,groups,notifications,stats,email'                  // <String> Строка разрешений. По умолчанию будут запрашиваться все возможные разрешения
}).then(responce => console.log(responce));*/

authorize = function(login, password) {
    vkapi.authorize({
    client:   'android',         // <String> Клиент (android, iphone)
    login:    login,             // <String> Логин пользователя
    password: password,          // <String> Пароль пользователя
    // <String> Строка разрешений
    scope:    'notify,friends,photos,pages,status,notes,messages,wall,offline,docs,groups,notifications,stats,email'
}).then(function(responce) {
    // responce.{access_token, expires_in, 511453172}
});
