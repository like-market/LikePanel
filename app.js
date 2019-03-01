const logger  = require('./logger.js');
const utils   = require('./utils');
const cluster = require('cluster');


if (cluster.isMaster) {
    logger.info('Запущен web-обработчик')

    const express = require('express');
    const app = express()

    app.use(require('./routes/routes.js'))

    app.set('view engine', 'ejs');
    app.set('views', require("path").join(__dirname, '/public'));

    app.listen(8888, async () => {
        await utils.vk.getRandomToken();
        await utils.proxy.updateProxyList();
        // Каждые 5 минут обновляем рандомный токен
        // setInterval(() => { utils.vk.getRandomToken(true) }, 1000 * 60 * 5)

        logger.info('HTTP Server running on port 8888');
    });

    // Создаем форк
    cluster.fork();

}else {
    logger.info('Запущен backend')

    // Получаем рандомный валидный токен
    utils.vk.updateAccounts(async function() {
        await utils.vk.getRandomToken();
        await utils.posthunter.updateAll();
        await utils.proxy.updateProxyList();

        setInterval(utils.vk.updateAccounts,    1000 * 60 * 5) // Каждые 5 минут обновляем аккаунты
        setInterval(utils.posthunter.updateAll, 1000 * 30)     // Каждые 30 секунд обновляем постхантер 
        // Каждые 5 минуту обновляем рандомный токен
        // setInterval(()=>{ utils.vk.getRandomToken(true) }, 1000 * 60 * 5)
    });
}


