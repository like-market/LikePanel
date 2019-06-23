const express = require('express');
const router  = express.Router();

const db = require('../../db');

const moment = require('moment');
require('moment/locale/ru');


router.get('/', async function(req, res){
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (!req.user.admin) return res.redirect('/panel');

    let groups = await db.accounts_group.selectGroupsAndAccountCount();
    groups.forEach(group => {
        group.last_used = moment(group.last_used).format('DD MMMM HH:mm:ss');
        if (group.id == 0) group.comment = 'Неиспользуемые аккаунты';
        if (group.id == 10) group.comment = 'Аккаунты для лайков';
        if (group.id >= 100) group.comment = 'Аккаунты для комментирования';
    });
    
    res.render('account_group', {
        user: req.user,
        groups
    });
});

/**
 * Запрос на создание нового набора аккаунтов
 * @body {Number} count - количество аккаунтов в наборе
 */
router.post('/create_group', async function(req, res) {
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (!req.user.admin) return res.redirect('/panel');

    const result = await db.accounts_group.tryCreateCommentGroup(req.body.count);
    res.send(result);
});

/**
 * Запрос на удаление набора аккаунтов
 * @body {Number} group_id - id набора аккаунтов
 */
router.post('/remove_group', async function(req, res) {
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (!req.user.admin) return res.redirect('/panel');

    db.accounts_group.removeGroupForComment(req.body.group_id);
    res.send('ok');
});

/**
 * Запрос на добавление аккаунтов в набор для лайков
 * @body {Number} account_count - количество аккаунтов
 */
router.post('/add_account_to_like_group', async function(req, res) {
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (!req.user.admin) return res.redirect('/panel');

    const result = await db.accounts_group.addAccountsToLikesGroup(req.body.account_count);
    res.send(result);
});

/**
 * Запрос на удаление аккаунтов из набора для лайков
 * @body {Number} account_count - количество аккаунтов
 */
router.post('/remove_account_from_like_group', async function(req, res) {
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (!req.user.admin) return res.redirect('/panel');

    db.accounts_group.removeAccountsFromLikeGroup(req.body.account_count);
    res.send('ok');
});

module.exports = router;