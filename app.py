from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room
from collections import defaultdict
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# ข้อมูลจำลอง
clients = {}  # {client_id: {name, profile, notes}}
messages = defaultdict(list)  # {client_id: [msg,...]}
line_settings = {"virtual_id":"", "virtual_link":"", "status":"ไม่เชื่อมต่อ"}

admins = ["Admin1", "Admin2"]  # ตัวอย่างแอดมิน

@app.route('/')
def index():
    return render_template('index.html', clients=clients, admins=admins)

@app.route('/settings', methods=['GET','POST'])
def settings():
    global line_settings
    if request.method == 'POST':
        line_settings['virtual_id'] = request.form.get('virtual_id')
        line_settings['virtual_link'] = request.form.get('virtual_link')
        line_settings['status'] = 'เชื่อมต่อแล้ว'
    return render_template('settings.html', line_settings=line_settings)

# รับข้อความจาก client หรือ admin
@socketio.on('send_message')
def handle_message(data):
    client_id = data['client_id']
    msg = {"from":data['from'], "text":data['text'], "type":data.get('type','text')}
    messages[client_id].append(msg)
    emit('receive_message', msg, to=client_id)
    emit('receive_message', msg, broadcast=True)  # อัปเดตแอดมินทุกคน

# แอดมินเข้าห้องลูกค้า
@socketio.on('join_client')
def join(data):
    client_id = data['client_id']
    join_room(client_id)
    emit('load_messages', messages[client_id], to=request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
