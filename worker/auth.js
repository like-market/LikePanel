/**
 * @name /worker/vk.js
 * @description Функции для работы с аккаунтами вк
 */
const queue = require('./index.js').queue;
const logger = require('../logger.js')
const db = require('../db')
const vkapi = require('../vkapi')
 
/**
 * Добавляем новый аккаунт
 *
 * Алгоритм
 * 1. Проверить что аккаунта нет в БД
 *    Обновляем данные только когда аккаунт не валидный
 * 2. Авторизовать аккаунт
 * 3. Добавить в бд
 *
 * @parallel 5
 *
 * @param login - логин
 * @param password}
 */
queue.process('auth', 5, async function(job, done) {
    const login    = job.data.login.replace(/ |\(|\)|\+|\-/g, "") // Убираем лишние символы +-() из логина
    const password = job.data.password

    // Проверка на то, что логин уже есть в бд
    const rows = await db.vk.getRowsByLogin(login);
    for (let row of rows) {
        // Если такие данные уже есть в бд
        if (row.login == login && row.password == password) {
            logger.warn(`Сочетание логина и пароля у акк ${login} уже есть в бд`)
            return done()
        }
        // Если аккаунт с данным логином уже активен
        if (row.status == 'active') {
            logger.warn(`Аккаунт ${login} уже активен с другим паролем`)
            return done()
        }
    }

    // Получаем случайный прокси
    const proxy = await db.proxy.getRandom();

    /**
     * В случае успеха возвращается
     * {access_token, expires_in, user_id}
     *
     * В случае ошибки ошибки авторизации
     * {error, error_description}
     *
     * В случае ошибки в axios запросе
     * {code, ...}
     */
    const response = await vkapi.authorize(login, password, proxy);

    // Если авторизация прошла успешно
    if (response.access_token) {
        // Проверяем что нужный user_id еще не авторизован в бд
        let account = await db.vk.getAccount(response.user_id);
        if (account && account.status == 'active') {
            logger.warn(`Пользователем ${login} с таким user_id уже авторизован`)
            return done();
        } 

        db.vk.addAccount(response.user_id, login, password, response.access_token, proxy.id)
        logger.info(`Добавили нового пользователя ${response.user_id}`)
        return done()
    }

    // Если авторизация не удалась
    if (response.error_type || response.error) {
        // Если неправильный логин или пароль
        if (response.error_type == 'username_or_password_is_incorrect') {
            logger.warn(`Не удалось добавить новый аккаунт ${login}:${password} - неверый пароль`)
            db.vk.addInvalidAccount(login, password)
            return done()
        }
        if (response.error == 'need_validation') {
            logger.warn(`Нужна валидация для нового аккаунта ${login}:${password}`)
            db.vk.addInvalidAccount(login, password)
            return done()
        }
    }

    // Если ошибка в axios запросе
    if (response.code) {
        logger.error(`Ошибка в axios запросе: ${response.code}`)
        return done();
    }

    // Произошла какая-то ошибка
    logger.error(`Неотслеживаемая ошибка при авторизации ${login}`)
    console.log(response)
    done()
})