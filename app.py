<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KingAutoChat Admin</title>
<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
<style>
body{font-family:sans-serif;margin:0;padding:0;background:#f0f2f5;}
.container{display:flex;height:100vh;}
.sidebar{width:300px;background:#fff;border-right:1px solid #ddd;overflow-y:auto;}
.main{flex:1;display:flex;flex-direction:column;}
.chat-header{padding:10px;background:#eee;border-bottom:1px solid #ccc;}
.chat-body{flex:1;padding:10px;overflow-y:auto;background:#fafafa;}
.chat-message{margin:5px 0;padding:8px;border-radius:5px;max-width:60%;}
.chat-message.customer{background:#fff;align-self:flex-start;}
.chat-message.admin{background:#d1f7c4;align-self:flex-end;}
.chat-input{display:flex;padding:10px;border-top:1px solid #ccc;background:#eee;}
.chat-input input{flex:1;padding:8px;}
.chat-input button{padding:8px;}
.case-item{padding:10px;border-bottom:1px solid #ddd;cursor:pointer;}
.case-item.assigned{background:#f0f0f0;}
</style>
</head>
<body>
<div class="container">
    <div class="sidebar">
        <h3>Cases</h3>
        <div id="case-list">
            {% for c in cases %}
            <div class="case-item {% if c.status=='assigned' %}assigned{% endif %}" data-id="{{c.id}}">
                {{c.customer_name}} | {{c.line_oa}} <br> Admin: {{c.admin_name}}
            </div>
            {% endfor %}
        </div>
    </div>
    <div class="main">
        <div class="chat-header">Chat</div>
        <div class="chat-body" id="chat-body"></div>
        <div class="chat-input">
            <input type="text" id="chat-input" placeholder="Type message...">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>
</div>

<script>
const socket = io();
let currentCaseId = null;

function addMessage(sender, text){
    const div = document.createElement('div');
    div.classList.add('chat-message');
    div.classList.add(sender);
    div.textContent = text;
    document.getElementById('chat-body').appendChild(div);
    div.scrollIntoView();
}

document.querySelectorAll('.case-item').forEach(el=>{
    el.addEventListener('click', ()=>{
        currentCaseId = el.getAttribute('data-id');
        fetch('/history/'+currentCaseId).then(r=>r.json()).then(data=>{
            const chatBody = document.getElementById('chat-body');
            chatBody.innerHTML='';
            data.messages.forEach(m=>{
                addMessage(m.sender=='customer'?'customer':'admin', m.message);
            });
        });
        // Assign case to admin
        const adminName = prompt('Enter your admin name:');
        if(adminName){
            fetch('/assign_case',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({case_id:currentCaseId, admin_name:adminName})
            }).then(()=>el.classList.add('assigned'));
        }
    });
});

function sendMessage(){
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text || !currentCaseId) return;
    socket.emit('send_message',{case_id:currentCaseId,sender:'admin',message:text});
    addMessage('admin', text);
    input.value='';
}

socket.on('receive_message', data=>{
    if(data.case_id==currentCaseId && data.sender=='customer'){
        addMessage('customer', data.message);
    }
});
</script>
</body>
</html>
