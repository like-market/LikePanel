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

function edit(id) {
    console.log('edit')
    $('#add-panel-body').fadeOut(250);
    $('#edit-panel-body').fadeIn(250);

    // $('#edit-panel').toggleClass('ld-loading');
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

                		$('#status_' + id).toggleClass('label-danger label-success')
                		$('#status_' + id).html('Включено')
                    }else {
                		$('#button_' + id).toggleClass('btn-danger btn-success')
                		$('#button_' + id).html('<i class="fa fa-pencil"></i> Включить ')
                		$('#button_' + id).attr('onclick', "updateStatus(" + id + ", 'enable')");

                		$('#status_' + id).toggleClass('label-success label-danger')
                		$('#status_' + id).html('Отключено')
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
    // Если неверное количество лайков
    if ($('#min_likes').val() > $('#max_likes').val() ||
        $('#min_likes').val() == "" || $('#max_likes').val() == "")
    {
        toastr.error('Неверное количество лайков')
        return
    }
    // Если неверное количество комментариев
    if ($('#min_comments').val() > $('#max_comments').val()) {
        toastr.error('Неверное количество комментариев')
        return
    }

    const regex = /(https?:\/\/)?(www\.)?vk\.com\/(.[a-zA-Z0-9]+)(\?.+)?/gm;
    let math = regex.exec($('#url').val())
    if (math == null) {
        toastr.error('Неверный URL')
        return
    }

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
                case 'Error likes':
                    toastr.error('Ошибка с лайками');
                    break;
                case 'Error comments':
                    toastr.error('Ошибка с комментарими');
                    break;
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
            }
        }
    })
}