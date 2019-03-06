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

// При клике на вкладку 'Лайки'
$("a[href='#like']").on('shown.bs.tab', function(e) {
    const code = "<p>1. Введите url на запись на стене, фотографию, видео или товар<br/>Например <code>https://vk.com/wall266510818_2435</code><br/>или <code>https://vk.com/id266510818?w=wall266510818_2435</code></p><p>2. Введите количество лайков для накрутки</p><p>3. Нажмите на кнопку 'Создать задачу'</p>"
    $('#info').html(code)
});

// При клике на вкладку 'Комментарии'
$("a[href='#comment']").on('shown.bs.tab', function(e) {
    const code = "<p>1. Введите url на запись на стене, фотографию, видео или товар<br/>Например <code>https://vk.com/wall266510818_2435</code><br/>или <code>https://vk.com/id266510818?w=wall266510818_2435</code></p><p>2. Выберите набор комментариев, который будет накручиваться<br/>(Можно добавить свой набор в разделе - Комментарии)</p><p>3. Введите количество комментариев </p><p>4. Нажмите на кнопку 'Создать задачу'</p>"
    $('#info').html(code)
});


// При изменении количества лайков изменяем цену
$('#like_count').change(function() {
    $(this).css('border', '')
    var new_cost = ($(this).val() * likePrice / 1000).toFixed(2)

    $('#total_cost').html(`Стоимость <mark>${new_cost}₽</mark>`)
})

// При изменении количества комментариев изменяем цену
$('#comment_count').change(function() {
    $(this).css('border', '')

    const new_cost = ($(this).val() * commentPrice / 1000).toFixed(2)
    $('#total_comment_cost').html(`Стоимость <mark>${new_cost}₽</mark>`)
})

$('#url_like, #url_comment, #task_name_like, #task_name_comment').change(function() {
    $(this).css('border', '')
})

// При клике на кнопку 'накрутить лайки'
let canUseLikeButton = true;
$('#createLikes').click(function() {
    if (!canUseLikeButton) return;

    let error = 0;

    // Проверка на количество комментариев
    if ($('#like_count').val() == '' || parseInt($('#like_count').val()) != $('#like_count').val()) {
        toastr.error('Введите количество лайков')
        $('#like_count').css('border', '1px solid red')
        error++;
    }else {
        if ($('#like_count').val() > maxLikeCount) {
            toastr.error(`Вы можете заказать максимум ${maxLikeCount} лайков`);
            $('#like_count').css('border', '1px solid red')
            error++;
        }
        if ($('#like_count').val() < minLikeCount) {
            toastr.error(`Вы можете заказать минимум ${minLikeCount} лайков`);
            $('#like_count').css('border', '1px solid red')
            error++;
        }
    }

    // Проверка URL
    var url = $('#url_like').val()
    const regex = /(https?:\/\/)?vk.com\/.*/i;
    if (regex.exec(url) == null) {
        toastr.error('Неверный URL')
        $('#url_like').css('border', '1px solid red')
        error++
    }

    // Проверка названия
    let name = $('#task_name_like').val()
    if (name.length > 75) {
        toastr.error('Название может быть не длиннее 75 символов')
        $('#task_name_like').css('border', '1px solid red')
        error++;
    }

    if (error) return;
    canUseLikeButton = false;
    
    $.ajax({
        type: 'POST',
        url: '/addtask/add_likes',
        data: {
            name,
            url,
            count: $('#like_count').val()
        },
        success: function(res) {
            switch(res) {
                case 'Error url':
                    toastr.error('Неверный URL')
                    $('#url_like').css('border', '1px solid red')
                    break;
                case 'Invalid amount likes':
                    toastr.error(`Неверное количество лайков<br/>Можно заказать от ${minLikeCount} до ${maxLikeCount}`)
                    $('#like_count').css('border', '1px solid red')
                    break;
                case 'Access restriction':
                    toastr.error('Запись не найдена или не хватает прав для добавления лайка')
                    break;
                case 'Success':
                    toastr.success('Задание успешно добавлено')
                    $('#task_name_like').val('') //
                    $('#like_count').val('')     // Обновляем поля
                    $('#url_like').val('')       //
                    break;
            }
            canUseLikeButton = true;
        }
    });
})


let canUseCommentButton = true;
// При клике на кнопку 'накрутить комменты'
$('#createComments').click(function() {
    if (!canUseCommentButton) return;

    let error = 0;
    $("#createComments").prop("disabled", true);

    // Проверка количества комментариев
    if ($('#comment_count').val() == '' ||  parseInt($('#comment_count').val()) != $('#comment_count').val()) {
        toastr.error('Введите количество комментариев')
        $('#comment_count').css('border', '1px solid red')
        error++;
    }else {
        if ($('#comment_count').val() > maxCommentCount) {
            toastr.error(`Вы можете заказать максимум ${maxCommentCount} комментариев`);
            $('#comment_count').css('border', '1px solid red')
            error++;
        }
        if ($('#comment_count').val() < minCommentCount) {
            toastr.error(`Вы можете заказать минимум ${minCommentCount} комментариев`);
            $('#comment_count').css('border', '1px solid red')
            error++;            
        }
    }

    // Проверка на выбранный набор комментариев
    if ($('#comments').val() == null) {
        toastr.error('Выберите хотя бы один набор')
        $('#comments').css('border', '1px solid red')
        error++;
    }

    // Проверка на url
    var url = $('#url_comment').val()
    const regex = /(https?:\/\/)?vk.com\/.*/i;
    if (regex.exec(url) == null) {
        toastr.error('Неверный URL')
        $('#url_comment').css('border', '1px solid red')
        error++;
    }

    // Проверка названия
    let name = $('#task_name_comment').val()
    if (name.length > 75) {
        toastr.error('Название может быть не длиннее 75 символов')
        $('#task_name_like').css('border', '1px solid red')
        error++;
    }

    if (error) return;
    canUseCommentButton = false;
    
    $.ajax({
        type: 'POST',
        url: '/addtask/add_comments',
        data: {
            name,
            url,
            count: $('#comment_count').val(),
            comment_ids: $('#comments').val()
        },
        success: function(res) {
            switch(res) {
                case 'Error url':
                    toastr.error('Неверный URL')
                    $('#url_comment').css('border', '1px solid red')
                    break;
                case 'Invalid amount comments':
                    toastr.error(`Неверное количество комментариев<br/>Можно заказать от ${minCommentCount} до ${maxCommentCount}`)
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
            canUseCommentButton = true;
        }
    });
})