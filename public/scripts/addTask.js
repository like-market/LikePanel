$(document).ready(function(){
    // Список комментариев
    $("#comments").select2();
})

toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};


// Используется ли клентский набор
let use_custom = false;

// При изменении количества лайков изменяем цену
$('#like_count').on('input', function() {
    if ($(this).val() > maxLikeCount) $(this).val(maxLikeCount)
    $(this).css('border', '')
    const new_cost = ($('#like_count').val() * likePrice + $('#comment_count').val() * commentPrice)

    $('#total_cost').html(`${(new_cost  / 1000).toFixed(2)}₽`)
    // Обводка цены
    if (new_cost > balance) $('#total_cost').css('background-color', 'red')
    else $('#total_cost').css('background-color', '#e9e599')
})
// При изменении количества комментов изменяем цену и выводим список
$('#comment_count').on('input', function() {
    if (use_custom) max_count = maxCustomCommentCount;
    else max_count = maxCommentCount;
    if ($(this).val() > max_count) $(this).val(max_count)

    $(this).css('border', '')
    const new_cost = ($('#like_count').val() * likePrice + $('#comment_count').val() * commentPrice)

    $('#total_cost').html(`${(new_cost  / 1000).toFixed(2)}₽`)
    // Обводка цены
    if (new_cost > balance) $('#total_cost').css('background-color', 'red')
    else $('#total_cost').css('background-color', '#e9e599')

    if ($('#comment_count').val()) {
        $('#comments_list').show(300)
    }else {
        $('#comments_list').hide(300)
    }
})

// При выборе нового набора комментариев
$('#comments').on('change', function() {
    use_custom = false; 

    if ($('#comments').val() != null) {
        for (let id of $('#comments').val()) {
            let custom = $(this).find(`[value="${id}"]`).attr('data-custom');
            if (custom == 'true') use_custom = true;
        }
    }

    let max_count;

    if (use_custom) {
        $('#custom_comment_info').show(300);
        max_count = maxCustomCommentCount;
    }else{
        $('#custom_comment_info').hide(300);
        max_count = maxCommentCount;
    }

    // Если не хватает баланса
    if (max_count < minCommentCount) {
        $('#comment_count').prop('min', 0)
        $('#comment_count').prop('max', 0)
        $('#comment_count').attr('placeholder', `[От ${minCommentCount}] Недостаточно средств`)
        $('#max_comment_count').text(0)
    }else {
        $('#comment_count').prop('min', minCommentCount)
        $('#comment_count').prop('max', max_count)
        $('#comment_count').attr('placeholder', `От ${minCommentCount} до ${max_count}`)
        $('#max_comment_count').text(max_count)
    }
    if ($('#comment_count').val() > max_count) $('#comment_count').val(max_count)
});

// Убираем красную обводку
$('#url, #url_comment, #task_name_like, #task_name_comment').change(function() {
    $(this).css('border', '')
})

// При клике на кнопку 'Создать задачу'
$('#create').click(function() {
    toastr.remove();
    let error = 0;

    // Проверка URL
    const url = $('#url').val()
    const regex = /(https?:\/\/)?vk.com\/.*/i;
    if (regex.exec(url) == null) {
        toastr.error('Неверный URL')
        $('#url').css('border', '1px solid red')
        error++
    }

    // Проверка лайков
    const like_count = $('#like_count').val();
    // Если поле like_count не пустое
    if (like_count != '' && like_count != 0) {
        // Если введено не число
        if (like_count != parseInt(like_count)) {
            toastr.error(`Укажите от ${minLikeCount} до ${maxLikeCount} лайков`)
            $('#like_count').css('border', '1px solid red')
            error++;
        // Если количество лайков лежит вне диапазона
        }else if (like_count > maxLikeCount || like_count < minLikeCount) {
            toastr.error(`Укажите от ${minLikeCount} до ${maxLikeCount} лайков`)
            $('#like_count').css('border', '1px solid red')
            error++;
        }
    }

    // Проверка комментариев
    const comment_count = $('#comment_count').val();
    const comments = $('#comments').val();
    // Если поле comment_count не пустое
    if (comment_count != '' && comment_count != 0) {
        // Различные лимиты для комментариев
        if (use_custom) max_comment_count = maxCustomCommentCount;
        else            max_comment_count = maxCommentCount;

        // Если введено не число
        if (comment_count != parseInt(comment_count)) {
            toastr.error(`Укажите от ${minCommentCount} до ${max_comment_count} комментариев`)
            $('#comment_count').css('border', '1px solid red')
            error++;
        }
        // Если количество комментариев лежит вне диапазона
        if (comment_count > max_comment_count || comment_count < minCommentCount) {
            toastr.error(`Укажите от ${minCommentCount} до ${max_comment_count} комментариев`)
            $('#comment_count').css('border', '1px solid red')
            error++;
        }

        // Проверка на то что выбран хотя бы один набор
        if (comments == null) {
            toastr.error('Выберите хотя бы один набор комментариев')
            error++;
        }
    }

    if ((like_count == '' || like_count == 0) && (comment_count == '' || comment_count == 0)) {
        toastr.error('Необходимо ввести количество лайков и/или комментариев')
        error++;
    }

    if (error) return;
    $('#create').addClass('disabled')

    $.ajax({
        type: 'POST',
        url: '/addtask/add',
        data: { url, like_count, comment_count, comments },
        success: function(res) {
            switch(res) {
                case 'Success':
                    toastr.success('Задание успешно добавлено')
                    $('#like_count').val('')        //
                    $('#comment_count').val('')     // Обновляем поля
                    $('#url').val('')               //
                    break;
                default:
                    toastr.error(res)
            }
            $('#create').removeClass('disabled')
        }
    });
})