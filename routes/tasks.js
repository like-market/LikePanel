const utils   = require("../utils");
const express = require('express')
const router = express.Router()
const db = require('../db');


router.get('/', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	tasks_count = await db.tasks.getUserTaskCount(req.user.id)
	tasks = await db.tasks.getUserTasks(req.user.id)
	// Добавляем url
	tasks.forEach(function(task) {
		task.url = utils.urlparser.createURL(task.object_type, task.user_id, task.item_id);
	})

	res.render('tasks', {user: req.user, tasks, tasks_count});
});

/**
 * Получаем список задач
 * @rapam count  - количество задач
 * @param offset - смещение
 */
router.post('/get_tasks', async function(req, res) {
	if (!req.isAuthenticated()) return res.redirect('/login');

	if (parseInt(req.body.count)  != req.body.count ||
		parseInt(req.body.offset) != req.body.offset)
	{
		return res.send('Error params');
	}

	tasks = await db.tasks.getUserTasks(req.user.id, req.body.count, req.body.offset);
	// Добавляем url
	tasks.forEach(function(task) {
		task.url = utils.urlparser.createURL(task.object_type, task.user_id, task.item_id);
	})
	res.send(JSON.stringify(tasks))	
})

module.exports = router