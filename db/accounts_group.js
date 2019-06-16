const logger = require('../logger.js');
const db = require('./index.js');

const GROUP_ID = {
    UNUSED: 0, // Неиспользуемые аккаунты
    
    LIKE: 10,  // Аккаунты для лайков

    // Диапазоны ID групп для комментирования
    COMMENT_25_MIN: 100, // В которых 25 аккаунтов
    COMMENT_25_MAX: 199,

    COMMENT_50_MIN: 200, // В которых 50 аккаунтов 
    COMMENT_50_MAX: 299
};

/**
 * Получаем диапазон id для наборов, предназначенных для комментирования
 * @param count - количество аккаунтов в наборе 
 * @return object {from, to}
 */
const getCommentGroupIdRange = function(count) {
    if (count != 25 && count != 50) return logger.warn(`Невозможно получить id для ноыой группы из ${count} аккаунтов`);
    if (count == 25) {
        return { from: GROUP_ID.COMMENT_25_MIN, to: GROUP_ID.COMMENT_25_MAX };
    }
    if (count == 50) {
        return { from: GROUP_ID.COMMENT_50_MIN, to: GROUP_ID.COMMENT_50_MAX };
    }
};

/**
 * Получаем количество активных нераспределенных аккаунтов
 */
exports.getUnusedAccountsCount = async function() {
    const sql = `SELECT COUNT(*) FROM account_vk WHERE account_vk.group = ${GROUP_ID.UNUSED} AND status = 'active'`;
    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result[0]))['COUNT(*)'];
};

/**
 * Получаем активные нераспределенные аккаунты
 * @param count - количество нераспределенных аккаунтов
 */
exports.getUnusedAccounts = async function(count) {
    const sql = `SELECT * FROM account_vk WHERE account_vk.group = ${GROUP_ID.UNUSED} AND status = 'active' LIMIT ${count}`;
    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result));
};

/**
 * Получаем активные аккаунты, предназначеные для лайков
 */
exports.getAccountsForLike = async function() {
    const sql = `SELECT * FROM account_vk WHERE account_vk.group = ${GROUP_ID.LIKE} AND status = 'active'`;
    const result = await db.async_query(sql);
    
    return JSON.parse(JSON.stringify(result));
};

/**
 * Получаем набор акк, предназначенный для комментирования
 * @param count - количество аккаунтов в наборе (25 или 50)
 */
exports.getAccountsForComment = async function(count) {
    const id = getCommentGroupIdRange(count);

    const sql = `SELECT * FROM likepanel.account_vk WHERE account_vk.group = (
        SELECT id FROM likepanel.account_group
        WHERE id >= ${id.from} AND id < ${id.to}
        AND status = 'active'
        ORDER BY last_used ASC
        LIMIT 1
    );`;

    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result));  
};

/**
 * Получаем количество аккаунтов в наборе
 * @param group_id - id набора
 */
exports.getAccountsInGroupCount = async function(group_id) {
    const sql = `SELECT COUNT(*) FROM account_vk WHERE account_vk.group = ${group_id} AND status = 'active'`;

    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result[0]))['COUNT(*)'];  
};

/**
 * Устанавливаем группу аккаунту вк
 * @param user_id - id аккаунта вк
 * @param group_id   - id набора аккаунтов
 */
exports.setAccountGroup = function(user_id, group_id) {
    const sql = `UPDATE account_vk SET account_vk.group = ${group_id} WHERE user_id = ${user_id}`;
    db.async_query(sql);
};

/**
 * Получаем свободный id для нового набора аккаунтов
 * @param count - число аккаунтов в наборе (25 или 50)
 */
exports.getFreeCommentId = async function(count) {
    const id = getCommentGroupIdRange(count);
    const sql = `SELECT id + 1 AS available_id
        FROM account_group AS t
        WHERE id >= ${id.from}
        AND id < ${id.to}
        AND NOT EXISTS (
            SELECT * 
            FROM account_group
            WHERE id = t.id + 1
        )
        ORDER BY id
        LIMIT 1`;
    const result = await db.async_query(sql);
    // Если в бд еще нет записи
    if (result.length == 0) return id.from;
    return JSON.parse(JSON.stringify(result[0]))['available_id'];
};

/**
 * Добавляем запись о новом наборе аккаунтов
 * @param group_id - id набора аккаунтов
 * @param count - количество аккаунтов в группе
 */
exports.addNewGroup = function(group_id) {
    const sql = `INSERT INTO account_group(id) VALUES(${group_id})`;
    db.async_query(sql);
};

/**
 * Пробуем создать новый набор аккаунтов
 * 1. Проверяем, что достаточно неиспользуемых аккаунтов
 * 2. Проверяем, что достаточно неиспользуемых прокси
 * 3. Получаем ID новой группы
 * 4. Получаем свободные аккаунты
 * 5. У каждого аккаунта устанавливаем группу и прокси
 * 6. Добавляем запись о новой группе аккаунтов
 * 
 * @param count - число аккаунтов в наборе (25 или 50)
 */
