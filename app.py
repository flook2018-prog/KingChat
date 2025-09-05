from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO
import sqlite3, time, os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

DB_PATH = 'chat.db'

def get_db():
    first_time = not os.path.exists(DB_PATH)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    if first_time:
        # สร้าง table ถ้ายังไม่มี
        conn.execute('''CREATE TABLE IF NOT EXISTS clients (
            userId TEXT PRIMARY KEY,
            userName TEXT,
            oaName TEXT,
            assignedAdmin TEXT,
            username TEXT,
            regDate TEXT,
            note TEXT
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            sender TEXT,
            text TEXT,
            time INTEGER,
            FOREIGN KEY(userId) REFERENCES clients(userId)
        )''')
        conn.commit()
    return conn

db = get_db()
clients = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history_api/<userId>')
def history_api(userId):
    cur = db.execute('SELECT * FROM messages WHERE userId=? ORDER BY time ASC', (userId,))
    messages = cur.fetchall()
    msgs = [{'sender':m['sender'],'text':m['text'],'time':m['time']} for m in messages]
    return jsonify({'messages': msgs})

@socketio.on('sendMessage')
def handle_sendMessage(data):
    userId = data['userId']
    text = data['text']
    msg_time = int(time.time()*1000)
    # Save to memory
    if userId in clients:
        clients[userId]['messages'].append({'sender':'admin','text':text})
    # Save to DB
    db.execute('INSERT INTO messages (userId,sender,text,time) VALUES (?,?,?,?)',
               (userId,'admin',text,msg_time))
    db.commit()
    socketio.emit('newMessage', {'userId':userId,'sender':'admin','text':text,'time':msg_time})

@socketio.on('assignCase')
def handle_assignCase(data):
    userId = data['userId']
    adminName = data['adminName']
    if userId in clients:
        clients[userId]['assignedAdmin'] = adminName
        db.execute('UPDATE clients SET assignedAdmin=? WHERE userId=?', (adminName,userId))
        db.commit()
        socketio.emit('updateCase', {'userId':userId,'assignedAdmin':adminName})

@socketio.on('updateProfileNote')
def handle_updateNote(data):
    userId = data['userId']
    note = data['note']
    if userId in clients:
        clients[userId]['profile']['note'] = note
        db.execute('UPDATE clients SET note=? WHERE userId=?', (note,userId))
        db.commit()
        socketio.emit('updateNote', {'userId':userId,'note':note})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get("PORT",5000)))
