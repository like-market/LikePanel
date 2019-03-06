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

    // Для того чтобы что-то изменить нужен текущий пароль
	let repeat = $('#repeat').val();
	if (repeat == '') {
        toastr.error('Введите текущий пароль')
        $('#repeat').css('border', '1px solid red')
        error++;
    }

    let password = $('#password').val()
    let mail = $('#mail').val()

    if (password == '' && mail == '') {
        toastr.error('Вы можете изменить почту и/или пароль')
        error++;
    }
    if (error) return;

    // Если изменен пароль
    if (password != '' && (password.length < 6 || password.length > 30)) {
        toastr.error('Пароль может содержать от 6 до 30 символов')
        $('#password').css('border', '1px solid red')
        error++;
    }

    // Проверка допустимых символов в пароле
    let format = /^[a-zA-Z0-9а-яА-Я]+$/;
    if (password != '' && !format.test(password)) {
        toastr.error('Пароль может содержать только буквы и цифры')
        $('#password').css('border', '1px solid red')
        error++;
    } 

    // Если изменена почта
    format = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/
    if (mail != '' && !format.test(mail)) {
        $("#email").css("border", "1.5px solid red");
        toastr.error("Почтовый адрес не валиден");
        error++;
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