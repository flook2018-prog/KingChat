from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
import os
from time import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')
socketio = SocketIO(app, cors_allowed_origins="*")

# โหลด LINE OA accounts จาก config.json
with open('config.json', encoding='utf-8') as f:
    line_accounts = json.load(f)

# เก็บข้อความลูกค้า
clients = {}  # {userId: {messages:[], oaName, userName, unread}}

# หน้า Admin
@app.route('/')
def index():
    return render_template('index.html')

# รับ Webhook LINE OA
@app.route('/webhook/<oa_id>', methods=['POST'])
def webhook(oa_id):
    data = request.json
    events = data.get('events', [])
    for event in events:
        if event.get('type')=='message' and event['message']['type']=='text':
            userId = event['source']['userId']
            userName = 'User'
            oaName = next((x['name'] for x in line_accounts if x['id']==oa_id), 'OA')
            if userId not in clients:
                clients[userId] = {'messages':[], 'oaName':oaName, 'userName':userName, 'unread':True}
            msg_time = int(time()*1000)
            clients[userId]['messages'].append({
                'sender':'customer',
                'text':event['message']['text'],
                'userName':userName,
                'oaName':oaName,
                'time': msg_time
            })
            clients[userId]['unread'] = True
            socketio.emit('newMessage',{
                'userId':userId,
                'sender':'customer',
                'text':event['message']['text'],
                'userName':userName,
                'oaName':oaName,
                'time': msg_time
            })
    return jsonify({'status':'ok'})

# รับข้อความจาก Admin
@socketio.on('sendMessage')
def handle_send_message(data):
    userId = data.get('userId')
    text = data.get('text')
    if userId in clients:
        msg_time = int(time()*1000)
        clients[userId]['messages'].append({
            'sender':'admin',
            'text':text,
            'userName':'Admin',
            'oaName':clients[userId]['oaName'],
            'time': msg_time
        })
        emit('newMessage',{
            'userId':userId,
            'sender':'admin',
            'text':text,
            'userName':'Admin',
            'oaName':clients[userId]['oaName'],
            'time': msg_time
        }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
