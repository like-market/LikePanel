toastr.options = {
    debug: false,
    newestOnTop: false,
    positionClass: "toast-bottom-right",
    closeButton: true,
    progressBar: true
};

$("#username, #password, #repeatpassword, #email").change(function() {
    $(this).css("border", "");
});

$("#loginForm").submit(function(e) {
    e.preventDefault(); // Отменяем отправку формы
    var error = 0;

    let username = $("#username").val();
    if (username.length < 5 || username.length > 20) {
        error++;
        $("#username").css("border", "1.5px solid red");
        toastr.error("Логин может содержать от 5 до 20 символов");
    }

    let email = $('#email').val();
    let format = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/
    if (!format.test(email)) {
        error++;
        $("#email").css("border", "1.5px solid red");
        toastr.error("Почтовый адрес не валидный");
    }

    if (email.length > 50) {
        error++;
        $("#email").css("border", "1.5px solid red");
        toastr.error("Слишком длинная почта");
    }

    let password = $("#password").val();
    if (password.length < 5 || password.length > 30) {
        error++;
        $("#password").css("border", "1.5px solid red");
        toastr.error("Пароль может содержать от 6 до 30 символов");
    }

    if (error > 0) return;
    format = /^[a-zA-Z0-9а-яА-Я]+$/;
    if (!format.test(username)) {
        error++;
        $("#username").css("border", "1.5px solid red");
        toastr.error("Логин может содержать только буквы и цифры");
    }

    if (!format.test(password)) {
        error++;
        $("#password").css("border", "1.5px solid red");
        toastr.error("Пароль может содержать только буквы и цифры");
    }

    var repeatpassword = $("#repeatpassword").val();
    if (repeatpassword != password) {
        error++;
        $("#repeatpassword").css("border", "1.5px solid red");
        toastr.error("Пароли не совпадают");
    }

    if (error > 0) return;
    $("button").prop("disabled", true);

    $.ajax({
        type: "POST",
        url: "/register",
        data: $(this).serialize(), // serializes the form's elements.
        success: function(res) {
            switch (res) {
                case "Success":
                    toastr.success("Авторизация прошла успешно");
                    setTimeout(function() {
                        window.location.href = "/tasks";
                    }, 500);
                    break;
                case "User already exist":
                    toastr.error("Логин уже зарегистрирован");
                    $("#username").css("border", "1.5px solid red");
                    $("button").prop("disabled", false);
                    break;
                default:
                    $("button").prop("disabled", false);
                    toastr.error(res)
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status == 503) {
                toastr.error("Слишком много запросов<br/>Попробуйте позже");
                $("button").prop("disabled", false);
            }
        }
    });
});
