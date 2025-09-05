from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import os
from utils import init_db, save_message, get_messages
import eventlet

# patch socket สำหรับ eventlet
eventlet.monkey_patch()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret!')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# สร้าง DB และตารางถ้ายังไม่มี
init_db()

@app.route('/')
def index():
    return render_template('chat.html')

@app.route('/messages', methods=['GET'])
def fetch_messages():
    messages = get_messages()
    return jsonify(messages)

@socketio.on('send_message')
def handle_send_message(data):
    username = data.get('username', 'Anonymous')
    message = data.get('message', '')
    msg_id = save_message(username, message)
    emit('receive_message', {'id': msg_id, 'username': username, 'message': message}, broadcast=True)

if __name__ == '__main__':
    # ใช้ PORT ของ Railway หรือ default 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"Running on port {port}")
    socketio.run(app, host='0.0.0.0', port=port)
