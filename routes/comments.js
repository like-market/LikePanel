var path    = require("path");
var express = require('express')
var router = express.Router()
var db = require('../db');

var moment = require('moment');
require('moment/locale/ru');


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

	var name = req.body.name
	// Заменяем на ||| для удобства просмотра бд
	var text = req.body.text.replace(/\n/gi, '|||');
	var count = text.split('|||').length;


	// Корректность данных
	if (count < 5) return res.send('Text too small');
	if (name == '') return res.send('Name too small');

	db.comments.add(req.user.id, name, text, count);
	res.send('Success');
})

/**
 * Получаем набор комментариев по его id
 * @query_param  id - идентефикатор комментарий
 */
router.post('/get', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');

	var comment_id = req.body.id
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

	var comment_id = req.body.id;
	var name = req.body.name
	// Заменяем на | для удобства просмотра бд
	var text = req.body.text.replace(/\n/gi, '|||');
	var count = text.split('|||').length;

	// Проверяем, что комментарий принадлежит пользователю
	var comment = await db.comments.get(comment_id);
	if (req.user.id != comment.owner_id) return res.send('Access error')

	db.comments.edit(comment_id, name, text, count);
	res.send('Success');
})

/**
 * Удаляет набор комментариев
 * @query_param  id - идентефикатор комментариев
 */
router.post('/delete', async function(req, res) {
	if (!req.isAuthenticated()) return res.send('Unauthorized');

	var comment_id = req.body.id;

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