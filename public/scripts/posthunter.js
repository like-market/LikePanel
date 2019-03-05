$(document).ready(function(){
    $("#comments_ids").select2();
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

function edit(group_id) {
    console.log('edit')
    $('#add-panel-body').fadeOut(250);
    $('#edit-panel-body').fadeIn(250);

    // $('#edit-panel').toggleClass('ld-loading');
    $('#new_name').val($('#group_name_' + group_id).html());
    $('#new_url').val()
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
    if ($('#min_likes').val() > $('#max_likes').val() ||
        $('#min_likes').val() == "" || $('#max_likes').val() == "")
    {
        toastr.error('Неверное количество лайков');
        $("#min_likes").css("border", "1.5px solid red");
        $("#max_likes").css("border", "1.5px solid red");
        error++;
    }

    // Если неверное количество комментариев
    if ($('#min_comments').val() > $('#max_comments').val()) {
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
                default:
                    toastr.error(res);
            }
        }
    })
}