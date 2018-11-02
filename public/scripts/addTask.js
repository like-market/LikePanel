toastr.options = {
    "debug": false,
    "newestOnTop": false,
    "positionClass": "toast-bottom-right",
    "closeButton": true,
    "progressBar": true
};

// При изменении выбора, куда ставить лайки
$('#select_type').change(function() {
    console.log('change');
})

// При изменении кол-ва лайков
$('#like_count').change(function() {
    $(this).css('border', '')
    var new_cost = ($(this).val() * price).toFixed(2)
    var text = "Стоимость <mark>" + new_cost + "₽</mark>"

    $('#total_cost').html(text)
})

$('#url').change(function() {
    $(this).css('border', '')
})

// При клике на 'создание задачи'
$('#create').click(function() {
    if ($('#like_count').val() == '') {
        toastr.error('Введите количество лайков')
        $('#like_count').css('border', '1px solid red')
        return;
    }

    var cost = ($('#like_count').val() * price).toFixed(2);
    console.log(cost, balance)
    if (cost > balance) {
        toastr.error('У вас не хватает средств')
        return;
    }

    var url = $('#url').val()

    //const regex = /(https?:\/\/)?vk.com\/(.*)\?w=wall([0-9-]*)_([0-9]*)(%2Fall)?(\?.*)?/gm;
    const regex = /(https?:\/\/)?vk.com\/(.*)(\?w=)?wall([0-9-]*_[0-9]*)(%2Fall)?(\?.*)?/gm;
    match = regex.exec(url)

    if (match == null) {
        toastr.error('Неверный URL записи на стене')
        $('#url').css('border', '1px solid red')
        return;
    }
    // post_id = match[4]
    // console.log(post_id)

    $.ajax({
        type: 'POST',
        url: 'http://127.0.0.1/addtask/add_task',
        data: JSON.stringify({
            name: $('#name').val(),
            url: url,
            like_count: $('#like_count').val(),
            type: $('#select_type').val()
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