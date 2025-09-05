from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import json, os, uuid
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
socketio = SocketIO(app, cors_allowed_origins="*")

# ---------------------------
# Line OA settings
# ---------------------------
LINE_SETTINGS_FILE = "line_settings.json"
if os.path.exists(LINE_SETTINGS_FILE):
    with open(LINE_SETTINGS_FILE,"r") as f:
        line_settings = json.load(f)
else:
    line_settings = {"virtual_id":"","virtual_link":"","status":"ยังไม่เชื่อมต่อ"}

# ---------------------------
# Admin profiles
# ---------------------------
ADMIN_FILE = "admin_profiles.json"
if os.path.exists(ADMIN_FILE):
    with open(ADMIN_FILE,"r") as f:
        admins = json.load(f)
else:
    admins = {}  # key: admin_name, value: {name, profile_pic}

# ---------------------------
# Customers and cases
# ---------------------------
customers = {}  # key: user_id, value: {name, profile_pic, note}
cases = {}      # key: case_id, value: {user_id, admin, messages:[{sender,text,type,content}]}

# ---------------------------
# Patterns
# ---------------------------
patterns = {}   # key: pattern_id, value: {title, content, images:[]}

# ---------------------------
# Routes
# ---------------------------

@app.route('/')
def index():
    return render_template('index.html', customers=customers, cases=cases)

@app.route('/settings')
def settings_page():
    return render_template('settings.html', settings=line_settings)

@app.route('/save_settings', methods=['POST'])
def save_settings():
    data = request.json
    line_settings["virtual_id"] = data.get("virtual_id","")
    line_settings["virtual_link"] = data.get("virtual_link","")
    line_settings["status"] = "เชื่อมต่อแล้ว" if line_settings["virtual_id"] and line_settings["virtual_link"] else "ยังไม่เชื่อมต่อ"
    with open(LINE_SETTINGS_FILE,"w") as f:
        json.dump(line_settings,f)
    return jsonify({"success":True,"settings":line_settings})

# ---------------------------
# Admin profile
# ---------------------------
@app.route('/admin_profile/<admin_name>')
def admin_profile(admin_name):
    profile = admins.get(admin_name, {"name":admin_name,"profile_pic":""})
    return render_template('admin_profile.html', profile=profile, admin_name=admin_name)

@app.route('/update_admin', methods=['POST'])
def update_admin():
    admin_name = request.form['admin_name']
    name = request.form['name']
    file = request.files.get('profile_pic')
    profile_pic = admins.get(admin_name, {}).get('profile_pic', '')
    if file:
        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        profile_pic = f"/uploads/{filename}"
    admins[admin_name] = {"name":name,"profile_pic":profile_pic}
    with open(ADMIN_FILE,"w") as f:
        json.dump(admins,f)
    return jsonify({"success":True,"profile_pic":profile_pic})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ---------------------------
# Cases
# ---------------------------
@app.route('/add_case', methods=['POST'])
def add_case():
    data = request.json
    case_id = data["case_id"]
    user_id = data["user_id"]
    cases[case_id] = {"user_id":user_id,"admin":None,"messages":[]}
    return jsonify({"success":True})

@app.route('/assign_case', methods=['POST'])
def assign_case():
    data = request.json
    case_id = data["case_id"]
    admin_name = data["admin"]
    if case_id in cases:
        cases[case_id]["admin"] = admin_name
        socketio.emit('update_case', cases[case_id], broadcast=True)
        return jsonify({"success":True})
    return jsonify({"success":False})

# ---------------------------
# Customers
# ---------------------------
@app.route('/add_customer', methods=['POST'])
def add_customer():
    data = request.json
    user_id = data["user_id"]
    customers[user_id] = {
        "name":data.get("name"),
        "profile_pic":data.get("profile_pic"),
        "note":data.get("note")
    }
    return jsonify({"success":True})

# ---------------------------
# Patterns
# ---------------------------
@app.route('/patterns')
def patterns_page():
    return render_template('patterns.html', patterns=patterns)

@app.route('/add_pattern', methods=['POST'])
def add_pattern():
    title = request.form['title']
    content = request.form['content']
    files = request.files.getlist('images')
    imgs = []
    for file in files:
        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        imgs.append(f"/uploads/{filename}")
    pattern_id = uuid.uuid4().hex
    patterns[pattern_id] = {"title":title,"content":content,"images":imgs}
    return jsonify({"success":True, "pattern_id":pattern_id})

# ---------------------------
# Chat realtime
# ---------------------------
@socketio.on('send_message')
def handle_send_message(data):
    case_id = data['case_id']
    sender = data['sender']
    text = data.get('text','')
    msg_type = data.get('type','text')  # text / image / sticker
    content = data.get('content', text)
    if case_id in cases:
        cases[case_id]['messages'].append({'sender':sender,'type':msg_type,'text':content})
        emit('new_message', {'case_id':case_id,'sender':sender,'type':msg_type,'text':content}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
