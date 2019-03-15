/**
 * Возаращаем название для типа объекта
 */
module.exports = function get(type) {
	switch (type) {
		case 'post':
			return 'Запись'
		case 'photo':
			return 'Фото'
		case 'video':
			return 'Видео'
		case 'market':
			return 'Товар'
	}
}