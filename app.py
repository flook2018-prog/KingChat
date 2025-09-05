from flask import Flask, render_template, request, jsonify, abort
from flask_socketio import SocketIO, emit
from datetime import datetime
import sqlite3
import os

# Line SDK
from linebot import LineBotApi, WebhookHandler
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from linebot.exceptions import InvalidSignatureError

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

DB_FILE = 'kingautochat.db'

# --- Line OA config ---
LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET", "YOUR_CHANNEL_SECRET")
LINE_CHANNEL_TOKEN = os.getenv("LINE_CHANNEL_TOKEN", "YOUR_CHANNEL_TOKEN")
line_bot_api = LineBotApi(LINE_CHANNEL_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

# --- DB Init ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT,
            line_oa TEXT,
            status TEXT,
            admin_name TEXT,
            created_at TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER,
            sender TEXT,
            message TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Routes ---
@app.route('/')
def index():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT * FROM cases ORDER BY created_at DESC')
    rows = c.fetchall()
    cases = []
    for r in rows:
        cases.append({
            'id': r[0], 'customer_name': r[1], 'line_oa': r[2],
            'status': r[3], 'admin_name': r[4] if r[4] else ''
        })
    conn.close()
    return render_template('index.html', cases=cases)

@app.route('/assign_case', methods=['POST'])
def assign_case():
    data = request.json
    case_id = data['case_id']
    admin_name = data['admin_name']
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('UPDATE cases SET status=?, admin_name=? WHERE id=?', ('assigned', admin_name, case_id))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

@app.route('/history')
def history():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT DISTINCT line_oa FROM cases')
    lines = [r[0] for r in c.fetchall()]
    c.execute('SELECT * FROM cases ORDER BY created_at DESC')
    cases = [{'id':r[0],'customer_name':r[1],'line_oa':r[2]} for r in c.fetchall()]
    c.execute('''
        SELECT m.id, m.case_id, c.customer_name, c.line_oa, m.sender, m.message, m.timestamp 
        FROM chat_messages m
        JOIN cases c ON m.case_id=c.id
        ORDER BY m.timestamp DESC
    ''')
    chats = [{'id':r[0],'case_id':r[1],'customer_name':r[2],'line_oa':r[3],'sender':r[4],'message':r[5],'date':r[6]} for r in c.fetchall()]
    conn.close()
    return render_template('history.html', cases=cases, lines=lines, chats=chats)

@app.route('/history/<int:case_id>')
def history_case(case_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT sender, message FROM chat_messages WHERE case_id=? ORDER BY timestamp ASC', (case_id,))
    messages = [{'sender':r[0],'message':r[1]} for r in c.fetchall()]
    conn.close()
    return jsonify({'messages': messages})

# --- SocketIO ---
@socketio.on('send_message')
def handle_message(data):
    case_id = data['case_id']
    sender = data['sender']
    message = data['message']
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # save to DB
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO chat_messages (case_id, sender, message, timestamp) VALUES (?,?,?,?)',
              (case_id, sender, message, timestamp))
    conn.commit()
    conn.close()
    # broadcast to all clients
    emit('receive_message', {'case_id': case_id, 'sender': sender, 'message': message}, broadcast=True)

# --- Line OA Webhook ---
@app.route('/line_webhook/<oa_name>', methods=['POST'])
def line_webhook(oa_name):
    signature = request.headers['X-Line-Signature']
    body = request.get_data(as_text=True)
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return 'OK'

@handler.add(MessageEvent, message=TextMessage)
def handle_line_message(event):
    customer_name = event.source.user_id
    message_text = event.message.text
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    oa_name = "LINE_OA"  # สามารถใช้ URL parameter /line_webhook/<oa_name> มาปรับได้

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id FROM cases WHERE customer_name=? AND line_oa=?", (customer_name, oa_name))
    row = c.fetchone()
    if row:
        case_id = row[0]
    else:
        c.execute("INSERT INTO cases (customer_name, line_oa, status, created_at) VALUES (?,?,?,?)",
                  (customer_name, oa_name, 'new', timestamp))
        case_id = c.lastrowid
    c.execute("INSERT INTO chat_messages (case_id, sender, message, timestamp) VALUES (?,?,?,?)",
              (case_id, 'customer', message_text, timestamp))
    conn.commit()
    conn.close()
    socketio.emit('receive_message', {'case_id': case_id, 'sender':'customer', 'message': message_text})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
