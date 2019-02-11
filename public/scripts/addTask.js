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
    console.log(cost, balance)
    if (cost > balance) {
        toastr.error('У вас не хватает средств')
        return;
    }

    var url = $('#url_like').val()

    //const regex = /(https?:\/\/)?vk.com\/(.*)\?w=wall([0-9-]*)_([0-9]*)(%2Fall)?(\?.*)?/gm;
    const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(url)

    if (match == null) {
        toastr.error('Неверный URL записи на стене')
        $('#url_like').css('border', '1px solid red')
        return;
    }
    // post_id = match[4]
    // console.log(post_id)

    $.ajax({
        type: 'POST',
        url: '/addtask/add_likes',
        data: JSON.stringify({
            name: $('#task_name_like').val(),
            url: url,
            count: $('#like_count').val()
        }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Post not found':
                    toastr.error('Запись не найдена')
                    break;
                case 'Success':
                    toastr.success('Задание успешно добавлено')
                    setTimeout(function() {
                        //window.location.href = "/panel";
                    }, 2000)
                    break;
                case 'Not enough money':
                    toastr.error('У вас не хватает средств')
                    break;
                case 'Error url':
                    toastr.error('Неверный URL записи на стене')
                    break;
                case 'Invalid amount likes':
                    toastr.error('Неверное количество лайков')
                    break;
                default:
                    toastr.error("ERROR: " + res);
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

    const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(url)

    if (match == null) {
        toastr.error('Неверный URL записи на стене')
        $('#url_comment').css('border', '1px solid red')
        return;
    }
    
    $.ajax({
        type: 'POST',
        url: '/addtask/add_comments',
        data: JSON.stringify({
            name: $('#task_name_comment').val(),
            url: url,
            count: $('#comment_count').val(),
            type: $('#comments').val()
        }),
        contentType: 'application/json',
        success: function(res) {
            console.log(res)
        }
    });
})