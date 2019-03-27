const readline = require('readline');

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

  		switch (answer) {
	  		// Обновляем прокси у аккаунтов
  			case 'updateproxy':
	  			logger.info('Запуск обновление прокси у аккаунтов вк')
	  			await db.proxy.updateAccounts()
				logger.info('Прокси для аккаунтов обновлены')
				break;
			case 'updateaccounts':
				logger.info('Запуск проверки access_token у аккаунтов')
				await utils.vk.checkAccounts()
				logger.info('Проверка access_token у аккаунтов завершена')
				break;
			default:
				logger.warn(`Не существует команды '${answer}'`)
  				logger.info('Доступные команды: updateproxy, updateaccounts')
  		}

  	});
};

recursiveAsyncReadLine(); // Запускаем считывание из консоли