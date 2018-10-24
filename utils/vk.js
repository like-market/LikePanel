var db = require('../db');
var vkapi = require('../vkapi');

exports.addAccount = function(accounts) {
	for (i = 0; i < accounts.length; i++) {
		let account = accounts[i]
		vkapi.authorize(account.login, account.password, function(err, response) {
			if (err) return console.error(err);
			db.vk.addAccount(response.user_id, account.login,
				account.password, response.access_token, function(err, data) {})
		})
	}
}

exports.updateAccounts = function() {
	db.vk.getAllAccounts(function(err, accounts) {
		for (i = 0; i < accounts.length; i++) {
			let account = accounts[i]
			if(account.status == 'need_token') {
				vkapi.authorize(account.login, account.password, function(err, response) {
					if (err) {
						if (err.type == 'invalid_client') {
							db.vk.setAccountStatus(account.user_id, 'incorrect')
							console.log(account.user_id + ' невалидный')
						}else {
							console.error(err);
						}
						return;
					}

					db.vk.setAccountToken(account.user_id, response.access_token)
					db.vk.setAccountStatus(account.user_id, 'active')
				})
			}
		}
	})
}

exports.updateAccounts();