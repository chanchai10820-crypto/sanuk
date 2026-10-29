"""
สร้างไฟล์ js/roster.js จากไฟล์ Excel บัญชีรายชื่อนักเรียน

เก็บเฉพาะ ห้อง เลขที่ คำนำหน้า และชื่อจริง
ไม่เก็บนามสกุลและเลขประจำตัว เพราะ repo นี้เปิดเป็นสาธารณะ

ใช้งาน:
    python3 scripts/build_roster.py <ไฟล์.xlsx> 3/5 3/6 3/7 3/8
"""
import json
import re
import sys

import openpyxl

PREFIX = {'เด็กชาย': 'ด.ช.', 'เด็กหญิง': 'ด.ญ.'}


def read_room(ws):
    room = None
    students = []
    for row in ws.iter_rows(values_only=True):
        if room is None:
            for cell in row:
                m = re.search(r'ประถมศึกษาปีที่\s*(\d+/\d+)', str(cell or ''))
                if m:
                    room = m.group(1)
        no, _sid, title, first = row[0], row[1], row[2], row[3]
        if isinstance(no, (int, float)) and title in PREFIX and first:
            students.append({'no': int(no), 't': PREFIX[title], 'n': ' '.join(str(first).split())})
    return room, students


def main():
    path, wanted = sys.argv[1], sys.argv[2:]
    wb = openpyxl.load_workbook(path, data_only=True)
    rooms = {}
    for ws in wb.worksheets:
        room, students = read_room(ws)
        if room in wanted and students:
            rooms[room] = students
    missing = [r for r in wanted if r not in rooms]
    if missing:
        sys.exit(f'ไม่พบห้อง: {", ".join(missing)}')
    out = {
        'school': 'โรงเรียนอนุบาลขอนแก่น',
        'year': '2569',
        'rooms': [{'id': r.replace('/', '-'), 'name': f'ป.{r}', 'students': rooms[r]} for r in wanted],
    }
    for r in out['rooms']:
        boys = sum(s['t'] == 'ด.ช.' for s in r['students'])
        print(f"{r['name']}: {len(r['students'])} คน (ชาย {boys} หญิง {len(r['students']) - boys})", file=sys.stderr)
    dump = lambda v: json.dumps(v, ensure_ascii=False)
    lines = ['/* รายชื่อนักเรียน สร้างจาก scripts/build_roster.py (เก็บเฉพาะเลขที่และชื่อจริง) */',
             'window.ROSTER = {',
             f"  school: {dump(out['school'])},",
             f"  year: {dump(out['year'])},",
             '  rooms: [']
    for k, r in enumerate(out['rooms']):
        lines.append(f"    {{ id: {dump(r['id'])}, name: {dump(r['name'])}, students: [")
        lines += [f"      {{ no: {s['no']}, t: {dump(s['t'])}, n: {dump(s['n'])} }}," for s in r['students']]
        lines[-1] = lines[-1].rstrip(',')
        lines.append('    ] }' + (',' if k < len(out['rooms']) - 1 else ''))
    lines += ['  ]', '};', '']
    with open('js/roster.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    main()
