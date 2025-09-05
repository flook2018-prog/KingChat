const socket = io();

const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const toggleTheme = document.getElementById("toggle-theme");

// Dark Mode Toggle
toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleTheme.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Send message
sendBtn.addEventListener("click", () => {
    const msg = input.value.trim();
    if(!msg) return;
    socket.emit("chat-message", msg);
    addMessage(msg, "admin");
    input.value = "";
});

socket.on("chat-message", data => addMessage(data.message, "client"));

function addMessage(msg, sender){
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.innerText = msg;
    div.style.opacity = 0;
    chatMessages.appendChild(div);
    div.animate([{opacity:0},{opacity:1}], {duration:300, fill:"forwards"});
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Optional: handle client selection
document.querySelectorAll(".client-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".client-item").forEach(i=>i.style.background="");
        item.style.background="#4a90e2"; item.style.color="#fff";
    });
});
