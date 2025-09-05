from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json, os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# ----------------------------
# ข้อมูลจำลอง
# ----------------------------
admins = ["Admin1", "Admin2", "Admin3"]
cases = []  # เคสทั้งหมด
chat_history = {}  # chat per case
customer_profiles = {}  # เก็บโปรไฟล์ลูกค้า

# ----------------------------
# หน้าแอดมิน
# ----------------------------
@app.route('/')
def index():
    return render_template('index.html', admins=admins, cases=cases)

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
    # เก็บข้อมูลลูกค้า
    customer_profiles[case_id] = {
        "photo": data.get("photo","https://via.placeholder.com/80"),
        "username": data.get("username","-"),
        "notes": data.get("notes","-")
    }
    socketio.emit('new_case', case)
    socketio.emit('update_profile', {"case_id": case_id, "profile": customer_profiles[case_id]})
    return jsonify({"success": True, "case": case})

# ----------------------------
# Assign เคส
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
# รับข้อความลูกค้า
# ----------------------------
@app.route('/incoming_message', methods=['POST'])
def incoming_message():
    data = request.json
    case_id = data.get("case_id")
    message = data.get("message")
    chat_entry = {"from":"customer", "message":message}
    chat_history.setdefault(case_id, []).append(chat_entry)
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
    chat_entry = {"from":"admin", "message":message}
    chat_history.setdefault(case_id, []).append(chat_entry)
    socketio.emit('new_message', {"case_id": case_id, "message": chat_entry})
    return jsonify({"success": True})

# ----------------------------
# แชทย้อนหลัง
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
