/**
 * Критическая секция
 * Методы нужны при критических ситуаций
 */

const db = require('../db');
const axios = require('axios-https-proxy-fix')
const utils = require('../utils')


let proxies = utils.proxy.proxies;

/**
 * Удаляем все комменты, поставленные нашими аккаунтами со стены
 * @param owner_id - id владельца записи
 * @param post_id  - id поста
 */
exports.removeCommentsFromWall = async function(owner_id, post_id) {
	let offset = 0;

	while (true) {
		let account = await db.vk.getRandomAccount();

		let proxy = (account.proxy_id != null) ? utils.proxy.proxies[account.proxy_id] : null;

		let params = {
			owner_id,
        	post_id,
        	offset,
        	access_token: account.access_token, // Токен аккаунта
        	need_likes: 0,     // Не нужна информация о лайках
        	count: 100,         // Получаем 100 комментов
        	preview_length: 0, // Не интересует текст комментов
			v: "5.92"
		}

        const res = await axios.get('https://api.vk.com/method/wall.getComments', {
            params,        // Параметры запроса
            proxy,         // Прокси
            timeout: 5000  // Таймаут 5 секунд
        });

        // Если получили ответ
        if (res.data.response) {
        	// Количество комментов, которые получили с запроса
        	const count = res.data.response.items.length;
        	for (let comment of res.data.response.items) {
        		const user_id = comment.from_id;

        		const vk_account = await db.vk.getAccount(user_id);
        		if (vk_account) {
        			if (vk_account.status != 'active') continue;

        			console.log(`Наш аккаунт ${user_id} поставил коммент`)

        			let params = {
						owner_id: comment.owner_id,
			        	comment_id: comment.id,
			        	access_token: vk_account.access_token,
						v: "5.92"
					}
					let proxy = (vk_account.proxy_id != null) ? utils.proxy.proxies[vk_account.proxy_id] : null;

				    const res = await axios.get('https://api.vk.com/method/wall.deleteComment', {
			            params,        // Параметры запроса
			            proxy,         // Прокси
			            timeout: 5000  // Таймаут 5 секунд
			        });
			        if (res.data.response) {
			        	console.log('Удалили коммент');
			        	offset--;
			        }
			        if (res.data.error) {
			        	if (res.data.error.error_code == 5) {
			        		console.log('Не удалось удалить коммент - невалидная сессия')
			        		db.vk.setAccountStatus(vk_account.user_id, 'need_token')
			        	}else {
			        		console.log(res.data)	
			        	}
			        }
        		}
        	}
        	offset = offset + 100;
        	console.log(`Обработано ${count} комментариев`)
        	if (!count) return;
        }
	}
}