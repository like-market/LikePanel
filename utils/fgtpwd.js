const randtoken = require('rand-token');
const logger = require('../logger.js');
const db = require('../db');

const mailgun = require('mailgun-js')({
	apiKey: 'a588734ff72e1e669c6c9fa60b20578a-de7062c6-3f620808',
	domain: 'mail.like-market.ru'
});


/**
 * Запрос на получение нового пароля
 * @param user - пользователя
 * @param ip   - ip адрес, с которого совершен запрос
 */
exports.requestPassword = async function(user, ip) {
	// Если с этого ip адреса уже сделали запрос в течении суток
	const request_count = await db.fgtpwd.getRequestCount(ip);
	if (request_count > 2) return logger.warn(`С ${ip} запросили пароль слишком много раз`);

	const token = randtoken.generate(16);
	db.fgtpwd.addRequest(user.id, token, ip);

	const data = {
		from: 'Like-Market <admin@like-market.ru>',
		to: user.email,
		subject: 'Восстановление пароля',
		html:
		   `<div style="background:#eee;padding:30px;">
				<div style="background:#fff;padding: 15px 20px;width: 550px;border: 1px solid #f6a821;border-radius:10px;margin: 0 auto;font: normal 13px/19px Verdana;box-shadow: 0 3px 7px rgba(0,0,0,.1);">
					<h2 style="font:normal 21px/48px Arial;color: #222;padding: 0 0 0 68px;background: url(https://like-market.ru/images/like2.png) no-repeat 0 50%;background-size: 50px; margin: 0;">
						Восстановление пароля
					</h2>

					<div style="padding: 15px 0;">
						Уважаемый <b>${user.username}</b>. Вы сделали запрос на получение забытого пароля на сайте Like Market. Чтобы получить новый пароль, пройдите по ссылке ниже:
					</div>
					<a href="https://dev.like-market.ru/forgotPassword?token=${token}" style="width: 400px;margin:0 auto;display: block;background: #F6A821 repeat-x 0 0;color: #fff;font-weight:bold; line-height: 44px;text-align: center;text-transform: uppercase;text-decoration: none;border-radius: 3px;text-shadow: 0 1px 3px rgba(0,0,0,.35);border: 1px solid #388E3C;box-shadow: inset 0 1px rgba(255,255,255,.4);">
						Восстановить пароль
					</a>
					<div style="padding: 15px 0;"> 
						Если вы не делали запроса для получения пароля, то просто удалите данное письмо. Ваш пароль храниться в надежном месте и недоступен посторонним лицам.
					</div>
				</div>
			</div>`
	};

	mailgun.messages().send(data, function (error, body) {
		if (error) logger.warn('При отправке почтового сообщения возникла ошибка', {json: error});
	});
}

/**
 * Создаем новый пароль для пользователя
 * @param token_id - id записи в таблице forgot_password
 * @param user_id  - id пользователя
 */
exports.generateNewPassword = async function(token_id, user_id) {
	// Говорим что токен уже использовался
	await db.fgtpwd.setUsed(token_id);

	// Генерируем новый пароль
	const password = randtoken.generate(12);

	const user = await db.users.findById(user_id);
	db.users.updateData(user.username, password, user.email)

	const data = {
		from: 'Like-Market <admin@like-market.ru>',
		to: user.email,
		subject: 'Новый пароль',
		html:
		   `<div style="background:#eee;padding:30px;">
				<div style="background:#fff;padding: 15px 20px;width: 550px;border: 1px solid #f6a821;border-radius:10px;margin: 0 auto;font: normal 13px/19px Verdana;box-shadow: 0 3px 7px rgba(0,0,0,.1);">
					<h2 style="font:normal 21px/48px Arial;color: #222;padding: 0 0 0 68px;background: url(https://like-market.ru/images/like2.png) no-repeat 0 50%;background-size: 50px; margin: 0;">
						Ваш новый пароль
					</h2>
					<a style="width: 400px;margin:0 auto;display: block;background: #F6A821 repeat-x 0 0;color: #fff;font-weight:bold; line-height: 44px;text-align: center;text-decoration: none;border-radius: 3px;text-shadow: 0 1px 3px rgba(0,0,0,.35);border: 1px solid #388E3C;box-shadow: inset 0 1px rgba(255,255,255,.4);">
						${password}
					</a>
					<div style="padding: 15px; text-align: center;"> 
						Сменить данный пароль можно в разделе <a href="https://dev.like-market.ru/profile" style="color: #f6a821">Профиль</a>
					</div>
				</div>
			</div>`
	};

	mailgun.messages().send(data, function (error, body) {
		if (error) logger.warn('При отправке почтового сообщения возникла ошибка', {json: error});
	});

	return password;
}