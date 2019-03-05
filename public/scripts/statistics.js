toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true,
};

/**
 * Вывести все пополнения пользователя
 */
function showPayments() {
	$('#info_panel').toggleClass('ld-loading');
	$.ajax({
	    type: 'POST',
	    url: '/statistics/payments',
	    data: {
	        count: $('#count').val(),
	        offset: 0,
	        login: $('#username').val()
	    },
	    success: function(res) {
			if (res == 'User not found') {
				toastr.error('Пользователь не найден')
		    	$('#info_panel').toggleClass('ld-loading');
				return;
			}
			// Основная информация
			let html = '<div class="m-t-xs">'
			html += `Всего пополнено <a>${(res.refill / 1000).toFixed(2)}₽</a><br/>`;
			html += `Текущий баланс <a>${(res.balance / 1000).toFixed(2)}₽</a><br/>`
			html += `Цена 1к&nbsp;&nbsp<i style="font-size: 12px" class="fa pe-7s-like"></i>&nbsp;&nbsp<a>${res.like_price}₽</a><br/>`
			html += `Цена 1к&nbsp;&nbsp<i style="font-size: 12px" class="fa fa-commenting-o"></i>&nbsp;&nbsp<a>${res.comment_price}₽</a><br/>`
			html += '</div>'

			// Таблица
			html += `<table class="table table-vertical-align-middle table-striped table-hover"><thead><tr><th>Статус</th><th>Количество</th><th>Дата</th></tr></thead><tbody>`
			res.payments.forEach(function(payment) {
				html += '<tr><td>'
                switch (payment.status) {
                    case 'paid':     html += '<span class="label label-success">Оплачен</span>'; break;
                    case 'not paid': html += '<span class="label label-accent">Ожидание</span>'; break;
                    case 'fail':     html += '<span class="label label-danger">Ошибка</span>'; break;
                }
                html += `</td><td>${payment.amount}₽</td><td>${payment.create}</td></tr>`
			})
            html += '</tbody></table>'    

			$('#info').html(html);
		    $('#info_panel').toggleClass('ld-loading');
	    },
	    error: function(XMLHttpRequest, textStatus, errorThrown) { 
	        alert(`Status: ${textStatus} \n Error: ${errorThrown}`);
	        console.log(errorThrown)
	    }
	})
}

/**
 * Вывести все задачи пользователя
 */
function showTasks() {
	let login = $('#username').val();
	
	$('#info_panel').toggleClass('ld-loading');
	$.ajax({
	    type: 'POST',
	    url: '/statistics/tasks',
	    data: {
	        count: $('#count').val(),
	        offset: 0,
	        login: $('#username').val()
	    },
	    success: function(res) {
	    	if (res == 'User not found') {
				toastr.error('Пользователь не найден')
		    	$('#info_panel').toggleClass('ld-loading');
				return;
			}
	    	console.log(res)

			// Основная информация
			let html = '<div class="m-t-xs">'
			html += `Поставлено <a>${res.total_likes}&nbsp<i style="font-size: 12px" class="fa pe-7s-like"></i></a>&nbsp;&nbsp;и&nbsp;&nbsp;<a>${res.total_comments}&nbsp<i style="font-size: 12px" class="fa fa-commenting-o"></i></a><br/>`
			html += `Создано задач <a>${res.like_tasks}&nbsp<i style="font-size: 12px" class="fa pe-7s-like"></i></a>&nbsp;&nbsp;и&nbsp;&nbsp;<a>${res.comment_tasks}&nbsp<i style="font-size: 12px" class="fa fa-commenting-o"></i></a>`
			html += '</div>'


			// Таблица
			html += `<table class="table table-vertical-align-middle table-striped table-hover"><thead><tr><th>Статус</th><th>URL</th><th>Поставлено</th><th>Дата</th></tr></thead><tbody>`
			res.tasks.forEach(function(task) {
            	html += '<tr> <td>'
            	switch (task.status) {
            		case 'finish': html += '<span class="label label-success">Выполнена</span>'; break;
            		case 'run':    html += '<span class="label label-info">Выполняется</span>'; break;
            		case 'wait':   html += '<span class="label label-accent">Ожидание</span>'; break;
            		case 'error':  html += '<span class="label label-danger">Ошибка</span>'; break;
            	}
                html += `</td><td><div class="small"><a href="${task.url}" target="_blank">Ссылка</a></div></td><td>`
                if (task.type == 'like') {
                    html += '<i class="fa pe-7s-like"></i>' 
                }else {
                    html += '<i class="fa fa-commenting-o"></i>'
                }
                html += `${task.now_add}&nbsp;/&nbsp;${task.need_add}</td><td>${task.create}</td></tr>`
     		})
            html += '</tbody></table>'   
			
			$('#info').html(html);

		    $('#info_panel').toggleClass('ld-loading');
	    },
	    error: function(XMLHttpRequest, textStatus, errorThrown) { 
	        alert(`Status: ${textStatus} \n Error: ${errorThrown}`);
	        console.log(errorThrown)
	    }
	})
}