const express = require('express');
const router  = express.Router();

const db = require('../../db');

const moment = require('moment');
require('moment/locale/ru');


router.get('/', async function(req, res){
    if (!req.isAuthenticated()) return res.redirect('/login');
    if (!req.user.admin) return res.redirect('/panel');

    let groups = await db.account_groups.selectGroupsAndAccountCount();
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

module.exports = router;