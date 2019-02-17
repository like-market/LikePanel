/**
 * Обновляем пагинацию
 */
function updatePagination() {
	// Вычисляем сколько всего страниц
	console.log(`Count: ${count} Page: ${page} Tasks: ${tasks_count}`)

	let to = (page) * (count);
	if (to > tasks_count) to = tasks_count;

	let from = (page - 1) * count + 1;

	$('#from').text(from);
	$('#to').text(to)

	console.log(`From: ${from} To: ${to}`)
}

/**
 * Обновляем список задач
 * @param count - количество задач на странице
 * @param page  - номер страницы
 */
function updateTasks() {
	$('#tasks_panel').toggleClass('ld-loading');
	$.ajax({
	    type: 'POST',
	    url: '/tasks/get_tasks',
	    data: {
	        count: count,
	        offset: (page - 1) * count
	    },
	    success: function(res) {
	        // Для всех строк
			let rows;
			JSON.parse(res).forEach(function(task) {
		        var row = '<tr><td>';
		        switch (task.status) {
		        	case 'finish': row += '<span class="label label-success">Выполнена</span></td>'; break;
		        	case 'run'   : row += '<span class="label label-info">Выполняется</span></td>'; break;
		        	case 'wait'  : row += '<span class="label label-accent">Ожидание</span></td>'; break;
		        	case 'error' : row += '<span class="label label-danger">Ошибка</span></td>'; break;
		        }
		        row += `<td>${task.name}<div class="small"><a href="${task.url}" target="_blank">${task.url}</a></div></td>`

		        if (task.type == 'like') {
		        	row += `<td><i class="fa pe-7s-like"></i>&nbsp;&nbsp;${task.need_add}</td>`
		        }else {
		        	row += `<td><i class="fa fa-commenting-o"></i>&nbsp;&nbsp;${task.need_add}</td>`
		        }

		        let progress = Math.round(task.now_add / task.need_add * 100);

		        row += `<td><div class="progress m-b-none full progress-small">`
	            row += `<div style="width: ${progress}%" class="progress-bar progress-bar-warning"></div>`
	            row += `</div><small>${progress}% завершено</small></td></tr>`

	            rows += row;
		    });
		    $('#tasks-data').html(rows);
		    $('#tasks_panel').toggleClass('ld-loading');
	    },
	    error: function(XMLHttpRequest, textStatus, errorThrown) { 
	        alert(`Status: ${textStatus} \n Error: ${errorThrown}`);
	        console.log(errorThrown)
	    }
	})
}

/**
 * Вызывается при изменении количества тасков на странице
 * Обновляем список задач и пагинацию 
 */
$('#count').change(function() {
	count = $('#count').val();  // Количество тасков на странице
	page = 1;                   // Текущая страница - первая
	updateTasks();      // Обновляем список задач
	updatePagination(); // Обновляем пагинацию
});

/**
 * Изменяем страницу
 * @param page - next/prev
 */
function changePage(type) {
	if (type == 'next') {
		let new_page = page + 1;
		console.log(new_page, max_page)
		if (new_page > max_page) return;
		page++;
		updateTasks();
		updatePagination();
	}else {
		let new_page = page - 1;
		if (new_page < 1) return;
		page--;
		updateTasks();
		updatePagination();
	}
}