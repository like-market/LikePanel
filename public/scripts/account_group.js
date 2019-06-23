toastr.options = {
    'debug': false,
    'newestOnTop': false,
    'positionClass': 'toast-bottom-right',
    'closeButton': true,
    'progressBar': true
};

const createGroup = function(count) {
    $.ajax({
        type: 'POST',
        url: '/account_group/create_group',
        data: { count },
        success: function(res) {
            if (res.status == 'success') {
                toastr.success('Группа создана');
                setTimeout(function() {
                    window.location.href = "/account_group";
                }, 1000);
            }
            if (res.status == 'error') {
                toastr.error(res.msg);
            }
        }
    });
};

const removeGroup = function(group_id) {
    if (group_id == 0 || group_id == 10) {
        return toastr.error('Невозможно удалить эту группу');
    }
    $.ajax({
        type: 'POST',
        url: '/account_group/remove_group',
        data: { group_id },
        success: function(res) {
            toastr.success('Группа удалена');
            setTimeout(function() {
                window.location.href = "/account_group";
            }, 1000);
        }
    });
};

const addAccountsToLikeGroup = function() {
    const account_count = parseInt( $('#account_count').val() );

    if (account_count == 0) {
        toastr.error('Введите количество аккаунтов');
        return;
    }
    $.ajax({
        type: 'POST',
        url: '/account_group/add_account_to_like_group',
        data: { account_count },
        success: function(res) {
            if (res.status == 'success') {
                toastr.success('Аккаунты добавлены');
                setTimeout(function() {
                    window.location.href = "/account_group";
                }, 1000);
            }
            if (res.status == 'error') {
                toastr.error(res.msg);
            }
        }
    });
};

const removeAccountsFromLikeGroup = function() {
    const account_count = parseInt( $('#account_count').val() );

    if (account_count == 0) {
        toastr.error('Введите количество аккаунтов');
        return;
    }
    $.ajax({
        type: 'POST',
        url: '/account_group/remove_account_from_like_group',
        data: { account_count },
        success: function(res) {
            toastr.success('Аккаунты убраны');
            setTimeout(function() {
                window.location.href = "/account_group";
            }, 1000);
        }
    });
};