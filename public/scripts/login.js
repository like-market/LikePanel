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

    var username = $("#username").val();
    if (username.length < 5 || username.length > 20) {
        error++;
        $("#username").css("border", "1.5px solid red");
        toastr.error("Неверный логин");
    }

    var password = $("#password").val();
    if (password.length < 5 || password.length > 30) {
        error++;
        $("#password").css("border", "1.5px solid red");
        toastr.error("Неверный пароль");
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
                    }, 2000);
                    break;
                case "Unauthorized":
                    toastr.error("Логин или пароль введены неверно");
                    $("button").prop("disabled", false);
                    break;
                default:
                    $("button").prop("disabled", false);
                    console.error("Untraceable error");
                    console.error(res);
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
