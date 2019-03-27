const readline = require('readline');

const critical = require('./utils/critical.js')
const logger = require('./logger.js');
const utils  = require('./utils');
const db = require('./db');

const rl = readline.createInterface({
	input:  process.stdin,
	// output: process.stdout
});

const recursiveAsyncReadLine = function () {
  	rl.question('', async function (answer) {
    	recursiveAsyncReadLine(); //Calling this function again to ask new question

  		switch (true) {
	  		// Обновляем прокси у аккаунтов
  			case (answer == 'updateproxy'):
	  			logger.info('Запуск обновление прокси у аккаунтов вк')
	  			await db.proxy.updateAccounts()
				logger.info('Прокси для аккаунтов обновлены')
				break;
			// Проверяем токены у всех аккаунтов
			case (answer == 'updateaccounts'):
				logger.info('Запуск проверки access_token у аккаунтов')
				await utils.vk.checkAccounts()
				logger.info('Проверка access_token у аккаунтов завершена')
				break;
			// Удаляем комментарии с поста
			case /removecomments/.test(answer):
				const regex = /removecomments (.*) (.*)/
				const match = answer.match(regex);
				if (!match) {
					logger.warn('Используйте: removecomments owner_id object_id');
				}else {
					logger.info(`Удаляем комментарии с записи http://vk.com/wall${match[1]}_${match[2]}`);
					await critical.removeCommentsFromWall(match[1], match[2]);
					logger.info(`Удаление комментариев завершено`);
				}
				break;
			default:
				logger.warn(`Не существует команды '${answer}'`)
  				logger.info('Доступные команды: updateproxy, updateaccounts, removecomments')
  		}

  	});
};

recursiveAsyncReadLine(); // Запускаем считывание из консоли