exports.tryCreateCommentGroup = async function(count) {
    if (count != 25 && count != 50) return logger.warn(`Невозможно создать набор из ${count} аккаунтов`);
    
    const unusedAccountsCount = await exports.getUnusedAccountsCount();
    if (unusedAccountsCount < count) {
        logger.debug(`Пытаемся  создать группу с ${count} аккаунтов, но свободно только ${unusedAccountsCount}`);
        return;
    }

    const unusedProxiesCount = await db.proxy.getUnusedProxiesCount();
    const needProxiesCount = Math.ceil(count / 10); // На 1 прокси приходится максимум 10 аккаунтов
    if (unusedProxiesCount < needProxiesCount) {
        logger.error(`Не хватает прокси (${unusedProxiesCount}) для создания набора из ${count} акк`);
        return;
    }

    const newGroupId = await exports.getFreeCommentId(count); // Получаем ID новой группы
    logger.debug(`Начинаем создавать новую группу аккаунтов из ${count} акк с ID ${newGroupId}`);

    const accounts = await exports.getUnusedAccounts(count);
    const proxies  = await db.proxy.getUnusedProxies(needProxiesCount);
    
    for (let proxy of proxies) {
        logger.debug(`Устанавливаем прокси ${proxy.id} группу ${newGroupId}`);
        db.proxy.setProxyGroup(proxy.id, newGroupId);
    }
    let proxy_id = 0; // Счетчик, для установки прокси
    for (let account of accounts) {
        // Зацикливаем счетчик
        if (proxy_id >= proxies.length) proxy_id = 0; 
        logger.debug(`Устанавливаем аккаунту ${account.user_id} прокси ${proxies[proxy_id].id} и группу ${newGroupId}`);
        db.vk.setAccountProxyId(account.user_id, proxies[proxy_id].id);
        proxy_id++;

        exports.setAccountGroup(account.user_id, newGroupId);
    }

    logger.debug(`Добавляем информацию о новой группе ${newGroupId}`);
    exports.addNewGroup(newGroupId);
};

/**
 * Удаляем набор аккаунтов, предназначенный для комментирования
 * 1. Устанавливаем group_id у аккаунтов в GROUP_ID.UNUSED
 * 2. Устанавливаем group_id у прокси в PROXY_ID.UNUSED
 */
exports.removeGroupForComment = async function(group_id) {
    logger.info(`Удаляем набор аккаунтов ${group_id}`);
    let sql = `UPDATE account_vk SET account_vk.group = ${GROUP_ID.UNUSED} WHERE account_vk.group = ${group_id}`;
    db.async_query(sql);

    sql = `DELETE FROM account_group WHERE id = ${group_id}`;
    db.async_query(sql);

    db.proxy.removeProxiesGroup(group_id);
};

/**
 * Обновляем все наборы аккаунтов
 * 
 * Для всех наборов для комментирования запускаем функцию обновления набора
 */
exports.updateAllCommentGroups = async function() {
    const groups = await exports.selectGroupsAndAccountCount();
    for (let group of groups) {
        // Пропускаем неиспользуеммые аккаунты и набор для лайков
        if (group.id == GROUP_ID.UNUSED || group.id == GROUP_ID.LIKE) continue;
    
        await exports.updateCommentGroup(group.id);
    }
};

/**
 * Обновляем набор аккаунтов, предназначенный для комментирования
 * 1. Если не хватает аккаунтов в наборе, то пробуем добавить из неиспользуемых аккаунтов
 * 2. Если после этого аккаунтов в наборе меньше 80%, то расформировываем группу
 */
exports.updateCommentGroup = async function(group_id) {
    logger.debug(`Начало обновления набора ${group_id}`);
    if (group_id >= GROUP_ID.COMMENT_25_MIN && group_id < GROUP_ID.COMMENT_25_MAX) var need = 25;
    if (group_id >= GROUP_ID.COMMENT_50_MIN && group_id < GROUP_ID.COMMENT_50_MAX) var need = 20;

    const accountsInGroupCount = await exports.getAccountsInGroupCount(group_id);

    // Если не хватает аккаунтов
    if (accountsInGroupCount < need) {
        logger.debug(`В наборе не хватает ${need - accountsInGroupCount} акк (сейчас ${accountsInGroupCount})`);
        const unusedAccountsCount = await exports.getUnusedAccountsCount();
        
        // Если после добавления аккаунтов в наборе все-равно будет слишком мало аккаунтов - удаляем группу
        if (accountsInGroupCount + unusedAccountsCount < need * 0.8) {
            logger.info(`Не хватает акк для добавления в набор ${group_id}. Свободно только ${unusedAccountsCount} акк`);
            await exports.removeGroupForComment(group_id);
            return;
        }

        const accounts = await exports.getUnusedAccounts(need - accountsInGroupCount);
        const proxies  = await db.proxy.getProxiesInGroupWithAccountCount(group_id);


        for (let account of accounts) {
            logger.info(`Добавили ${account.user_id} акк в набор ${group_id}`);
            await exports.setAccountGroup(account.user_id, group_id);

            let proxy_index = 0; // Индекс прокси в массиве с наименьшим кол-вом аккаунтов
            let min_count = proxies[0].account_count;
            proxies.forEach((proxy, index) => {
                if (proxy.account_count < min_count) {
                    min_count = proxy.account_count;
                    proxy_index = index;
                }
            });
            proxies[proxy_index].account_count++;

            logger.info(`Установили прокси ${proxies[proxy_index].id} для ${account.user_id} акк`);
            db.vk.setAccountProxyId(account.user_id, proxies[proxy_index].id);
        }
    }

};

/**
 * Получаем данные о всех группах и кол-во аккаунтов в каждой группе
 */
exports.selectGroupsAndAccountCount = async function() {
    const sql = 'SELECT account_group.*, COUNT(account_vk.id) as account_count \
        FROM likepanel.account_group \
        LEFT OUTER JOIN likepanel.account_vk ON account_vk.group = account_group.id \
        WHERE account_vk.status="active" \
        GROUP BY account_group.id';
    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result));
};

/**
 * Обновляем время последнего использования набора аккаунтов
 * @param group_id
 */
exports.updateLastUsedForGroup = async function(group_id) {
    const sql = `UPDATE account_group SET last_used = CURRENT_TIMESTAMP WHERE id = ${group_id}`;
    db.async_query(sql);
};