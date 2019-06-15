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
    if (count != 25 && count != 50) return logger.warn(`Невозможно получить id для ноыой группы из ${count} аккаунтов`);
    if (count == 25) {
        var from = GROUP_ID.COMMENT_25_MIN;
        var to   = GROUP_ID.COMMENT_25_MAX;
    }
    if (count == 50) {
        var from = GROUP_ID.COMMENT_50_MIN;
        var to   = GROUP_ID.COMMENT_50_MAX;
    }
    const sql = `SELECT id + 1 AS available_id
        FROM account_group AS t
        WHERE 
        id >= ${from}
        AND id < ${to}
        AND NOT EXISTS (
            SELECT * 
            FROM account_group
            WHERE id = t.id + 1
        )
        ORDER BY id
        LIMIT 1`;
    const result = await db.async_query(sql);
    // Если в бд еще нет записи
    if (result.length == 0) return from;
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
 * Получаем данные о всех группах и кол-во аккаунтов в каждой группе
 */
exports.selectGroupsAndAccountCount = async function() {
    const sql = 'SELECT account_group.*, COUNT(account_vk.id) as account_count \
        FROM likepanel.account_group \
        LEFT OUTER JOIN likepanel.account_vk ON account_vk.group = account_group.id \
        GROUP BY account_group.id';
    const result = await db.async_query(sql);
    return JSON.parse(JSON.stringify(result));
};