from flask import Flask, request, jsonify, render_template, session, redirect, url_for
import sqlite3, requests
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'kingautochat_secret_key'
DATABASE = 'line_data.db'

# ======== Database Setup ========
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    # ข้อความลูกค้า
    c.execute('''CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER,
                    user_id TEXT,
                    message TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )''')
    # Template
    c.execute('''CREATE TABLE IF NOT EXISTS templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER,
                    template TEXT
                )''')
    # LINE Account
    c.execute('''CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_name TEXT,
                    channel_token TEXT
                )''')
    # Admin
    c.execute('''CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    password TEXT,
                    role TEXT DEFAULT 'admin'
                )''')
    conn.commit()
    conn.close()

init_db()

# ======== Super Admin เริ่มต้น ========
def create_super_admin():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM admins")
    count = c.fetchone()[0]
    if count == 0:
        username = "kingadmin"
        password = "123456"
        hashed = generate_password_hash(password)
        c.execute("INSERT INTO admins (username, password, role) VALUES (?, ?, 'super')",
                  (username, hashed))
        print("สร้าง Super Admin เรียบร้อย:", username)
    conn.commit()
    conn.close()

create_super_admin()

# ======== Helpers ========
def is_super_admin():
    if 'admin_id' not in session:
        return False
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT role FROM admins WHERE id=?", (session['admin_id'],))
    row = c.fetchone()
    conn.close()
    return row[0] == 'super' if row else False

def get_access_token(account_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT channel_token FROM accounts WHERE id=?", (account_id,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

# ======== Authentication ========
@app.route('/login', methods=['GET','POST'])
def login():
    if request.method=='POST':
        username = request.form['username']
        password = request.form['password']
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute("SELECT id, password FROM admins WHERE username=?", (username,))
        row = c.fetchone()
        conn.close()
        if row and check_password_hash(row[1], password):
            session['admin_id'] = row[0]
            return redirect(url_for('index'))
        return render_template('login.html', error='รหัสผ่านไม่ถูกต้อง')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.before_request
def require_login():
    if request.endpoint not in ('login','static') and 'admin_id' not in session:
        return redirect(url_for('login'))

# ======== Dashboard ========
@app.route('/')
def index():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM accounts")
    accounts = c.fetchall()
    c.execute("SELECT * FROM templates")
    templates = c.fetchall()
    conn.close()
    return render_template("index.html", accounts=accounts, templates=templates)

# Webhook รับข้อความจาก LINE
@app.route('/webhook/<int:account_id>', methods=['POST'])
def webhook(account_id):
    data = request.json
    try:
        event = data['events'][0]
        user_id = event['source']['userId']
        message = event['message']['text']

        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute("INSERT INTO messages (account_id, user_id, message) VALUES (?, ?, ?)",
                  (account_id, user_id, message))
        conn.commit()
        conn.close()

        # ตอบกลับอัตโนมัติ
        reply_token = event['replyToken']
        access_token = get_access_token(account_id)
        if access_token:
            requests.post('https://api.line.me/v2/bot/message/reply',
                          headers={
                              'Authorization': f'Bearer {access_token}',
                              'Content-Type': 'application/json'
                          },
                          json={
                              "replyToken": reply_token,
                              "messages":[{"type":"text","text":"ขอบคุณที่ติดต่อเราค่ะ"}]
                          })
    except Exception as e:
        print("Webhook error:", e)
    return 'OK'

# ดึงข้อความสำหรับ Dashboard
@app.route('/messages/<int:account_id>')
def get_messages(account_id):
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT user_id, message, timestamp FROM messages WHERE account_id=? ORDER BY timestamp DESC", (account_id,))
    messages = c.fetchall()
    conn.close()
    return jsonify(messages)

# ส่งข้อความจาก Dashboard
@app.route('/send_message/<int:account_id>', methods=['POST'])
def send_message(account_id):
    data = request.json
    user_id = data.get('user_id')
    message = data.get('message')
    access_token = get_access_token(account_id)
    if not access_token or not user_id:
        return jsonify({'status':'error'}), 400

    requests.post('https://api.line.me/v2/bot/message/push',
                  headers={
                      'Authorization': f'Bearer {access_token}',
                      'Content-Type': 'application/json'
                  },
                  json={
                      "to": user_id,
                      "messages":[{"type":"text","text":message}]
                  })
    # บันทึกข้อความลง DB
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO messages (account_id, user_id, message) VALUES (?, ?, ?)",
              (account_id, user_id, message))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

# ======== Template CRUD ========
@app.route('/add_template', methods=['POST'])
def add_template():
    data = request.json
    account_id = data.get('account_id')
    text = data.get('template')
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO templates (account_id, template) VALUES (?, ?)", (account_id, text))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

@app.route('/delete_template/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    if not is_super_admin():
        return jsonify({'status':'error','message':'คุณไม่มีสิทธิ์'}),403
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM templates WHERE id=?", (template_id,))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

# ======== Account CRUD ========
@app.route('/add_account', methods=['POST'])
def add_account():
    if not is_super_admin():
        return jsonify({'status':'error','message':'คุณไม่มีสิทธิ์'}),403
    data = request.json
    name = data.get('account_name')
    token = data.get('channel_token')
    if not name or not token:
        return jsonify({'status':'error','message':'กรอกชื่อและ Token ด้วย'}), 400
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("INSERT INTO accounts (account_name, channel_token) VALUES (?, ?)", (name, token))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

# ======== Admin Management ========
@app.route('/admin')
def admin_page():
    if not is_super_admin():
        return "คุณไม่มีสิทธิ์"
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT id, username, role FROM admins")
    admins = c.fetchall()
    conn.close()
    return render_template('admin.html', admins=admins, super_admin=is_super_admin())

@app.route('/add_admin', methods=['POST'])
def add_admin():
    if not is_super_admin():
        return jsonify({'status':'error','message':'คุณไม่มีสิทธิ์'}),403
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'status':'error','message':'กรอกข้อมูลให้ครบ'}),400
    hashed = generate_password_hash(password)
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute("INSERT INTO admins (username, password, role) VALUES (?, ?, 'admin')", (username, hashed))
        conn.commit()
        conn.close()
        return jsonify({'status':'ok'})
    except sqlite3.IntegrityError:
        return jsonify({'status':'error','message':'ชื่อผู้ใช้นี้มีอยู่แล้ว'}),400

@app.route('/edit_admin/<int:admin_id>', methods=['POST'])
def edit_admin(admin_id):
    data = request.json
    password = data.get('password')
    if not password:
        return jsonify({'status':'error','message':'กรอกรหัสผ่านใหม่'}),400
    if not is_super_admin() and session['admin_id'] != admin_id:
        return jsonify({'status':'error','message':'คุณไม่มีสิทธิ์'}),403
    hashed = generate_password_hash(password)
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("UPDATE admins SET password=? WHERE id=?", (hashed, admin_id))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

@app.route('/delete_admin/<int:admin_id>', methods=['DELETE'])
def delete_admin(admin_id):
    if not is_super_admin():
        return jsonify({'status':'error','message':'คุณไม่มีสิทธิ์'}),403
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM admins WHERE id=?", (admin_id,))
    conn.commit()
    conn.close()
    return jsonify({'status':'ok'})

# ======== Run ========
if __name__ == "__main__":
    app.run(debug=True)
