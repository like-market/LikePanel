toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

$('#username, #accounts, #money-count').change(function() {
    $(this).css('border', '')
})

// При добавлении аккаунта
$("#add-account").click(function() {
    console.log('test')
    var accounts = $('#accounts').val()
    if (accounts.length == 0) {
        toastr.error('Заполните поле с аккаунтами')
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/admin/add_account',
        data: JSON.stringify({
            accounts: accounts
        }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Success':
                    toastr.success('Аккаунты добавлены')
                    $('#accounts').val('')
                    break;
                default:
                    toastr.error("ERROR: " + res);
            }
        }
    });
})

// При изменении баланса
$('#change-balance').click(function() {
    var username = $('#username').val()
    if (username.length == 0) {
        $('#username').css('border', '1.5px solid red')
        toastr.error('Введите логин')
        return;
    }

    var count = $('#money-count').val()
    if (count.length == 0) {
        $('#money-count').css('border', '1.5px solid red')
        toastr.error('Введите количество денег')
        return;
    }
    count = parseFloat(count) * 100;

    var type = $('#operation-type').val()

     $.ajax({
        type: 'POST',
        url: '/admin/change_balance',
        data: { username, count, type },
        success: function(res) {
            switch(res) {
                case 'Success':
                    toastr.success('Баланс обновлен')
                    $('#username').val('')
                    $('#money-count').val('')
                    break;
                default:
                    toastr.error("ERROR: " + res);
            }
        }
    });
})

/********
 ********
 * Дальше идет работа с комментариями пользователей
 * Функции next(), accept(), reject()
 ********
 ********/
function clear() {
    $('#comments-count').text('')
    $('#comments-text').val('')
    $('#comments-date').text('')
}

function next() {
    var offset = $('#comments-id').text();

    clear();

    $.ajax({
        type: 'POST',
        url: '/comments/getnext',
        data: JSON.stringify({
            offset: offset
        }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Does not exist':
                    toastr.error("Нет непроверенных комментариев");
                    break;
                default:
                    var comments = JSON.parse(res)
                    console.log(comments)
                    $('#comments-id').text(comments.id);
                    $('#comments-count').text(comments.count)
                    $('#comments-text').val(comments.text)
                    $('#comments-date').text(comments.create)
            }
        }
    });
}

/**
 * @param status - 'accept' or 'reject'
 */
function setStatus(status) {
    var id = $('#comments-id').text();

    $.ajax({
        type: 'POST',
        url: '/comments/setstatus',
        data: JSON.stringify({
            id: id,
            status: status
        }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Success':
                    if (status == 'accept') toastr.success("Комментарий подтвержден");
                    if (status == 'reject') toastr.success("Комментарий откнонен");        
                    clear();
                    break;
                default:
                    console.error('Untraceable error')
                    console.error(res);
            }
        }
    });
}