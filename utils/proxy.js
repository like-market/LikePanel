const db = require('../db');
const logger = require('../logger.js')

// Список прокси, в виде структуры для axios запроса
let proxies = {};

exports.updateProxyList = async function() {
	const proxyList = await db.proxy.getProxy();

	for (let proxy of proxyList) {
		proxies[proxy.id] = {
            host: proxy.ip,
            port: proxy.port,
            auth: {
                username: proxy.login,
                password: proxy.password
            }
		}
	}

	logger.info('Список прокси загружен в массив')
}

exports.proxies = proxies;