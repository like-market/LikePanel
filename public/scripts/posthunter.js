$(document).ready(function(){
    $("#comments").select2();

    var findAllPostButton    = new Switchery( document.querySelector('#findAllPostButton') );
    var adsWithoutMarkButton = new Switchery( document.querySelector('#adsWithoutMarkButton') );
    var adsWithMarkButton    = new Switchery( document.querySelector('#adsWithMarkButton') );
    var onlyContentButton    = new Switchery( document.querySelector('#onlyContentButton') );

    // Кнопка 'Находить все посты'
    document.querySelector('#findAllPostButton').onchange = function() {
        if (!this.checked) {
            $('#post-options-area').show(300);
        }else {
            $('#post-options-area').hide(300);
        }
    }

    // Кнопка 'искать вхождение'
    var findEntryButton = document.querySelector('#findEntryButton');
    var findEntryButton = new Switchery( findEntryButton );

    document.querySelector('#findEntryButton').onchange = function() {
        if (this.checked) {
            $('#entry-area').show(300);
        }else {
            $('#entry-area').hide(300);
            $('#entry-text').val('');
        }
    };

    // Кнопка 'остановить после нахождения поста'
    var autoStopButton = document.querySelector('#autoStopButton');
    var autoStopButton = new Switchery( autoStopButton );

})

toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

// Убираем красную обводку
$('#min_likes, #max_likes').change(function() {
    $('#min_likes, #max_likes').css("border", "");
})
$('#min_comments, #max_comments').change(function() {
    $('#min_comments, #max_comments').css("border", "");
})
$('#time_from, #time_to').change(function() {
    $('#time_to, #time_from').css("border", "");
})
$("#name, #url, #entry-text").change(function() {
    $(this).css("border", "");
});

// При выборе нового набора комментариев
$('#comments').on('change', function() {
console.log('true')
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

    $('#max_comments').prop('max', max_count)
    $('#max_comments').attr('placeholder', `Максимум ${max_count}`)
});

/**
 * Удаляем запись в постхантере
 * @param group_id - ID записи
 */
function del(group_id) {
    $.ajax({
        type: 'POST',
        url: '/posthunter/delete',
        data: { group_id },
        success: function(res) {
            switch (res) {
                case 'Ok':
                    toastr.success('Удаление прошло успешно');
                    setTimeout(function() {
                        window.location.href = "/posthunter";
                    }, 500);
                    break;
                default:
                    toastr.error(res);
            }
        }
    })
}


// Включаем/выключаем постхантер
function updateStatus(id, status) {
    $.ajax({
        type: 'POST',
        url: '/posthunter/update_status',
        data: JSON.stringify({ id, status }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Success':
                    if (status == 'enable') {
                        $('#button_' + id).toggleClass('btn-success btn-danger')
                        $('#button_' + id).html('<i class="fa fa-pencil"></i> Отключить ')
                        $('#button_' + id).attr('onclick', "updateStatus(" + id + ", 'disable')");

                        $('#group_status_' + id).removeClass('label-danger label-info')
                        $('#group_status_' + id).addClass('label-success');
                        $('#group_status_' + id).html('Включено')
                    }else {
                        $('#button_' + id).toggleClass('btn-danger btn-success')
                        $('#button_' + id).html('<i class="fa fa-pencil"></i> Включить ')
                        $('#button_' + id).attr('onclick', "updateStatus(" + id + ", 'enable')");

                        $('#group_status_' + id).removeClass('label-success label-info')
                        $('#group_status_' + id).addClass('label-danger');
                        $('#group_status_' + id).html('Отключено')
                    }
                    toastr.success('Статус обновлен')
                    break;
                default:
                    toastr.error("ERROR: " + res);
            }
        }
    });
}

