/**
 * Функция для парсинга url
 * @param url - ссылка на запись
 * @return {type, owner_id, item_id}
 */
exports.parseURL = function(url) {
	// Проверка на то, что это запись на стене
	const post = /(https?:\/\/)?vk.com\/(.*w=)?wall(.[0-9\-]+)_(\d+)(&.*|%.*)?/i;
	let math = post.exec(url);

	if (math != null) {
		return {type: 'post', owner_id: math[3], item_id: math[4]}
	}

	// Проверка на то, что это фотография
	const photo = /(https?:\/\/)?vk.com\/(.*z=)?photo(.[0-9\-]+)_(\d+)(&.*|%.*)?/i;
	math = photo.exec(url);
	if (math != null) {
		return {type: 'photo', owner_id: math[3], item_id: math[4]}
	}

	// Проверка на то, что это фотография
	const video = /(https?:\/\/)?vk.com\/(.*z=)?video(.[0-9\-]+)_(\d+)(&.*|%.*)?/i;
	math = video.exec(url);
	if (math != null) {
		return {type: 'video', owner_id: math[3], item_id: math[4]}
	}

	// Проверка на то, что это товар с маркета
	const market = /(https?:\/\/)?vk.com\/(.*w=)?product(.[0-9\-]+)_(\d+)(&.*|%.*)?/i;
	math = market.exec(url);
	if (math != null) {
		return {type: 'market', owner_id: math[3], item_id: math[4]}
	}

	return null;
}

exports.createURL = function(type, owner_id, item_id) {
	switch (type) {
		case 'post':  return `https://vk.com/wall${owner_id}_${item_id}`
		case 'photo': return `https://vk.com/photo${owner_id}_${item_id}`
		case 'video': return `https://vk.com/video${owner_id}_${item_id}`
		case 'market': return `https://vk.com/market${owner_id}_${item_id}`
		default: return 'error';
	}
}

/**
 * Создаем URL страницы пользователя или сообщества
 * @param object_id - ID группы/пользователя
 * @param type - тип объекта [group, user]
 */
exports.createPageURL = function(object_id, type = 'group') {
	// Убираем минус
	object_id = object_id.toString(10).replace(/-/g, '')
	switch (type) {
		case 'group': return `https://vk.com/club${object_id}`
		case 'user':  return `https://vk.com/ip${object_id}`
	}
}