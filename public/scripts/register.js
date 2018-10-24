toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

$('#username, #password, #repeatpassword').change(function() {
    $(this).css('border', '')
})

$("#loginForm").submit(function(e) {
    e.preventDefault(); // Отменяем отправку формы
    var error = 0;

    var username = $('#username').val()
    if (username.length < 5 || username.length > 20) {
        error++
        $('#username').css('border', '1.5px solid red')
        toastr.error('Логин должен быть от 5 до 20 символов')
    }

    // var email = $('#email').val()

    var password = $('#password').val()
    if (password.length < 5 || password.length > 30) {
        error++
        $('#password').css('border', '1.5px solid red')
        toastr.error('Пароль должен быть от 5 до 30 символов')
    }


    var repeatpassword = $('#repeatpassword').val()
    if (repeatpassword != password) {
        error++
        $('#repeatpassword').css('border', '1.5px solid red')
        // Не выводим это сообщение, если первый пароль некорректен
        if (error != 2) toastr.error('Пароли не совпадают')
    }

    if (error > 0) return;
    $('button').prop('disabled', true);

    $.ajax({
        type: "POST",
        url: '/register',
        data: $(this).serialize(), // serializes the form's elements.
        success: function(res) {
            switch(res) {
                case 'Success':
                    toastr.success('Авторизация прошла успешно')
                    setTimeout(function() {
                        window.location.href = "/panel";
                    }, 2000)
                    break;
                case 'User already exist':
                    toastr.error('Логин уже зарегистрирован')
                    $('#username').css('border', '1.5px solid red')
                    $('button').prop('disabled', false);
                    break;
                default:
                    $('button').prop('disabled', false);
                    console.error('Untraceable error')
                    console.error(res);
            }
        }
    });
});