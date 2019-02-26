const db = require('../db').db;
const utils  = require('../utils')
const axios  = require('axios')

/**
 * Получаем текст капчи с помощью API anti-captcha.com
 * @rapam url - ссылка на изображение
 * @return [error, solution] - ошибка и решение капчи
 */
exports.getCaptcha = async function(url) {
	// Получаем картинку
	let response = await axios(url, {responseType: 'arraybuffer'});
	let base64 = Buffer.from(response.data, 'binary').toString('base64')

	// Параметры для создания задачи
	let params = {
		// Other: d833689e84681713035fd6c8572ef315
		// My: f8e099d2af14077c13ebcb7568d5c423
	    "clientKey":"f8e099d2af14077c13ebcb7568d5c423",
	    "task": {
	        "type": "ImageToTextTask",
	        "body": base64,
	        "phrase": false,
	        "case": false,
	        "numeric": 0,
	        "math": 0,
	        "minLength": 0,
	        "maxLength": 0
	    }
	}
	// Создаем задачу
	let taskId = -1;

	try {
		const task = await axios.post('https://api.anti-captcha.com/createTask', params);
		taskId = task.data.taskId
	} catch(error) {
		console.log(error);
	}

	// Ждем 5 секунд
	await utils.sleep(5000)

	// Параметры для проверки статуса задачи
	params = {
	    "clientKey":"f8e099d2af14077c13ebcb7568d5c423",
	    "taskId": taskId
	}

	// Пока не получим ответ - будем спрашивать результат каждую секунду
	while (true) {
		let response = await axios.post('https://api.anti-captcha.com/getTaskResult', params);

		// Если есть какая-то ошибка
		if (response.data.errorId != 0) {
			return [response.data.errorId, null];
		}
		// Если капча разгадана
		if (response.data.status == 'ready') {
			// Добавляем капчу в бд
			let sql = "INSERT INTO `captcha`(`base64`, `result`)"
			sql += " VALUES('" + base64 + "', '" + response.data.solution.text + "')";
			db.query(sql);

			// Возвращаем результат 
			return [null, response.data.solution.text];
		}
		await utils.sleep(1000)
	}
}