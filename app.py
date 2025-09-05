from flask import Flask, render_template, request, redirect, jsonify
from flask_socketio import SocketIO, emit
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# เก็บ Settings Line OA
LINE_SETTINGS_FILE = "line_settings.json"
if not os.path.exists(LINE_SETTINGS_FILE):
    with open(LINE_SETTINGS_FILE, "w") as f:
        json.dump({"virtual_id": "", "virtual_link": "", "status": "ยังไม่เชื่อม"}, f)

# เก็บ Chat History
CHAT_HISTORY_FILE = "chat_history.json"
if not os.path.exists(CHAT_HISTORY_FILE):
    with open(CHAT_HISTORY_FILE, "w") as f:
        json.dump({}, f)

# หน้าแอดมินหลัก
@app.route("/")
def index():
    with open(LINE_SETTINGS_FILE) as f:
        line_settings = json.load(f)
    return render_template("index.html", line_settings=line_settings)

# หน้า Setting Line OA
@app.route("/settings", methods=["GET", "POST"])
def settings():
    if request.method == "POST":
        data = {
            "virtual_id": request.form.get("virtual_id"),
            "virtual_link": request.form.get("virtual_link"),
            "status": "เชื่อมต่อแล้ว" if request.form.get("virtual_id") else "ยังไม่เชื่อม"
        }
        with open(LINE_SETTINGS_FILE, "w") as f:
            json.dump(data, f)
        return redirect("/settings")

    with open(LINE_SETTINGS_FILE) as f:
        line_settings = json.load(f)
    return render_template("settings.html", line_settings=line_settings)

# SocketIO รับข้อความจากลูกค้า
@socketio.on("customer_message")
def handle_customer_message(data):
    # บันทึกลง chat_history.json
    with open(CHAT_HISTORY_FILE) as f:
        chat_data = json.load(f)
    user_id = data["user_id"]
    if user_id not in chat_data:
        chat_data[user_id] = []
    chat_data[user_id].append(data)
    with open(CHAT_HISTORY_FILE, "w") as f:
        json.dump(chat_data, f)

    # ส่งเด้งไปหน้า Admin แบบเรียลไทม์
    emit("new_message", data, broadcast=True)

# SocketIO ส่งข้อความจาก Admin ไปลูกค้า
@socketio.on("admin_message")
def handle_admin_message(data):
    emit("new_message", data, broadcast=True)

# หน้า Profile Admin
@app.route("/profile")
def profile():
    return render_template("profile.html")

# หน้า Pattern Message
@app.route("/pattern")
def pattern():
    return render_template("pattern.html")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
