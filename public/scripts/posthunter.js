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