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