function checkFieldsCorrect() {
    toastr.remove();
    let error = 0;

    // Проверка названия
    const name = $('#name').val();
    if (name.length > 60) {
        $("#name").css("border", "1.5px solid red");
        toastr.error('Название может содержать максимум 60 символов')
        error++;
    }

    // Проверка ссылки
    const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9_.]+)(\?.+)?/gm;
    const url = $('#url').val()
    if (regex.exec(url) == null) {
        $("#url").css("border", "1.5px solid red");
        toastr.error('Неверный URL')
        error++
    }

    const min_likes = $('#min_likes').val();
    const max_likes = $('#max_likes').val();
    // Если где-то введена цифра
    if (min_likes || max_likes) {
        if (!min_likes) {
            $("#min_likes").css("border", "1.5px solid red");
            toastr.error('Введите минимальное количество лайков')
            error++;
        }
        if (!max_likes) {
            $("#max_likes").css("border", "1.5px solid red");
            toastr.error('Введите максимальное количество лайков')
            error++;
        }
        if ((min_likes && max_likes) && parseInt(min_likes) > parseInt(max_likes)) {
            $("#min_likes, #max_likes").css("border", "1.5px solid red");
            toastr.error('Неверный диапазон лайков')
            error++;
        }
    }

    const min_comments = $('#min_comments').val();
    const max_comments = $('#max_comments').val();
    const comments = $('#comments').val();
    // Если где-то введена цифра
    if (min_comments || max_comments) {
        if (!min_comments) {
            $("#min_comments").css("border", "1.5px solid red");
            toastr.error('Введите минимальное количество комментариев')
            error++;
        }
        if (!max_comments) {
            $("#max_comments").css("border", "1.5px solid red");
            toastr.error('Введите максимальное количество комментариев')
            error++;
        }
        if ((min_comments && max_comments) && parseInt(min_comments) > parseInt(max_comments)) {
            $("#min_comments, #max_comments").css("border", "1.5px solid red");
            toastr.error('Неверный диапазон комментариев')
            error++;
        }
        // Проверка на то что выбран хотя бы один набор
        if (comments == null) {
            toastr.error('Выберите хотя бы один набор комментариев')
            error++;
        }
    }

    // Поиск вхождения
    const findentry = document.querySelector('#findEntryButton').checked;
    const entry_text = $('#entry-text').val();
    if (findentry) {
        if (entry_text.length <= 0) {
            toastr.error('Введите текст для поиска');
            $("#entry-text").css("border", "1.5px solid red");
            error++;
        }
        if (entry_text.length > 500) {
            toastr.error('Максимальная длина фраз для поиска - 500 символов');
            $("#entry-text").css("border", "1.5px solid red");
            error++;
        }
    }

    if (error) return false;

    if (!min_comments && !min_likes && !max_comments && !max_likes) {
        return toastr.error('Введите количество лайков и/или комментариев для накрутки')
    }

    const time_from = $('#time_from').val();
    const time_to = $('#time_to').val();
    const time_reg = /^[0-2]\d:[0-6]\d$/
    if (!time_reg.test(time_from) || !time_reg.test(time_to)) {
        toastr.error('Введите время в формате HH:mm')
        return false;
    }
    if (time_from > time_to) {
        toastr.error('Неверный диапазон времени');
        return false;
    }

    return true;
}

// При клике на кнопку 'Добавить'
$('#add').click(function() {
    if (!checkFieldsCorrect()) return;

    let like_ads     = +$('#adsWithMarkButton')[0].checked
    let like_repost  = +$('#adsWithoutMarkButton')[0].checked
    let like_content = +$('#onlyContentButton')[0].checked

    if ($('#findAllPostButton')[0].checked) {
        like_ads = like_repost = like_content = 1;
    }

    $('#add').addClass('disabled')
    
    $.ajax({
        type: 'POST',
        url: '/posthunter/add',
        data: { 
            name: $('#name').val(), 
            url: $('#url').val(),
            min_likes: $('#min_likes').val(),
            max_likes: $('#max_likes').val(),
            min_comments: $('#min_comments').val(),
            max_comments: $('#max_comments').val(),
            comments: $('#comments').val(),
            entry_text: $('#entry-text').val(),
            autostop: +document.querySelector('#autoStopButton').checked,
            like_ads,
            like_repost,
            like_content,
            time_from: $('#time_from').val(),
            time_to: $('#time_to').val()
        },
        success: function(res) {
            switch (res) {

                case 'Success':
                    toastr.success('Успешно добавлено');
                    setTimeout(function() {
                        window.location.href = "/posthunter";
                    }, 500);
                    break;
                default:
                    toastr.error(res);
            }
            $('#add').removeClass('disabled')
        }
    })
})

/**
 * Изменяем постхантер
 * Для этого получаем данные о нем и заменям их в панеле добавления
 *
 * @param group_id - ID записи
 */
