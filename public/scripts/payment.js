toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true,
};

$("#amount").change(function() {
	$(this).css("border", "");
});

$('#pay').click(function() {
	const amount = $('#amount').val();

	if (parseInt(amount) != amount) {
		toastr.error('Некорректное значение')
		$("#amount").css("border", "1.5px solid red");
		return;
	}
	if (amount < 100 || amount > 10000) {
		toastr.error('Можно пополнить от 100 до 10\'000 руб')
		$("#amount").css("border", "1.5px solid red");
		return
	}

	$("button").prop("disabled", false);

	$.ajax({
    	type: "POST",
    	url: "/payment/pay",
    	data: {amount},
    	success: function(res) {
        	$("button").prop("disabled", false);
     		window.location.href = res;
     	}
	});
})

/**
 * Проверяем, если был пополнен баланс, то выводим toastr
 */
$(document).ready(function(){
	let params = new URLSearchParams(document.location.search.substring(1));
	let amount = parseInt(params.get("amount"), 10);
	let pay_id = parseInt(params.get("pay_id"), 10); // is the number 18

    if (amount) {
    	toastr.info(`Вы оплатили счет №${pay_id}<br/>Баланс пополнен на ${amount}₽`, { timeOut: 5000 });
    }
})

/**
 * Обновляем пагинацию
 */
function updatePagination() {
	// Вычисляем сколько всего страниц
	console.log(`Count: ${count} Page: ${page} Tasks: ${transactions_count}`)

	let to = (page) * (count);
	if (to > transactions_count) to = transactions_count;

	let from = (page - 1) * count + 1;

	// Если транзакций нет
	if (transactions_count == 0) $('#from').text(0);
	else $('#from').text(from);
	$('#to').text(to)

	console.log(`From: ${from} To: ${to}`)
}

/**
 * Обновляем список задач
 * @param count - количество задач на странице
 * @param page  - номер страницы
 */
function updateTransactions() {
	$('#transactions_panel').toggleClass('ld-loading');
	$.ajax({
	    type: 'POST',
	    url: '/payment/get_transactions',
	    data: {
	        count: count,
	        offset: (page - 1) * count
	    },
	    success: function(res) {
	    	console.log(res)
			let rows; // Для всех строк
			JSON.parse(res).forEach(function(trx) {
		        let row = `<tr><td>${trx.id}</td><td>`;
                if (trx.type == 'add') {
                	row += `+${(trx.amount / 1000).toFixed(2)}₽`
                }else if (trx.type == 'spend') {
                    row += `-${(trx.amount / 1000).toFixed(2)}₽`
                }
                row += `</td><td>${trx.description}</td><td>${trx.date}</td></tr>`

                rows += row;
		    });
		    $('#transactions-data').html(rows);
		    $('#transactions_panel').toggleClass('ld-loading');
	    },
	    error: function(XMLHttpRequest, textStatus, errorThrown) { 
	        alert(`Status: ${textStatus} \n Error: ${errorThrown}`);
	        console.log(errorThrown)
	    }
	})
}

function setCountOnPage(new_count) {
	// Если не изменили страницу
	if (count == new_count) return;
	count = new_count;
	
	max_page = Math.ceil(transactions_count / count);
	page = 1;               // Текущая страница - первая
	updateTransactions();   // Обновляем список задач
	updatePagination();     // Обновляем пагинацию

	$('#10, #25, #50, #100').removeClass('active');
	$(`#${count}`).toggleClass('active');
}

/**
 * Изменяем страницу
 * @param page - next/prev
 */
function changePage(type) {
	if (type == 'next') {
		let new_page = page + 1;
		console.log(new_page, max_page)
		if (new_page > max_page) return;
		page++;
		updateTransactions();
		updatePagination();
	}else {
		let new_page = page - 1;
		if (new_page < 1) return;
		page--;
		updateTransactions();
		updatePagination();
	}
}