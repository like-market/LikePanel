toastr.options = {
    debug: false,
    newestOnTop: false,
    positionClass: "toast-bottom-right",
    closeButton: true,
    progressBar: true
};

$("#username, #password").change(function() {
    $(this).css("border", "");
});

$("#loginForm").submit(function(e) {
    e.preventDefault(); // Отменяем отправку формы
    var error = 0;

    // Формат логина и пароля
    const format = /^[a-zA-Z0-9а-яА-Я]+$/;
    // формат почты
    const mail = /^[a-zA-Z0-9!$&*-=^|~#%+\/?_{}]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/

    var username = $("#username").val();
    // Если входим по логину
    if (format.test(username)) {
        // Проверка длины логина
        if (username.length < 5 || username.length > 20) {
            error++;
            $("#username").css("border", "1.5px solid red");
            toastr.error("Логин может содержать от 5 до 20 символов");
        }
    // Если входим по почте
    } else if (mail.test(username)) {
        if (username.length > 50) {
            error++;
            $("#username").css("border", "1.5px solid red");
            toastr.error("Почта может содержать до 50 символов");
        }
    // Если написан ни логин, ни почта
    } else {
        $("#username").css("border", "1.5px solid red");
        toastr.error("Неправильный логин или почта");
    }

    var password = $("#password").val();
    if (password.length < 6 || password.length > 30) {
        error++;
        $("#password").css("border", "1.5px solid red");
        toastr.error("Пароль может содержать от 6 до 30 символов");
    }

    if (error > 0) return;


    if (!format.test(password)) {
        error++;
        $("#password").css("border", "1.5px solid red");
        toastr.error("Пароль может содержать только буквы и цифры");
    }

    if (error > 0) return;
    $("button").prop("disabled", true);

    $.ajax({
        type: "POST",
        url: "/login",
        data: $(this).serialize(), // serializes the form's elements.
        success: function(res) {
            switch (res) {
                case "Success":
                    toastr.success("Авторизация прошла успешно");
                    setTimeout(function() {
                        window.location.href = "/tasks";
                    }, 500);
                    break;
                case "Unauthorized":
                    $("button").prop("disabled", false);
                    
                    if (format.test(username)) {
                        toastr.error("Логин или пароль введены неверно");
                    }else {
                        toastr.error("Почта или пароль введены неверно");
                    }
                    break;
                default:
                    $("button").prop("disabled", false);
                    toastr.error(res);
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
