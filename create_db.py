import sqlite3
from werkzeug.security import generate_password_hash

DATABASE = "line_data.db"
conn = sqlite3.connect(DATABASE)
c = conn.cursor()

# สร้างตาราง
c.execute('''CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'admin'
            )''')
c.execute('''CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_name TEXT,
                channel_token TEXT
            )''')
c.execute('''CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER,
                template TEXT
            )''')
c.execute('''CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER,
                user_id TEXT,
                message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')

# เพิ่ม Super Admin
hashed = generate_password_hash("123456")
c.execute("INSERT OR IGNORE INTO admins (username, password, role) VALUES (?, ?, 'super')",
          ("kingadmin", hashed))

# เพิ่ม LINE Account ตัวอย่าง
c.execute("INSERT OR IGNORE INTO accounts (account_name, channel_token) VALUES (?, ?)",
          ("TestLINE", ""))  # ใส่ Channel Token จริงเอง

# เพิ่ม Template ตัวอย่าง
c.execute("INSERT OR IGNORE INTO templates (account_id, template) VALUES (?, ?)", (1,"ขอบคุณที่ติดต่อเรา"))
c.execute("INSERT OR IGNORE INTO templates (account_id, template) VALUES (?, ?)", (1,"รอสักครู่เจ้าหน้าที่จะตอบกลับ"))

# เพิ่ม Messages ตัวอย่าง
c.execute("INSERT OR IGNORE INTO messages (account_id, user_id, message) VALUES (?,?,?)",
          (1,"U1234567890","สวัสดีค่ะ"))

conn.commit()
conn.close()
print("สร้างตัวอย่าง line_data.db เรียบร้อย")
