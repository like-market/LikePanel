toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

$('#new-comments-name, #new-comments-text').change(function() {
    console.log('change')
    $(this).css('border', '')
})

function addComments() {
    let error = 0;

    let name = $('#new-comments-name').val();
    if (name == '' || name.length > 50) {
        toastr.error('Название должно содержать от 1 до 50 символов');
        $('#new-comments-name').css('border', '1px solid red')
        error++;
    }

    let text = $('#new-comments-text').val(); 
    if (text.split('\n').length < 50) {
        toastr.error('Нужно минимум 50 комментариев')
        $('#new-comments-text').css('border', '1px solid red')
        error++;
    }

    if (text.length > 50000) {
        toastr.error('Максимальная длина всех комментариев 50\'000 символов');
        $('#new-comments-text').css('border', '1px solid red')
        error++;
    }

    if (error) return;

    $.ajax({
        type: "POST",
        url: '/comments/add',
        data: JSON.stringify({
            name: name,
            text: text
        }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Success':
                    toastr.success('Новый набор находится на модерации.', { fadeAway: 4000 });
                    toastr.success('Для ускорения модерации напишите менеджеру.', { fadeAway: 4000 });
                    $('#new-comments-name').val('')
                    $('#new-comments-text').val('')
                    break;
                default:
                    toastr.error(res)
            }
        }
    });
}

/**
 * При редактировании комментария скрываем окно 'Добавить новый комментарий'
 * и выводим окно 'Редактировать комментарий' с лоадером
 * Дальше отправляем ajax запрос для получения данных о наборе
 */
function editComments(comment_id, owner_id) {
    if (owner_id == 0) {
        toastr.error('Невозможно редактировать общий комментарий');
        return;
    } 

    $('#add-panel-body').fadeOut(250);
    $('#edit-panel-body').fadeIn(250);

    $('#edit-panel').toggleClass('ld-loading');

    $.ajax({
        type: "POST",
        url: '/comments/get',
        data: JSON.stringify({
            id: comment_id
        }),
        contentType: 'application/json',
        success: function(res) {
            switch(res) {
                case 'Unauthorized':
                case 'Access error':
                    toastr.error('Access error')
                    break;
                // В случае успеха возаращается json-encoded строка
                default:
                    var comments = JSON.parse(res)
                    $('#edit-comments-name').val(comments.name)
                    $('#edit-comments-text').val(comments.text)
                    $('#comments_id').val(comments.id)

                    // Удаляем лоадер
                    $('#edit-panel').toggleClass('ld-loading');
            }
        }
    });
}


// Отменяем редактирование комментариев
$('#abort-edit').click(function(e) {
    $('#add-panel-body').fadeIn(250);
    $('#edit-panel-body').fadeOut(250);
    $('#edit-comments-name').val('')
    $('#edit-comments-text').val('')
})

// Подтверждаем редактирование комментариев
$('#apply-edit').click(function(e) {
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
                    toastr.success('Ваш набор находится на модерации.<br/>Для ее ускорения напишите менеджеру или в чат.')
                    break;
                default:
                    console.log(res);
            }
        }
    });
})

function deleteComments(comment_id, owner_id) {
    if (owner_id == 0) {
        toastr.error('Невозможно удалить общий комментарий');
        return;
    }
    $.ajax({
        type: "POST",
        url: '/comments/delete',
        data: JSON.stringify({
            id: comment_id
        }),
        contentType: 'application/json',
        success: function(res) {
            console.log(res);
            switch(res) {
                case 'Success':
                    toastr.success('Набор удален')
                    break;
                default:
                    console.log(res);
            }
        }
    });
}