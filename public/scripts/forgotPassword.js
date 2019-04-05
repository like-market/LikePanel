toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

$('#send').click(function() {
	const data = $('#data').val();

    // Формат логина
    const login = /^[a-zA-Z0-9а-яА-Я]+$/;
    // Формат почты
    const mail = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/

    // Если входим по логину
    if (login.test(data)) {
        // Проверка длины логина
        if (data.length < 5 || data.length > 20) {
            error++;
            $("#data").css("border", "1.5px solid red");
            return toastr.error("Логин может содержать от 5 до 20 символов");
        }
    // Если входим по почте
    } else if (mail.test(data)) {
        if (data.length > 50) {
            error++;
            $("#data").css("border", "1.5px solid red");
            return toastr.error("Почта может содержать до 50 символов");
        }
    // Если написан ни логин, ни почта
    } else {
        $("#data").css("border", "1.5px solid red");
        return toastr.error("Неправильный логин или почта");
    }

    $('#send').prop("disabled", true);
    $.ajax({
        type: 'POST',
        url: '/forgotPassword/send',
        data: { data },
        success: function(res) {
            $('#send').prop("disabled", false);
            if (res == 'Ok') {
            	toastr.success('Если аккаунт существует, то письмо было выслано на почту');

                $('#data').val('');
                setTimeout(function() {
                    window.location.href = "/login";
                }, 3000);
            }else {
            	toastr.error(res);
            }
        }
    });
})
