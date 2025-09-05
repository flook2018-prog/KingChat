require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const line = require('@line/bot-sdk');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(express.static('public'));

// โหลด LINE OA accounts จาก config.json
let lineAccounts = JSON.parse(fs.readFileSync('./config.json'));

// เก็บข้อความลูกค้า per user
let clients = {}; // {userId:{oaId,name,messages:[]}}

function getClient(oaId,userId){
  if(!clients[userId]){
    const oa = lineAccounts.find(a=>a.id===oaId);
    clients[userId] = {oaId, oaName: oa.name, messages:[]};
  }
  return clients[userId];
}

// สร้าง LINE client per OA
let lineClients = {};
lineAccounts.forEach(oa=>{
  lineClients[oa.id] = new line.Client({
    channelAccessToken: oa.channelAccessToken,
    channelSecret: oa.channelSecret
  });
});

// LINE Webhook per OA
app.post('/webhook/:oaId', async(req,res)=>{
  const oaId = req.params.oaId;
  const events = req.body.events;
  if(!lineClients[oaId]) return res.status(400).send('OA not found');

  await Promise.all(events.map(async(event)=>{
    if(event.type==='message' && event.message.type==='text'){
      const userId = event.source.userId;
      const msg = event.message.text;
      const clientObj = getClient(oaId,userId);
      clientObj.messages.push({sender:'customer', text: msg, userName:'User', oaName: clientObj.oaName});
      io.emit('newMessage',{userId, sender:'customer', text:msg, userName:'User', oaName:clientObj.oaName});
    }
  }));

  res.status(200).send('OK');
});

// WebSocket
io.on('connection', socket=>{
  console.log('Admin connected');

  // ส่งข้อความ Admin ไป LINE
  socket.on('sendMessage', async(data)=>{
    const {userId, text} = data;
    const clientObj = clients[userId];
    if(!clientObj) return;
    try{
      await lineClients[clientObj.oaId].pushMessage(userId,{type:'text',text});
      clientObj.messages.push({sender:'admin', text});
      io.emit('newMessage',{userId, sender:'admin', text, userName:'Admin', oaName:clientObj.oaName});
    }catch(e){console.error(e);}
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
