$(document).ready(function(){
    $("#comments").select2();
})

toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

// При изменении кол-ва лайков
$('#like_count').change(function() {
    $(this).css('border', '')
    var new_cost = ($(this).val() * likePrice).toFixed(2)
    var text = "Стоимость <mark>" + new_cost + "₽</mark>"

    $('#total_like_cost').html(text)
})

// При изменении кол-ва лайков
$('#comment_count').change(function() {
    $(this).css('border', '')
    var new_cost = ($(this).val() * commentPrice).toFixed(2)
    var text = "Стоимость <mark>" + new_cost + "₽</mark>"

    $('#total_comment_cost').html(text)
})

$('#url_like, #url_comment').change(function() {
    $(this).css('border', '')
})

// При клике на кнопку 'накрутить лайки'
$('#createLikes').click(function() {
    if ($('#like_count').val() == '') {
        toastr.error('Введите количество лайков')
        $('#like_count').css('border', '1px solid red')
        return;
    }

    var cost = ($('#like_count').val() * likePrice).toFixed(2);
    if (cost > balance) {
        toastr.error('У вас не хватает средств')
        return;
    }

    var url = $('#url_like').val()

    const regex = /(https?:\/\/)?vk.com\/.*/i;
    match = regex.exec(url)

    if (match == null) {
        toastr.error('Неверный URL')
        $('#url_like').css('border', '1px solid red')
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/addtask/add_likes',
        data: {
            name: $('#task_name_like').val(),
            url: url,
            count: $('#like_count').val()
        },
        success: function(res) {
            switch(res) {
                case 'Error url':
                    toastr.error('Неверный URL')
                    break;
                case 'Invalid amount likes':
                    toastr.error('Неверное количество лайков')
                    break;
                case 'Not enough money':
                    toastr.error('У вас не хватает средств')
                    break;
                case 'Access restriction':
                    toastr.error('Запись не найдена или не хватает прав')
                    break;
                case 'Success':
                    toastr.success('Задание успешно добавлено')
                    $('#task_name_like').val('') //
                    $('#like_count').val('')     // Обновляем поля
                    $('#url_like').val('')       //
                    break;
                default:
                    toastr.error(res);
            }
        }
    });
})


// При клике на кнопку 'накрутить комменты'
$('#createComments').click(function() {
    if ($('#comment_count').val() == '') {
        toastr.error('Введите количество комментариев')
        $('#comment_count').css('border', '1px solid red')
        return;
    }
    if ($('#comments').val() == null) {
        toastr.error('Выберите хотя бы один набор')
        $('#comments').css('border', '1px solid red')
        return;
    }

    var cost = ($('#comment_count').val() * commentPrice).toFixed(2);
    console.log(cost, balance)
    if (cost > balance) {
        toastr.error('У вас не хватает средств')
        return;
    }

    var url = $('#url_comment').val()

    const regex = /(https?:\/\/)?vk.com\/.*/i;
    match = regex.exec(url)

    if (match == null) {
        toastr.error('Неверный URL')
        $('#url_like').css('border', '1px solid red')
        return;
    }
    
    $.ajax({
        type: 'POST',
        url: '/addtask/add_comments',
        data: {
            name: $('#task_name_comment').val(),
            url: url,
            count: $('#comment_count').val(),
            comment_ids: $('#comments').val()
        },
        success: function(res) {
            switch(res) {
                case 'Error url':
                    toastr.error('Неверный URL')
                    break;
                case 'Invalid amount likes':
                    toastr.error('Неверное количество лайков')
                    break;
                case 'Not enough money':
                    toastr.error('У вас не хватает средств')
                    break;
                case 'Access restriction':
                    toastr.error('Запись не найдена или не хватает прав')
                    break;
                case 'Success':
                    toastr.success('Задание успешно добавлено')
                    $('#task_name_comment').val('') //
                    $('#comment_count').val('')     // Обновляем поля
                    $('#url_comment').val('')       //
                    break;
                default:
                    toastr.error(res);
            }
        }
    });
})