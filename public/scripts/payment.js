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
		// return
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

$(document).ready(function(){
	let params = new URLSearchParams(document.location.search.substring(1));
	let amount = parseInt(params.get("amount"), 10);
	let pay_id = parseInt(params.get("pay_id"), 10); // is the number 18

    if (amount) {
    	toastr.info(`Вы оплатили счет №${pay_id}<br/>Баланс пополнен на ${amount}₽`, { timeOut: 5000 });
    }
})