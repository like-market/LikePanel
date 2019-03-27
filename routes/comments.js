var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
require('moment/locale/ru');

/** Замена символов в комментариях */
const replace_from = ['А', 'Е', 'В', 'Х', 'О', 'Р', 'К', 'С', 'М', 'Т', 'Н', 'а', 'у', 'е', 'х', 'о', 'р', 'с'];
const replace_to   = ['A', 'E', 'B', 'X', 'O', 'P', 'K', 'C', 'M', 'T', 'H', 'a', 'y', 'e', 'x', 'o', 'p', 'c'];

router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');
	
	var comments = await db.comments.getUserComments(req.user.id);

	res.render('comments', {
		user: req.user,
		comments: comments,
		moment: moment
	});
});

/**
 * Добавляем набор комментариев
 * @query_param  id - идентефикатор комментарий
 * @query_param  name - название набора
 * @query_param  text - комментарии
 */
router.post('/add', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');

	// Проверка названия 
	let name = req.body.name.replace(/['"]/g, '')
	if (name.length == 0 || name.length > 50) {
		return res.send('Ошибка в названии')
	}
	
	// Заменяем на ||| для удобства просмотра бд
	let text = req.body.text.replace(/\n/g, '|||').replace(/['"]/g, '');
	// Проверка комментариев [длина общего текста]
	if (text.length > 65000) {
		return res.send('Комментариев слишком много<br/>Максимальная длинна 50000 символов')
	}

	// Проверка комментариев [количество]
	const count = text.split('|||').length;
	if (count < 50) {
		return res.send('Комментариев слишком мало')
	}

	text = text.replaceArray(replace_from, replace_to);

	db.comments.add(req.user.id, name, text, count);
	res.send('Success');
})

/**
 * Получаем набор комментариев по его id
 * @query_param  id - идентефикатор комментарий
 */
router.post('/get', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');

	let comment_id = req.body.id

	// Проверка на то, что это число
	if (!Number.isInteger(comment_id)) {
		return res.send('Error ID');
	}

	var comment = await db.comments.get(comment_id);
	
	// Если пользователь - не админ, то проверяем, что набор принадлежит ему
	if (!req.user.admin && req.user.id != comment.owner_id) {
		return res.send('Access error')
	}

	// Убираем замену \n на |||
	comment.text = comment.text.replace(/\|\|\|/g, '\n');

	res.send(JSON.stringify(comment));
})

/**
 * Изменяем набор комментариев
 * @query_param  id - идентефикатор комментариев
 * @query_param  name - новое название
 * @query_param  text - новый текст
 */
router.post('/edit', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');

	// Проверка комментариев
	let comment_id = req.body.id;
	if (!Number.isInteger(comment_id)) {
		return res.send('Ошибка в comment id');
	}

	let name = req.body.name.replace(/['"]/g, '')
	if (name.length == 0 | name.length > 50) {
		return res.send('Ошибка в названии')
	}

	// Заменяем на | для удобства просмотра бд
	let text = req.body.text.replace(/\n/gi, '|||').replace(/['"]/g, '');;
	// Проверка комментариев [длина общего текста]
	if (text.length > 65000) {
		return res.send('Комментариев слишком много<br/>Максимальная длинна 50000 символов')
	}

	// Проверка комментариев [количество]
	const count = text.split('|||').length;
	if (count < 50) {
		return res.send('Комментариев слишком мало')
	}

	// Проверяем, что комментарий принадлежит пользователю
	let comment = await db.comments.get(comment_id);
	if (req.user.id != comment.owner_id) return res.send('Access error')

	text = text.replaceArray(replace_from, replace_to);

	db.comments.edit(comment_id, name, text, count);
	res.send('Success');
})

/**
 * Удаляет набор комментариев
 * @query_param  id - идентефикатор комментариев
 */
router.post('/delete', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');

	let comment_id = req.body.id;
	if (!Number.isInteger(comment_id) || /['"]/g.test(comment_id)) {
		res.send('Ошибка в comment id')
	}

	// Если пользователь не админ, то проверяем, что набор принадлежит юзеру
	if (!req.user.admin) {
		var comment = await db.comments.get(comment_id);
		if (req.user.id != comment.owner_id) return res.send('Access error')
	}

	db.comments.setStatus(comment_id, 'inactive');
	res.send('Success');
})

/**
 * Подтверждает набор комментариев
 * @restrict Доступно только админам
 * @query_param  id - идентефикатор комментариев
 * @query_param  status - статус комментариев [accept, reject, delete]
 */
router.post('/setstatus', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');
	if (!req.user.admin) return res.send('Access error');

	db.comments.setStatus(req.body.id, req.body.status);
	res.send('Success');
})


/**
 * Получаем 'следующий' неактивный набор комментариев 
 * @restrict Доступно только админам
 * @query_param  id - идентефикатор комментариев (смещение)
 */
router.post('/getnext', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');
	if (!req.user.admin) return res.send('Access error');

	var offset = req.body.offset;

	comment = await db.comments.getOneChecking(offset);
	// Если комментарий не найден
	if (comment == null) return res.send('Does not exist');

	comment.create = moment(comment.create).format("D MMMM YYYY"); // Форматируем дату создания
	comment.text = comment.text.replace(/\|\|\|/g, '\n'); 	// Убираем замену \n на |||

	res.send(JSON.stringify(comment));
})

module.exports = router