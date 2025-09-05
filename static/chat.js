const socket = io();

const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message');
const usernameInput = document.getElementById('username');

// โหลดข้อความเก่า
fetch('/messages')
    .then(res => res.json())
    .then(data => {
        data.forEach(msg => addMessage(msg.username, msg.message, msg.id));
    });

// รับข้อความใหม่แบบ realtime
socket.on('receive_message', data => {
    addMessage(data.username, data.message, data.id);
});

// ส่งข้อความ
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    const username = usernameInput.value.trim() || 'Anonymous';
    if (message === '') return;
    socket.emit('send_message', {username, message});
    messageInput.value = '';
});

function addMessage(username, message, id) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if(username.toLowerCase() === 'admin') msgDiv.classList.add('admin');
    msgDiv.textContent = `${username}: ${message}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
