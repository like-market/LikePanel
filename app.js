const logger  = require('./logger.js');
const utils   = require('./utils');
const cluster = require('cluster');
const config  = require('./config.js');


if (cluster.isMaster) {
    logger.info('Запущен web-обработчик');

    const express = require('express');
    const app = express();

    app.use(require('./routes'));

    app.set('view engine', 'ejs');
    app.set('views', require('path').join(__dirname, '/public'));

    app.listen(config.app.port, async () => {
        await utils.vk.getRandomToken();
        await utils.proxy.updateProxyList();
        // Каждые 5 минут обновляем рандомный токен
        // setInterval(() => { utils.vk.getRandomToken(true) }, 1000 * 60 * 5);

        logger.info(`HTTP Web Server running on port ${config.app.port}`);
    });

    // Создаем форк
    cluster.fork();

}else {
    const worker = require('./worker');
    const cli    = require('./cli.js'); // eslint-disable-line no-unused-vars
    const db     = require('./db');

    logger.info('Запущен backend');

    // Получаем рандомный валидный токен
    (async function() {
        // Асинхронно обновляем все аккаунты со старым токеном
        utils.vk.updateAccounts(function() {
            // После обновления всех аккаунтов обновляем все наборы
            db.accounts_group.updateAllCommentGroups();
        });

        await utils.vk.getRandomToken(); // Синхронно получаем рандомный валидный токен
        await utils.proxy.updateProxyList(); // Синхронно инициализируем список прокси
        await worker.createWorkers();        // Синхронно инициализируем воркеры
        await db.accounts_group.updateAllCommentGroups(); // 
        // await utils.posthunter.updateAll();  // Синхронно обновляем постхантер

        setInterval(utils.vk.checkAccounts, 15 * 60 * 1000); // Каждые 15 минут полностью обновляем все аккаунты
        setInterval(db.accounts_group.updateAllCommentGroups, 1000 * 60 * 5); // Каждые 5 минут обновляем наборы
        setInterval(utils.vk.updateAccounts, 3 * 60 * 1000); // Каждые 3 минуты обновляем аккаунты со старым токеном
        // setInterval(utils.posthunter.updateAll,  30 * 1000); // Каждые 30 секунд обновляем постхантер
    })();
}
