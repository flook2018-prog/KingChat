from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import sqlite3
from utils import init_db, save_message, get_messages

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

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
    socketio.run(app, host='0.0.0.0', port=5000)
