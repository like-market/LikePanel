const db = require('../db');

/**
 * Проверяем данные для постхантера (добавление и изменение)
 *
 * name  {Строка}  Название задачи [не больше 60 знаков]
 * url   {Строка}  Ссылка на группу вк вида vk.com/pibic999
 * min_likes  {Число || Пустая строка}  [Больше 50]
 * max_likes  {Число || Пустая строка}  [Больше или равно ${min_likes}]
 * min_comments  {Число || Пустая строка}   [Больше или равно 0]
 * max_comments  {Число || Пустая строка}   [Больше или равно ${min_comments}] 
 * comments      {Строка || Пустая строка}  [Если min_comments не пустая, то comments не пустая]
 * entry_text    {Строка || Пустая строка}  Текст для поиска [Не больше 150 символов]
 * time_from  {Строка HH:MM} [От 00:00        до 23:59]
 * time_to 	  {Строка HH:MM} [От ${time_from} до 23:59]
 * like_ads      {Символ '0' или '1'}
 * like_repost   {Символ '0' или '1'}
 * like_content  {Символ '0' или '1'}
 * autostop      {Символ '0' или '1'}
 */
exports.validate = async function(req, res) {
	// Проверка названия
	if (req.body.name.length > 60) return res.send('Название может содержать максимум 60 символов')

	// Проверка URL
    const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9_]+)(\?.+)?/;
    if (!regex.test(req.body.url)) return res.send('Неверный формат URL');

	// Проверка лайков
	const min_likes = parseInt(req.body.min_likes);
	const max_likes = parseInt(req.body.max_likes);
	if (min_likes || max_likes) {
		if (!min_likes) return res.send('Неверное количество мин. лайков')
		if (!max_likes) return res.send('Неверное количество мак. лайков')
		if (min_likes > max_likes) return res.send('Неверный диапазон лайков')
		if (min_likes < 50) return res.send('Минимальное количество лайков - 50')
	}else {
		req.body.min_likes = 0;
		req.body.max_likes = 0;
	}

	// Проверка комментариев
	let min_comments = parseInt(req.body.min_comments);
	let max_comments = parseInt(req.body.max_comments);
	if (min_comments || max_comments) {
		if (!min_comments) return res.send('Неверное количество мин. комментариев')
		if (!max_comments) return res.send('Неверное количество мак. комментариев')
		if (min_comments > max_comments) return res.send('Неверный диапазон комментариев')
	}else {
		req.body.min_comments = 0;
		req.body.max_comments = 0;
	}

	if (!req.body.min_likes && !req.body.min_comments) {
		return res.send('Введите количество лайков и/или комментариев для накрутки');
	}

	// Проверка наборов комментариев
	if (min_comments || max_comments) {
		const comments = req.body.comments;
		if (!Array.isArray(comments))       return res.send('Нужно добавить хотя бы один набор комментариев')
		if (!comments.length)               return res.send('Нужно добавить хотя бы один набор комментариев')
		if (!comments.includeOnlyNumbers()) return res.send('Один из наборов комментариев не найден')

		// Получение данных о наборах
		const comments_data = await db.comments.getCommentsData(req.body.comments);
		if (comments_data.length != comments.length) return res.send('Один из наборов комментариев не найден')

    	// Может ли пользователь использовать выбранные наборы
    	for (comment_data of comments_data) {
	    	if (comment_data.owner_id != 0 && comment_data.owner_id != req.user.id) {
	    		return res.send('Нет доступа к одному из наборов комментариев')
	    	}
	    	if (comment_data.status != 'accept') {
	    		return res.send('Один из наборов комментариев не активен')
	    	}
    	}
    }

    // Приводим все к единице
    req.body.autostop     = +(req.body.autostop     == '1');
	req.body.like_ads     = +(req.body.like_ads     == '1');
	req.body.like_repost  = +(req.body.like_repost  == '1');
	req.body.like_content = +(req.body.like_content == '1');


    if (req.body.entry_text.length > 500) {
        return res.send('Максимальная длина фраз для поиска - 500 символов');
    }

	if (!req.body.like_ads && !req.body.like_repost && !req.body.like_content) return res.send('Выберите хотя бы один вариант, когда будет работать накрутка')

	// Проверка времени
	const time_reg = /^[0-2]\d:[0-6]\d$/
    const time_from = req.body.time_from;
    const time_to   = req.body.time_to;
    if (!time_reg.test(time_from) || !time_reg.test(time_to)) return res.send('Неверный формат времени')
    if (time_from > time_to) return res.send('Неверный диапазон времени');
}