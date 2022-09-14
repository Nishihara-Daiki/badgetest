
var extract_from_message = (message) => {
	let info = message['information']
	return {
		"id": message['informationID'],
		"updatepost": message['informationTitle'].indexOf('更新') != -1,
		"prefecture": info.slice(0, info.indexOf('バッジテスト案内\n\n')),
		"test_type": info.match(/\[テスト区分\]：([^\n]*)\n/)[1],
		"test_date": info.match(/\[テスト日時\]：([^\n]*)\n/)[1].split('  ')[0],
		"test_time": info.match(/\[テスト日時\]：([^\n]*)\n/)[1].split('  ')[1],
		"application_deadline": info.match(/\[申込締切\]：([^\n]*)\n/)[1],
		"location": info.match(/\[場所\]：([^\n]*)\n/)[1],
		"details": info.match(/\[連絡事項\]：([\s\S]*)マイページより受験の申込/)[1].trim(),
	}
}

var list_messages = (messages) => {
	let results = []
	messages.forEach(m => {
		if(m['informationID'] != null)
			results.push(extract_from_message(m))
	})
	results.sort((a, b) => {
		let a_date = `${a['test_date']} ${a['test_time']}`
		let b_date = `${b['test_date']} ${b['test_time']}`
		if(a_date < b_date)
			return 1
		else if(a_date > b_date)
			return -1
		else
			return a['id'] - b['id']
	})
	return results
}

var get_day = (date_string) => {
	// date_string: "YYYY/MM/DD"
	let year = +date_string.split('/')[0]
	let month = +date_string.split('/')[1]
	let date = +date_string.split('/')[2]
	return '日月火水木金土'[(new Date(year, month - 1, date)).getDay()]
}

var show_result = (messages) => {
	let exists = []
	let header = $('<tr><th>都道府県</th><th>区分</th><th>テスト日</th><th>テスト時間</th><th>場所</th></tr>')
	$('#main').empty()
	$('#main').append(header)
	messages.forEach(m => {
		let key = m.prefecture + m.test_type + m.test_date + m.test_time + m.location
		let cls = exists.indexOf(key) == -1 ? '' : 'duplicated'
		exists.push(key)
		let tr = $(`<tr class="${cls}"><td>${m.prefecture}</td><td>${m.test_type}</td><td>${m.test_date}(${get_day(m.test_date)})</td><td>${m.test_time}</td><td>${m.location}</td></tr>`)
		$('#main').append(tr)
		let detail = $(`<tr class="detail ${cls}"><td colspan="5">${m.details.replaceAll('\n', '<br>')}</td></tr>`)
		$('#main').append(detail)
	})
	console.log(messages)
}

$(function() {
	let urls = [
		'http://203.137.92.236/appwebapi/src/getFsbtInformation.php?appName=JSF%20FS%20Info&pref=1,2,3,4,5,6,7,8,9,10',
		'http://203.137.92.236/appwebapi/src/getFsbtInformation.php?appName=JSF%20FS%20Info&pref=11,12,13,14,15,16,17,18,19,20',
		'http://203.137.92.236/appwebapi/src/getFsbtInformation.php?appName=JSF%20FS%20Info&pref=21,22,23,24,25,26,27,28,29,30',
		'http://203.137.92.236/appwebapi/src/getFsbtInformation.php?appName=JSF%20FS%20Info&pref=31,32,33,34,35,36,37,38,39,40',
		'http://203.137.92.236/appwebapi/src/getFsbtInformation.php?appName=JSF%20FS%20Info&pref=41,42,43,44,45,46,47'
	]
	let raw_messages = []
	urls.forEach((url) => {
		$.post(url).done((data) => {
			let ms = JSON.parse(data)['information']
			raw_messages = raw_messages.concat(ms)
			// console.log(raw_messages)
			show_result(list_messages(raw_messages))
			console.log(0)
		})
	})

	// messages = miyagi
	// messages = list_messages(messages)
	// show_result(messages)

	// console.log(extract_from_message(messages[0]))
	// console.log(extract_from_message(messages[1]))

})