function edit(group_id) {
    $('#panel').addClass('ld-loading');

    $.ajax({
        type: 'GET',
        url: '/posthunter/id',
        data: { id: group_id },
        success: function(res) {
            $('#panel').removeClass('ld-loading');
            
            // Если получена какая-то фигня
            if (!res.id) {
                toastr.error(res);
                return;
            }
            $('#panel-name').html('Изменить группу')

            $('#name').val(res.name)
            $('#url').val(res.url)
            $('#min_likes').val(res.min_likes)
            $('#max_likes').val(res.max_likes)
            $('#min_comments').val(res.min_comments)
            $('#max_comments').val(res.max_comments)
            $('#time_from').val(res.time_from);
            $('#time_to').val(res.time_to);

            // Установка свитчеров
            setSwitcherStatus('findEntryButton', res.entry_text ? true : false);
            setSwitcherStatus('autoStopButton',  res.autostop   ? true : false);
            setSwitcherStatus('adsWithMarkButton',     res.like_ads     ? true : false);
            setSwitcherStatus('adsWithoutMarkButton',  res.like_repost  ? true : false);
            setSwitcherStatus('onlyContentButton',     res.like_content ? true : false);
            
            $('#entry-text').val(res.entry_text);

            for (let comment_id of res.comments_ids.split(',')) {
                console.log(comment_id)
                $(`#comments option[value=${comment_id}]`).attr('selected','selected');
                $(`#comments option[value=${comment_id}]`).change();
            }

            $('#buttons').html(
                `<a id='cancel' class="btn btn-w-md btn-accent" onclick="cancel(${group_id})">Отмена</a>\
                 <a id='change' class="btn btn-w-md btn-success" onclick="change(${group_id})">Изменить</a>`
            )
        }
    })
}

/**
 * Отменяем редактирование
 */
function cancel(group_id) {
    $('#panel-name').html('Добавить группу')

    $('#name').val('')
    $('#url').val('')
    $('#min_likes').val('')
    $('#max_likes').val('')
    $('#min_comments').val('')
    $('#max_comments').val('')
    $('#entry-text').val('');
    $('#time_from').val('00:00');
    $('#time_to').val('23:59');

    setSwitcherStatus('findEntryButton', false);
    setSwitcherStatus('autoStopButton',  false);
    setSwitcherStatus('adsWithMarkButton',     false);
    setSwitcherStatus('adsWithoutMarkButton',  false);
    setSwitcherStatus('onlyContentButton',     false);

    $('#buttons').html('<a id="add" class="btn btn-w-md btn-success pull-right">Добавить</a>')
}

/**
 * Отправляем данные для изменения существующей записи
 */
function change(group_id) {
    if (!checkFieldsCorrect()) return;


    let like_ads     = +($('#adsWithMarkButton')[0].checked)
    let like_repost  = +($('#adsWithoutMarkButton')[0].checked)
    let like_content = +($('#onlyContentButton')[0].checked)

    if ($('#findAllPostButton')[0].checked) {
        like_ads = like_repost = like_content = 1;
    }

    $('#change').addClass('disabled')
    $('#cancel').addClass('disabled')

    $.ajax({
        type: 'POST',
        url: '/posthunter/change',
        data: {
            id: group_id,
            name: $('#name').val(), 
            url: $('#url').val(),
            min_likes: $('#min_likes').val(),
            max_likes: $('#max_likes').val(),
            min_comments: $('#min_comments').val(),
            max_comments: $('#max_comments').val(),
            comments: $('#comments').val(),
            entry_text: $('#entry-text').val(),
            autostop: +($('#autoStopButton')[0].checked),
            like_ads,
            like_repost,
            like_content,
            time_from: $('#time_from').val(),
            time_to: $('#time_to').val()
        },
        success: function(res) {
            switch (res) {

                case 'Success':
                    toastr.success('Успешно изменено');
                    setTimeout(function() {
                       window.location.href = "/posthunter";
                    }, 500);
                    break;
                default:
                    toastr.error(res);
            }
            $('#change').removeClass('disabled')
            $('#cancel').removeClass('disabled')
        }
    })
}

/**
 * Устанавливаем статус свитчеру
 */
function setSwitcherStatus(id, checked) {
    let switcher = document.querySelector(`#${id}`)
    switcher.checked = checked;
    
    let event = document.createEvent('HTMLEvents');
    event.initEvent('change', true, true);
    switcher.dispatchEvent(event);
}