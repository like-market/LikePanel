/**
 * Функция для парсинга url для лайканья
 * @param url - ссылка на запись
 *
 * @return {type, owner_id, item_id}
 */
exports.parse = function(url) {
	// Проверка на то, что это запись на стене
	var result = url.match(/wall([0-9-]*)_([0-9]*)/i)
	if (result && result.length == 3) {
		return {type: 'post', owner_id: result[1], item_id: result[2]}
	}

	// Проверка на то, что это фотография
	var result = url.match(/photo([0-9-]*)_([0-9]*)/i)
	if (result && result.length == 3) {
		return {type: 'photo', owner_id: result[1], item_id: result[2] }
	}	
}