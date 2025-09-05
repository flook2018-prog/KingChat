const socket = io();
let current_case = null;

function renderCases(){
    const container = document.getElementById('case_list');
    container.innerHTML = '';
    for(const id in cases){
        const c = cases[id];
        const div = document.createElement('div');
        div.className='case-item';
        div.innerHTML=`${id} ${c.admin?'<span class="assigned">'+c.admin+'</span>':''}`;
        div.onclick=()=>selectCase(id);
        container.appendChild(div);
    }
}

function selectCase(id){
    current_case=id;
    renderMessages();
    renderCustomer();
}

function renderMessages(){
    const container=document.getElementById('chat_messages');
    container.innerHTML='';
    if(!current_case) return;
    for(const msg of cases[current_case].messages){
        const div=document.createElement('div');
        div.className=msg.sender==='admin'?'message-right':'message-left';
        if(msg.type==='image'){
            const img=document.createElement('img'); img.src=msg.text; img.width=120;
            div.appendChild(img);
        } else if(msg.type==='sticker'){
            div.textContent='[Sticker] '+msg.text;
        } else div.textContent=msg.text;
        container.appendChild(div);
    }
    container.scrollTop=container.scrollHeight;
}

function renderCustomer(){
    if(!current_case) return;
    const user_id=cases[current_case].user_id;
    const c=customers[user_id];
    const container=document.getElementById('customer_detail');
    container.innerHTML=`<img src="${c.profile_pic}" width="80"><br>ชื่อ: ${c.name}<br>ยูส: ${user_id}<br>หมายเหตุ: ${c.note}`;
}

function sendMessage(type){
    if(!current_case) return;
    let content='';
    if(type==='text') content=document.getElementById('message_text').value;
    else if(type==='image') content=document.getElementById('message_file').files[0]?URL.createObjectURL(document.getElementById('message_file').files[0]):'';
    else content=prompt('ใส่สติ๊กเกอร์ id');
    socket.emit('send_message',{case_id:current_case,sender:'admin',type:type,text:content});
    if(type==='text') document.getElementById('message_text').value='';
}

socket.on('new_message',data=>{
    if(current_case===data.case_id){
        const container=document.getElementById('chat_messages');
        const div=document.createElement('div');
        div.className=data.sender==='admin'?'message-right':'message-left';
        if(data.type==='image'){
            const img=document.createElement('img'); img.src=data.text; img.width=120; div.appendChild(img);
        } else if(data.type==='sticker') div.textContent='[Sticker] '+data.text;
        else div.textContent=data.text;
        container.appendChild(div);
        container.scrollTop=container.scrollHeight;
    }
});

renderCases();
