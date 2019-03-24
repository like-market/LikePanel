const logger  = require('./logger.js');
const utils   = require('./utils');
const cluster = require('cluster');
const config = require('./config.js')


if (cluster.isMaster) {
    logger.info('Запущен web-обработчик')

    const express = require('express');
    const app = express()

    app.use(require('./routes/routes.js'))

    app.set('view engine', 'ejs');
    app.set('views', require("path").join(__dirname, '/public'));

    app.listen(config.app.port, async () => {
        await utils.vk.getRandomToken();
        await utils.proxy.updateProxyList();
        // setTimeout(utils.vk.checkAccounts, 5000);
        // Каждые 5 минут обновляем рандомный токен
        // setInterval(() => { utils.vk.getRandomToken(true) }, 1000 * 60 * 5)

        logger.info(`HTTP Web Server running on port ${config.app.port}`);
    });

    // Создаем форк
    cluster.fork();

}else {
    const worker = require('./worker');

    logger.info('Запущен backend');

    // Получаем рандомный валидный токен
    (async function() {
        utils.vk.updateAccounts();       // Асинхронно обновляем все аккаунты
        await utils.vk.getRandomToken(); // Синхронно получаем рандомный валидный токен
        await utils.proxy.updateProxyList(); // Синхронно инициализируем список прокси
        await worker.createWorkers();        // Синхронно инициализируем воркеры
        await utils.posthunter.updateAll();  // Синхронно обновляем постхантер

        setInterval(utils.vk.updateAccounts,    1000 * 60 * 5) // Каждые 5 минут обновляем аккаунты
        setInterval(utils.posthunter.updateAll, 1000 * 30)     // Каждые 30 секунд обновляем постхантер 
    })()
}