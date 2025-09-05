from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecretkey'
socketio = SocketIO(app, cors_allowed_origins="*")

# Database จำลอง (ใช้จริงต้องต่อ DB)
customers = {}       # customer_id -> info
chat_history = {}    # customer_id -> list of messages
line_settings = {'virtual_id':'', 'virtual_link':'', 'status':'ไม่เชื่อมต่อ'}

# หน้าแอดมินหลัก
@app.route('/')
def index():
    return render_template('index.html', customers=customers)

# หน้าโปรไฟล์ลูกค้า
@app.route('/profile/<customer_id>')
def profile(customer_id):
    info = customers.get(customer_id, {})
    history = chat_history.get(customer_id, [])
    return render_template('profile.html', info=info, history=history)

# หน้าแพทเทินข้อความ
@app.route('/patterns')
def patterns():
    return render_template('patterns.html')

# หน้า Settings Line OA
@app.route('/settings', methods=['GET','POST'])
def settings():
    global line_settings
    if request.method == 'POST':
        line_settings['virtual_id'] = request.form.get('virtual_id')
        line_settings['virtual_link'] = request.form.get('virtual_link')
        line_settings['status'] = 'เชื่อมต่อแล้ว'
    return render_template('settings.html', line_settings=line_settings)

# รับข้อความจาก Admin ส่งลูกค้า
@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.json
    customer_id = data['customer_id']
    message = data['message']
    # บันทึกลง chat_history
    if customer_id not in chat_history:
        chat_history[customer_id] = []
    chat_history[customer_id].append({'from':'admin','message':message})
    # ส่งเรียลไทม์ให้หน้าแอดมิน
    socketio.emit('new_message', {'customer_id':customer_id,'from':'admin','message':message})
    return jsonify({'status':'ok'})

# รับข้อความจากลูกค้า (Webhook Line OA)
@app.route('/receive_message', methods=['POST'])
def receive_message():
    data = request.json
    customer_id = data['customer_id']
    message = data['message']
    if customer_id not in chat_history:
        chat_history[customer_id] = []
    chat_history[customer_id].append({'from':'customer','message':message})
    # ส่งเรียลไทม์ให้หน้าแอดมิน
    socketio.emit('new_message', {'customer_id':customer_id,'from':'customer','message':message})
    return jsonify({'status':'ok'})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT',5000)))
