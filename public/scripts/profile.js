toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

/**
 * Убираем красный цвет
 */
$('#repeat, #password, #mail').change(function() {
    $(this).css('border', '')
})

/**
 * Функция вызывается при нажатии на кнопку 'Имезинить'
 */
function applyChange() {
	let error = 0;

	let repeat = $('#repeat').val();
	if (repeat == '') {
        toastr.error('Введите текущий пароль')
        $('#repeat').css('border', '1px solid red')
        error++;
    }

    let password = $('#password').val()
    if (password != '' && (password.length < 6 || password.length > 20)) {
        toastr.error('Пароль может содержать от 6 до 20 символов')
        $('#password').css('border', '1px solid red')
        error++
    }

    let mail = $('#mail').val()

    // Если раньше почты не было, 
    if ($('#mail').attr("placeholder") != mail && mail != "") {
	    const regex = /.*@.*\..*/; // Вид у почты <название>@<поддомен>.<домен>
	    if (regex.exec(mail) == null) {
	    	toastr.error('Почтовый адрес не валиден')
	    	$('#mail').css('border', '1px solid red')
	    	error++;
	    }
    }

    if (error) return;

    $.ajax({
        type: 'POST',
        url: '/profile/change',
        data: {
            new_password: password,
            old_password: repeat,
            mail: mail
        },
        success: function(res) {
        	if (res == 'Ok') toastr.success('Данные успешно обновлены')
        	else toastr.error(res);
        }
    })
}