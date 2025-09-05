const socket = io();

let currentClient = null;

// เลือกลูกค้า
document.querySelectorAll('.client-item').forEach(el=>{
    el.addEventListener('click', ()=>{
        currentClient = el.dataset.id;
        socket.emit('join_client', {client_id: currentClient});
        document.getElementById('profile-info').innerHTML = `
            <p>ชื่อ: ${el.innerText}</p>
            <p>ยูส: ${currentClient}</p>
            <p>หมายเหตุ: ${clients[currentClient]?.notes || '-'}</p>
        `;
    });
});

// รับข้อความ
socket.on('receive_message', msg=>{
    if(!currentClient) return;
    const messagesDiv = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.className = msg.from === 'admin' ? 'msg admin' : 'msg client';
    el.innerText = msg.text;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// โหลดข้อความย้อนหลัง
socket.on('load_messages', msgs=>{
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML = '';
    msgs.forEach(msg=>{
        const el = document.createElement('div');
        el.className = msg.from === 'admin' ? 'msg admin' : 'msg client';
        el.innerText = msg.text;
        messagesDiv.appendChild(el);
    });
});

// ส่งข้อความ
document.getElementById('send-btn').addEventListener('click', ()=>{
    const input = document.getElementById('chat-input');
    if(!input.value || !currentClient) return;
    socket.emit('send_message',{
        client_id: currentClient,
        from: 'admin',
        text: input.value
    });
    input.value = '';
});
