const vkapi = require('./index.js')


/**
 * Можно ли комментировать
 */
exports.canComment = async function(type, owner_id, item_id) {
    switch (type) {
        case 'post':
			// Получаем запись
			const wall = await vkapi.wall.getById(owner_id, item_id);
            if (wall.error) {
            	console.log(type, owner_id, item_id);
            	console.log(wall.error);
            	return false;
            }
            // Если пост не найден
            if (!wall.response.length) return false;

            console.log(wall.response[0]);
            return wall.response[0].likes.can_like;

            break;
        case 'photo':
            method = 'photos.getComments';
            params.photo_id = item_id;
            break;
        case 'video':
            method = 'video.getComments';
            params.video_id = item_id
            break;
        case 'market':
            method = 'market.getComments';
            params.item_id = item_id
            break;
    }
}