var socket = io();

socket.on('new_message', data=>{
    let chat = document.getElementById('chat-'+data.case_id);
    let p = document.createElement('p');
    p.innerHTML = `<strong>${data.from}:</strong> ${data.message}`;
    chat.appendChild(p);
});

socket.on('note_updated', data=>{
    let span = document.querySelector('#case-'+data.case_id+' .note');
    let textarea = document.querySelector('#case-'+data.case_id+' .note-input');
    span.textContent = data.note;
    textarea.value = data.note;
});

function sendMessage(case_id){
    let input = document.querySelector('#case-'+case_id+' .msg-input');
    let msg = input.value;
    if(!msg) return;
    socket.emit('send_message',{case_id:case_id,message:msg});
    input.value = '';
}

function assignCase(case_id){
    fetch(`/assign_case/${case_id}`,{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:'admin=Admin1'
    }).then(r=>r.json()).then(data=>{
        document.querySelector('#case-'+case_id+' .admin').textContent = data.admin;
    });
}

function updateNote(case_id){
    let note = document.querySelector('#case-'+case_id+' .note-input').value;
    fetch(`/update_note/${case_id}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({note:note})
    });
}
