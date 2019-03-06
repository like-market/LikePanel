$(document).ready(function(){
    $("#comments_ids").select2();
    $("#new_comments_ids").select2();
})

toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

$("#min_likes, #max_likes, #min_comments, #max_comments").change(function() {
    $(this).css("border", "");
});

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

/*function edit(group_id) {
    console.log('edit')
    $('#add-panel-body').fadeOut(250);
    $('#edit-panel-body').fadeIn(250);

    // $('#edit-panel').toggleClass('ld-loading');
    $('#new_name').val($(`#group_name_${group_id}`).html());
    $('#new_url').val($(`#group_${group_id}`).attr('data-url'))


    $('#new_min_likes').val( $(`#group_${group_id}`).attr('data-min_likes') );
    $('#new_max_likes').val( $(`#group_${group_id}`).attr('data-max_likes') );
    $('#new_min_comments').val( $(`#group_${group_id}`).attr('data-min_comments') );
    $('#new_max_comments').val( $(`#group_${group_id}`).attr('data-max_comments') );
}*/


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

                        $('#group_status_' + id).toggleClass('label-danger label-success')
                        $('#group_status_' + id).html('Включено')
                    }else {
                        $('#button_' + id).toggleClass('btn-danger btn-success')
                        $('#button_' + id).html('<i class="fa fa-pencil"></i> Включить ')
                        $('#button_' + id).attr('onclick', "updateStatus(" + id + ", 'enable')");

                        $('#group_status_' + id).toggleClass('label-success label-danger')
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

// Добавить новую группу
function add() {
    let error = 0;

    // Если неверное количество лайков
    if (parseInt($('#min_likes').val()) > parseInt($('#max_likes').val()) ||
        $('#min_likes').val() == "" || $('#max_likes').val() == "")
    {
        toastr.error('Неверное количество лайков');
        $("#min_likes").css("border", "1.5px solid red");
        $("#max_likes").css("border", "1.5px solid red");
        error++;
    }

    // Если неверное количество комментариев
    if (parseInt($('#min_comments').val()) > parseInt($('#max_comments').val())) {
        toastr.error('Неверное количество комментариев')
        $("#min_comments").css("border", "1.5px solid red");
        $("#max_comments").css("border", "1.5px solid red");
        error++;
    }

    let name = $('#name').val();
    if (name.length > 60) {
        $("#name").css("border", "1.5px solid red");
        toastr.error('Название может содержать до 60 символов');
        error++;
    }

    // Проверка ссылки на группу
    const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9]+)(\?.+)?/gm;
    let math = regex.exec($('#url').val())
    if (math == null) {
        $("#url").css("border", "1.5px solid red");
        toastr.error('Неверный URL')
        error++
    }

    if (error) return;

    $.ajax({
        type: 'POST',
        url: '/posthunter/add',
        data: {
            name: $('#name').val(),
            group_name: math[3],
            min_likes: $('#min_likes').val(),
            max_likes: $('#max_likes').val(),
            min_comments: $('#min_comments').val(),
            max_comments: $('#max_comments').val(),
            comments_ids: $('#comments_ids').val(),
        },
        success: function(res) {
            switch (res) {
                case 'Error group':
                    toastr.error('Группа не найдена');
                    break;
                case 'Already added':
                    toastr.error('Группа уже добавлена');
                    break;
                case 'Ok':
                    toastr.success('Успешно добавлено');
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

// Отменяем редактирование комментариев
/*$('#abort-edit').click(function(e) {
    $('#add-panel-body').fadeIn(250);
    $('#edit-panel-body').fadeOut(250);
})*/

// Подтверждаем редактирование комментариев
/*$('#apply-edit').click(function(e) {
    let error = 0;

    let name = $('#edit-comments-name').val();
    if (name == '' || name.length > 50) {
        toastr.error('Название должно содержать от 1 до 50 символов')
        $('#edit-comments-name').css('border', '1px solid red')
        error++;
    }

    let text = $('#edit-comments-text').val(); 
    if (text.split('\n').length < 50) {
        toastr.error('Нужно минимум 50 комментариев')
        $('#edit-comments-text').css('border', '1px solid red')
        error++
    }

    if (text.length > 50000) {
        toastr.error('Максимальная длина всех комментариев 50\'000 символов');
        $('#edit-comments-text').css('border', '1px solid red')
        error++;
    }

    if (error) return;

    var comment_id = $('#comments_id').val()

    $.ajax({
        type: "POST",
        url: '/comments/edit',
        data: JSON.stringify({
            id: comment_id,
            name: name,
            text: text
        }),
        contentType: 'application/json',
        success: function(res) {
            console.log(res);
            switch(res) {
                case 'Success':
                    $('#add-panel-body').fadeIn(250);
                    $('#edit-panel-body').fadeOut(250);
                    $('#edit-comments-name').val('');
                    $('#edit-comments-text').val('');
                    toastr.success('Набор изменен и скоро будет проверен')
                    break;
                default:
                    console.log(res);
            }
        }
    });
})*/