from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# ----------------------------
# ข้อมูลจำลอง
# ----------------------------
admins = ["Admin1", "Admin2", "Admin3"]
line_settings = {}
cases = []  # เก็บเคสทั้งหมด
chat_history = {}  # เก็บประวัติแชท per case

# ----------------------------
# หน้า index สำหรับแอดมิน
# ----------------------------
@app.route('/')
def index():
    return render_template('index.html', admins=admins, cases=cases)

# ----------------------------
# หน้า Settings Line OA
# ----------------------------
@app.route('/settings')
def settings():
    # โหลดค่าเดิมถ้ามี
    if os.path.exists('line_settings.json'):
        with open('line_settings.json','r',encoding='utf-8') as f:
            global line_settings
            line_settings = json.load(f)
    return render_template('settings.html', settings=line_settings)

@app.route('/save_line_settings', methods=['POST'])
def save_line_settings():
    global line_settings
    data = request.json
    line_settings = data
    # บันทึกลงไฟล์
    with open('line_settings.json', 'w', encoding='utf-8') as f:
        json.dump(line_settings, f, ensure_ascii=False, indent=4)
    return jsonify({'success': True})

# ----------------------------
# API รับเคสใหม่
# ----------------------------
@app.route('/new_case', methods=['POST'])
def new_case():
    data = request.json
    case_id = len(cases) + 1
    case = {
        "id": case_id,
        "customer_name": data.get("customer_name"),
        "status": "unassigned",
        "admin": None
    }
    cases.append(case)
    chat_history[case_id] = []
    # แจ้ง frontend
    socketio.emit('new_case', case)
    return jsonify({"success": True, "case": case})

# ----------------------------
# Assign เคสให้แอดมิน
# ----------------------------
@app.route('/assign_case', methods=['POST'])
def assign_case():
    case_id = request.json.get("case_id")
    admin = request.json.get("admin")
    for case in cases:
        if case["id"] == case_id:
            case["status"] = "assigned"
            case["admin"] = admin
            break
    socketio.emit('update_case', {"id": case_id, "admin": admin})
    return jsonify({"success": True})

# ----------------------------
# รับแชทจากลูกค้า
# ----------------------------
@app.route('/incoming_message', methods=['POST'])
def incoming_message():
    # จาก Line OA หรือ API
    data = request.json
    case_id = data.get("case_id")
    message = data.get("message")
    chat_entry = {"from": "customer", "message": message}
    if case_id in chat_history:
        chat_history[case_id].append(chat_entry)
    socketio.emit('new_message', {"case_id": case_id, "message": chat_entry})
    return jsonify({"success": True})

# ----------------------------
# แอดมินส่งข้อความ
# ----------------------------
@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.json
    case_id = data.get("case_id")
    message = data.get("message")
    chat_entry = {"from": "admin", "message": message}
    if case_id in chat_history:
        chat_history[case_id].append(chat_entry)
    # ส่ง realtime กลับ frontend
    socketio.emit('new_message', {"case_id": case_id, "message": chat_entry})
    return jsonify({"success": True})

# ----------------------------
# หน้าแชทย้อนหลัง
# ----------------------------
@app.route('/history/<int:case_id>')
def history(case_id):
    messages = chat_history.get(case_id, [])
    return jsonify(messages)

# ----------------------------
# Run
# ----------------------------
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
