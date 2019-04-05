const logger = require('../logger.js')
const axios = require('axios-https-proxy-fix')
const utils = require('../utils')
const vkapi = require('./index.js');
const db    = require('../db')

let proxies = utils.proxy.proxies;

/**
 * Получаем все новые посты
 * @param group_id - ID группы или пользователя
 * @param last_post_id - последний ID поста
 */
exports.getNewPosts = async function(group_id, last_post_id, account = null) {
	if (!account) {
    	account = await db.vk.getRandomAccount();
	}

	const code = `
		var posts = API.wall.get({
		    owner_id: ${group_id},
		    count: 2,
		    extended: 0,
		    offset: 0
		});

		var count;
		var last_post_id;
		if (posts.items[0].is_pinned == 1) {
		    count = posts.items[1].id - ${last_post_id} + 1;
		    last_post_id = posts.items[1].id;
		} else {
		    count = posts.items[0].id - ${last_post_id};
		    last_post_id = posts.items[0].id;
		}
		if (count > 5) count = 5;

		if (count <= 0) return { last_post_id: ${last_post_id}, posts: [] };

		var posts = API.wall.get({
		     owner_id: ${group_id},
		     extended: 0,
		     count: count
		});

		var result = [];

		var i = posts.items.length;
		while (i > 0) {
		    i = i - 1;
		    if (parseInt(posts.items[i].id) > ${last_post_id}) {
		        result.push(posts.items[i]);
		    }
		}
		return { last_post_id: last_post_id, posts: result };`
	
	let params = {
        code,
        access_token: account.access_token,
        v: '5.92'
	}
	const proxy = (account.proxy_id != null) ? utils.proxy.proxies[account.proxy_id] : null;

	try {
        const response = await axios.get('https://api.vk.com/method/execute', {
        	params,
        	proxy,
        	timeout: 5000
        });

        return response.data
    }catch (error) {
        logger.error(`Какая-то ошибка /vkapi/utils::getNewPosts(${group_id}, ${last_post_id}, ${account.login})`, {json: error.code});
        return await exports.getNewPosts(group_id, last_post_id);
    }
}

exports.getLastPostId = async function(group_id) {
	// Получаем последний пост
	const wall = await vkapi.getWall(group_id, 1);

	if (wall.response.items.length == 0) return 0
	else return wall.response.items[0].id;
}