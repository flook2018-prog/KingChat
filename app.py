from flask import Flask, render_template, request, jsonify, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = 'secret123'
db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Models
class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    line_oa = db.Column(db.String(50))
    status = db.Column(db.String(20))  # unassigned / assigned
    admin = db.Column(db.String(50))
    note = db.Column(db.String(200))
    messages = db.relationship('Message', backref='case', lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('case.id'), nullable=False)
    sender = db.Column(db.String(20))  # customer/admin
    content = db.Column(db.String(500))

class LineOA(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    channel_id = db.Column(db.String(100))
    secret = db.Column(db.String(100))
    access_token = db.Column(db.String(200))

db.create_all()

# Routes
@app.route('/')
def index():
    cases = Case.query.all()
    return render_template('index.html', cases=cases)

@app.route('/assign_case/<int:case_id>', methods=['POST'])
def assign_case(case_id):
    case = Case.query.get(case_id)
    admin_name = request.form.get('admin')
    case.status = "assigned"
    case.admin = admin_name
    db.session.commit()
    return jsonify({'status':'ok','admin':admin_name})

@app.route('/update_note/<int:case_id>', methods=['POST'])
def update_note(case_id):
    case = Case.query.get(case_id)
    data = request.get_json()
    case.note = data.get('note','')
    db.session.commit()
    socketio.emit('note_updated', {'case_id':case_id,'note':case.note}, broadcast=True)
    return jsonify({'status':'ok'})

@app.route('/line_settings', methods=['GET','POST'])
def line_settings():
    if request.method=='POST':
        data = request.form
        name = data.get('name')
        oa = LineOA.query.filter_by(name=name).first()
        if not oa:
            oa = LineOA(name=name)
            db.session.add(oa)
        oa.channel_id = data.get('channel_id')
        oa.secret = data.get('secret')
        oa.access_token = data.get('access_token')
        db.session.commit()
        return redirect('/line_settings')
    oas = LineOA.query.all()
    return render_template('line_settings.html', oas=oas)

@app.route('/line_webhook/<int:oa_id>', methods=['POST'])
def line_webhook(oa_id):
    oa = LineOA.query.get(oa_id)
    if not oa:
        return "OA not found", 404
    data = request.get_json()
    for event in data.get('events',[]):
        if event['type']=='message' and event['message']['type']=='text':
            user_id = event['source'].get('userId')
            msg = event['message']['text']
            case = Case(customer_name=user_id,line_oa=oa.name,status="unassigned")
            db.session.add(case)
            db.session.commit()
            message = Message(case_id=case.id,sender='customer',content=msg)
            db.session.add(message)
            db.session.commit()
            socketio.emit('new_message',{
                'case_id':case.id,
                'message':msg,
                'from':'customer'
            })
    return "ok"

# SocketIO events
@socketio.on('send_message')
def handle_send_message(data):
    case_id = data['case_id']
    msg = data['message']
    message = Message(case_id=case_id,sender='admin',content=msg)
    db.session.add(message)
    db.session.commit()
    emit('new_message',{
        'case_id':case_id,
        'message':msg,
        'from':'admin'
    }, broadcast=True)

if __name__=='__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT',5000)))
