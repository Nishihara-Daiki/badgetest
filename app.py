import json
import re
import requests
from flask import Flask, Markup, render_template

app = Flask(__name__, template_folder='.')

@app.route('/')
def root():
    return render_template('index.html')


@app.route('/list')
def show():
    results = get_requests()
    table_contents = Markup(get_table_contents(results))
    return render_template("show.html", table_contents=table_contents)


@app.route('/source')
def source():
    return json.dumps(get_requests(), indent=4, ensure_ascii=False)


def get_requests():
    BASE_URL = 'http://203.137.92.236/appwebapi/src/getFsbtInformation.php?appName=JSF%20FS%20Info'
    queue = [range(1, 3), range(3, 6), range(6, 14), range(14, 18), range(18, 24), range(24, 30), range(30, 40), range(40, 48)]
    results = []
    for i, ids in enumerate(queue):
        pref_numbers = ','.join(map(str, ids))
        url = f'{BASE_URL}&pref={pref_numbers}'
        res = requests.post(url=url)
        info = res.json()['information']
        print(ids, len(info))
        if len(info) >= 30 and len(ids) > 1:
            mid = len(ids) // 2
            queue.append(ids[:mid])
            queue.append(ids[mid:])
        else:
            for item in info:
                if 'informationID' in item and item['informationID'] is not None:
                    results.append(item)
        if i > 100:
            print('loop limit')
            break
    print('results = ', len(results))
    return results


def get_table_contents(results):
    messages = [extract_from_message(message) for message in results]
    messages.sort(key=lambda x: (x['test_date'], x['test_time'], x['prefecture'], x['test_type'], x['location'], x['id']), reverse=True)

    contents = []
    exists = set()
    deleted = set()
    for mes in messages:
        class_name = ''
        key = mes['prefecture'] + mes['test_type'] + mes['test_date'] + mes['test_time'] + mes['location']
        if key in exists:
            class_name += 'duplicated '
        exists.add(key)

        if mes['post_type'] == '削除' or key in deleted:
            class_name += 'deleted '
            deleted.add(key)
        
        id_name = mes['id']
        line = f'<tr id="{id_name}" class="{class_name}"><td>' + '</td><td>'.join([mes['prefecture'], mes['test_type'], mes['test_date'], mes['test_time'], mes['location']]) + '</td></tr>'
        detail = f'<tr class="{class_name} detail"><td colspan="5">' + mes['details'].replace('\n', '<br>') + '</td></tr>'
        contents.append(line + detail)
    return ''.join(contents)

reg = {
    'test_type': re.compile('\[テスト区分\]：([^\n]*)\n'),
    'test_date_time': re.compile('\[テスト日時\]：([^\n]*)\n'),
    'application_deadline': re.compile('\[申込締切\]：([^\n]*)\n'),
    'location': re.compile('\[場所\]：([^\n]*)\n'),
    'details_a': re.compile('\[連絡事項\]：([\s\S]*)マイページより受験の申込'),
    'details_b': re.compile('\[連絡事項\]：([\s\S]*)\n\n------'),
}


def extract_from_message(message):
    info = message['information']
    # print(info)
    # print(re.search('\[連絡事項\]：([\s\S]*)マイページより受験の申込', info))
    # print()
    for t in ('新規登録', '更新', '削除'):
        if t in message['informationTitle']:
            post_type = t
    test_date, test_time = reg['test_date_time'].search(info).group(1).split('  ')
    if post_type == '削除':
        details = reg['details_b'].search(info).group(1).rstrip()
    else:
        details = reg['details_a'].search(info).group(1).rstrip()

    return {
        "id": message['informationID'],
        "post_type": post_type,
        "prefecture": info[:info.index('バッジテスト案内\n\n')],
        "test_type": reg['test_type'].search(info).group(1),
        "test_date": test_date,
        "test_time": test_time,
        "application_deadline": reg['application_deadline'].search(info).group(1),
        "location": reg['location'].search(info).group(1),
        "details": details,
    }
