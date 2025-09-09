import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';
import crypto from 'node:crypto';

const app = new Hono();

// CORS และ logger
app.use('*', cors({
  origin: '*',
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Line credentials
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');

// ตรวจสอบและแสดงสถานะของ Line credentials
console.log('🔧 Line Configuration Status:');
console.log('  - Access Token:', LINE_CHANNEL_ACCESS_TOKEN ? `✅ Configured (${LINE_CHANNEL_ACCESS_TOKEN.length} chars)` : '❌ Not configured');
console.log('  - Channel Secret:', LINE_CHANNEL_SECRET ? `✅ Configured (${LINE_CHANNEL_SECRET.length} chars)` : '❌ Not configured');

if (!LINE_CHANNEL_ACCESS_TOKEN) {
  console.log('⚠️ WARNING: LINE_CHANNEL_ACCESS_TOKEN is not configured. Line messaging will not work.');
}

if (!LINE_CHANNEL_SECRET) {
  console.log('⚠️ WARNING: LINE_CHANNEL_SECRET is not configured. Webhook signature verification is disabled.');
}

// ฟังก์ชันบันทึก logs
async function saveLog(level: string, message: string, details?: any) {
  try {
    const logId = `log:${Date.now()}`;
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details ? JSON.stringify(details) : null
    };
    await kv.set(logId, logData);
    
    // เก็บเฉพาะ 100 logs ล่าสุด
    const allLogs = await kv.getByPrefix('log:');
    if (allLogs.length > 100) {
      const oldestLogs = allLogs
        .sort((a, b) => a.key.localeCompare(b.key))
        .slice(0, allLogs.length - 100);
      
      for (const log of oldestLogs) {
        await kv.del(log.key);
      }
    }
  } catch (error) {
    console.error('Failed to save log:', error);
  }
}

// ตรวจสอบ Line webhook signature
function verifyLineSignature(body: string, signature: string): boolean {
  if (!LINE_CHANNEL_SECRET) return false;
  
  const hash = crypto
    .createHmac('sha256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  
  return signature === hash;
}

// ส่งข้อความผ่าน Line API
async function sendLineMessage(replyToken: string, message: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    const error = 'LINE_CHANNEL_ACCESS_TOKEN not configured';
    console.error('❌', error);
    await saveLog('error', error);
    throw new Error(error);
  }

  console.log('📤 Sending Line message:', { replyToken, message });
  console.log('🔑 Using access token (first 10 chars):', LINE_CHANNEL_ACCESS_TOKEN.substring(0, 10) + '...');
  
  const payload = {
    replyToken,
    messages: [{ type: 'text', text: message }],
  };
  
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  console.log('📥 Line API response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    const error = `Line API error: ${response.status} - ${errorBody}`;
    console.error('❌ Line API Error:', error);
    await saveLog('error', 'Line API error', {
      status: response.status,
      body: errorBody,
      payload: payload,
      accessTokenProvided: !!LINE_CHANNEL_ACCESS_TOKEN,
      tokenLength: LINE_CHANNEL_ACCESS_TOKEN?.length
    });
    throw new Error(error);
  }

  const result = await response.json();
  console.log('✅ Line message sent successfully:', result);
  return result;
}

// ส่งข้อความใหม่ (push message)
async function pushLineMessage(userId: string, message: string) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    const error = 'LINE_CHANNEL_ACCESS_TOKEN not configured';
    console.error('❌', error);
    await saveLog('error', error);
    throw new Error(error);
  }

  console.log('📤 Pushing Line message:', { userId, message });
  console.log('🔑 Using access token (first 10 chars):', LINE_CHANNEL_ACCESS_TOKEN.substring(0, 10) + '...');
  
  const payload = {
    to: userId,
    messages: [{ type: 'text', text: message }],
  };
  
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  console.log('📥 Line API push response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    const error = `Line API error: ${response.status} - ${errorBody}`;
    console.error('❌ Line API Push Error:', error);
    await saveLog('error', 'Line API push error', {
      status: response.status,
      body: errorBody,
      payload: payload,
      accessTokenProvided: !!LINE_CHANNEL_ACCESS_TOKEN,
      tokenLength: LINE_CHANNEL_ACCESS_TOKEN?.length
    });
    throw new Error(error);
  }

  const result = await response.json();
  console.log('✅ Line push message sent successfully:', result);
  return result;
}

// บันทึกข้อความในฐานข้อมูล
async function saveMessage(data: any) {
  const messageId = Date.now().toString();
  
  // สร้างข้อมูลข้อความ
  const messageData = {
    id: messageId,
    userId: data.userId,
    userName: data.userName || 'ลูกค้า',
    message: data.message,
    type: data.type || 'text',
    timestamp: new Date().toISOString(),
    isFromCustomer: data.isFromCustomer || true,
    adminId: data.adminId || null,
    caseStatus: data.caseStatus || 'pending',
  };

  // เก็บข้อความ
  await kv.set(`message:${messageId}`, messageData);
  
  // อัปเดตรายการข้อความของลูกค้า
  const userMessagesKey = `user_messages:${data.userId}`;
  const existingMessages = await kv.get(userMessagesKey) || [];
  existingMessages.push(messageId);
  await kv.set(userMessagesKey, existingMessages);

  // เก็บข้อมูลลูกค้า
  const customerData = {
    userId: data.userId,
    name: data.userName || 'ลูกค้า',
    lastMessage: data.message,
    lastMessageTime: new Date().toISOString(),
    caseStatus: 'pending',
    notes: data.notes || '',
  };
  
  await kv.set(`customer:${data.userId}`, customerData);

  return messageData;
}

// Handle OPTIONS request for CORS
app.options('/make-server-ae50d4c0/webhook/line', (c) => {
  return new Response(null, { status: 200 });
});

// Route: Webhook จาก Line
app.post('/make-server-ae50d4c0/webhook/line', async (c) => {
  console.log('🔥 Webhook called!');
  await saveLog('info', 'Webhook endpoint called');
  
  try {
    const body = await c.req.text();
    const signature = c.req.header('x-line-signature') || '';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const contentType = c.req.header('content-type') || 'unknown';
    
    console.log('📨 Webhook body length:', body.length);
    console.log('🔐 Has signature:', !!signature);
    console.log('🌐 User agent:', userAgent);
    console.log('📄 Content type:', contentType);
    
    await saveLog('info', 'Webhook received', { 
      bodyLength: body.length,
      hasSignature: !!signature,
      userAgent: userAgent,
      contentType: contentType,
      method: c.req.method,
      url: c.req.url
    });

    // เปิดการตรวจสอบ signature เพื่อความปลอดภัย
    if (!verifyLineSignature(body, signature)) {
      console.log('❌ Invalid signature');
      await saveLog('error', 'Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 400);
    }

    if (!body) {
      console.log('❌ Empty body received');
      await saveLog('error', 'Empty webhook body received');
      return c.json({ error: 'Empty body' }, 400);
    }

    const data = JSON.parse(body);
    console.log('✅ Line webhook data:', JSON.stringify(data, null, 2));
    await saveLog('info', 'Webhook data parsed successfully', data);

    if (!data.events || data.events.length === 0) {
      console.log('⚠️ No events in webhook data');
      await saveLog('warning', 'No events in webhook data');
      return c.json({ status: 'no events' });
    }

    await saveLog('info', `Processing ${data.events.length} events`);

    for (const event of data.events) {
      console.log('📥 Processing event:', JSON.stringify(event, null, 2));
      await saveLog('info', 'Processing event', { type: event.type, source: event.source });
      
      if (event.type === 'message' && event.message.type === 'text') {
        console.log('💬 Text message received from:', event.source.userId);
        console.log('📝 Message content:', event.message.text);
        await saveLog('info', 'Text message received', {
          userId: event.source.userId,
          message: event.message.text
        });
        
        // บันทึกข้อความจากลูกค้า
        const messageData = await saveMessage({
          userId: event.source.userId,
          userName: 'ลูกค้า Line',
          message: event.message.text,
          type: 'text',
          isFromCustomer: true,
        });

        console.log('✅ Message saved:', messageData);
        await saveLog('info', 'Message saved to database', { messageId: messageData.id });

        // ส่ง auto reply กลับไปยังผู้ใช้
        try {
          await sendLineMessage(event.replyToken, 'ขอบคุณที่ติดต่อเข้ามา ทีมงานจะตอบกลับโดยเร็วที่สุด');
          console.log('✅ Auto reply sent');
          await saveLog('info', 'Auto reply sent');
        } catch (err) {
          console.error('❌ Failed to send auto reply:', err);
          await saveLog('error', 'Failed to send auto reply', { error: err.message });
        }
      } else {
        console.log('ℹ️ Event type not handled:', event.type);
        await saveLog('info', `Event type not handled: ${event.type}`);
      }
    }

    await saveLog('info', `Webhook processed successfully. Events: ${data.events.length}`);
    return c.json({ status: 'success', processed: data.events.length });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', error.stack);
    await saveLog('error', 'Webhook processing failed', {
      error: error.message,
      stack: error.stack
    });
    return c.json({ 
      error: 'Internal server error', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Route: ส่งข้อความไปยังลูกค้า
app.post('/make-server-ae50d4c0/send-message', async (c) => {
  try {
    const { userId, message, adminId, adminName } = await c.req.json();

    if (!userId || !message) {
      return c.json({ error: 'userId and message are required' }, 400);
    }

    // ส่งข้อความผ่าน Line
    await pushLineMessage(userId, message);

    // บันทึกข้อความในฐานข้อมูล
    const messageData = await saveMessage({
      userId,
      userName: adminName || 'แอดมิน',
      message,
      type: 'text',
      isFromCustomer: false,
      adminId,
    });

    console.log('Message sent and saved:', messageData);

    return c.json({ status: 'success', messageData });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Route: ดึงข้อความทั้งหมดของลูกค้า
app.get('/make-server-ae50d4c0/messages/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const userMessagesKey = `user_messages:${userId}`;
    
    const messageIds = await kv.get(userMessagesKey) || [];
    const messages = [];

    for (const messageId of messageIds) {
      const message = await kv.get(`message:${messageId}`);
      if (message) {
        messages.push(message);
      }
    }

    // เรียงตามเวลา
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return c.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Route: ดึงรายชื่อลูกค้าทั้งหมด
app.get('/make-server-ae50d4c0/customers', async (c) => {
  try {
    console.log('🔍 Fetching customers from KV store...');
    const customerKeys = await kv.getByPrefix('customer:');
    console.log(`📋 Found ${customerKeys.length} customer entries`);
    
    // กรองและทำความสะอาดข้อมูล
    const customers = customerKeys
      .filter(item => item && item.value) // กรองข้อมูลที่เป็น null
      .map(item => {
        const customer = item.value;
        
        // ตรวจสอบและกำหนดค่าเริ่มต้น
        const cleanCustomer = {
          userId: customer.userId || '',
          name: customer.name || customer.displayName || `ลูกค้า ${(customer.userId || '').substring(0, 8)}`,
          displayName: customer.displayName || customer.name || '',
          lastMessage: customer.lastMessage || 'ไม่มีข้อความ',
          lastMessageTime: customer.lastMessageTime || new Date().toISOString(),
          caseStatus: customer.caseStatus || 'pending',
          status: customer.status || customer.caseStatus || 'pending',
          notes: customer.notes || '',
          adminId: customer.adminId || null,
          adminName: customer.adminName || '',
          avatar: customer.avatar || customer.pictureUrl || null,
          pictureUrl: customer.pictureUrl || customer.avatar || null,
          unreadCount: customer.unreadCount || 0,
          lineOAId: customer.lineOAId || 'default',
          lineOAName: customer.lineOAName || 'Line Official Account'
        };
        
        console.log(`👤 Customer: ${cleanCustomer.name}, Status: ${cleanCustomer.caseStatus}, UserId: ${cleanCustomer.userId}`);
        return cleanCustomer;
      });
    
    // เรียงตามเวลาข้อความล่าสุด
    customers.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return timeB - timeA;
    });

    console.log(`✅ Returning ${customers.length} cleaned customers`);
    return c.json({ customers });
  } catch (error) {
    console.error('❌ Get customers error:', error);
    return c.json({ 
      error: 'Failed to get customers', 
      details: error.message,
      customers: [] // Return empty array as fallback
    }, 500);
  }
});

// Route: อัปเดตสถานะเคส
app.put('/make-server-ae50d4c0/customer/:userId/status', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { status, adminId, adminName } = await c.req.json();

    const customer = await kv.get(`customer:${userId}`);
    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const updatedCustomer = {
      ...customer,
      caseStatus: status,
      adminId,
      adminName,
      statusUpdatedAt: new Date().toISOString(),
    };

    await kv.set(`customer:${userId}`, updatedCustomer);

    return c.json({ status: 'success', customer: updatedCustomer });
  } catch (error) {
    console.error('Update status error:', error);
    return c.json({ error: 'Failed to update status' }, 500);
  }
});

// Route: อัปเดตข้อมูลลูกค้า
app.put('/make-server-ae50d4c0/customer/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const updates = await c.req.json();

    const customer = await kv.get(`customer:${userId}`);
    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const updatedCustomer = { ...customer, ...updates };
    await kv.set(`customer:${userId}`, updatedCustomer);

    return c.json({ status: 'success', customer: updatedCustomer });
  } catch (error) {
    console.error('Update customer error:', error);
    return c.json({ error: 'Failed to update customer' }, 500);
  }
});

// Route: Server-Sent Events สำหรับ real-time updates
app.get('/make-server-ae50d4c0/events', (c) => {
  return new Response(
    new ReadableStream({
      start(controller) {
        // ส่งข้อมูล heartbeat ทุก 30 วินาที
        const heartbeat = setInterval(() => {
          controller.enqueue(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`);
        }, 30000);

        // ส่งข้อมูลเริ่มต้น
        controller.enqueue(`data: {"type":"connected","timestamp":"${new Date().toISOString()}"}\n\n`);

        // ทำความสะอาดเมื่อ connection ปิด
        return () => {
          clearInterval(heartbeat);
        };
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
});

// Health check
app.get('/make-server-ae50d4c0/health', async (c) => {
  console.log('🏥 Health check requested');
  await saveLog('info', 'Health check requested');
  
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    lineConfigured: !!(LINE_CHANNEL_ACCESS_TOKEN && LINE_CHANNEL_SECRET),
    environment: {
      hasAccessToken: !!LINE_CHANNEL_ACCESS_TOKEN,
      hasSecret: !!LINE_CHANNEL_SECRET,
      accessTokenLength: LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
      secretLength: LINE_CHANNEL_SECRET?.length || 0
    },
    server: {
      platform: Deno.build.os,
      version: Deno.version.deno
    }
  });
});

// Simple test endpoint
app.get('/make-server-ae50d4c0/test', async (c) => {
  console.log('🧪 Test endpoint called');
  await saveLog('info', 'Test endpoint called');
  
  return c.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    echo: c.req.query('message') || 'No message provided'
  });
});

// Test Line API endpoint with custom token support
app.post('/make-server-ae50d4c0/test-line', async (c) => {
  console.log('🧪 Test Line API endpoint called');
  await saveLog('info', 'Test Line API endpoint called');
  
  try {
    const { userId, message, testAccessToken } = await c.req.json();
    
    if (!userId || !message) {
      return c.json({ 
        error: 'userId and message are required',
        example: { userId: 'U1234567890abcdef...', message: 'Hello from admin' },
        help: 'กรุณาระบุ userId (Line User ID) และ message (ข้อความที่ต้องการส่ง)'
      }, 400);
    }

    // Use test token if provided, otherwise use environment token
    const tokenToUse = testAccessToken || LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!tokenToUse) {
      return c.json({ 
        error: 'No LINE_CHANNEL_ACCESS_TOKEN provided or configured',
        status: 'configuration_error',
        help: 'กรุณาตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ใน environment variables หรือส่ง testAccessToken มาใน request',
        solution: 'ไปที่ Line Developers Console → Channel → Messaging API → Channel access token'
      }, 400);
    }

    // ตรวจสอบรูปแบบ token (ควรเริ่มต้น��้วย + และมีความยาวประมาณ 180+ ตัวอักษร)
    if (!tokenToUse.startsWith('+') || tokenToUse.length < 50) {
      return c.json({
        error: 'Invalid LINE_CHANNEL_ACCESS_TOKEN format',
        status: 'invalid_token_format',
        help: 'Token ควรเริ่มต้นด้วย + และมีความยาวประมาณ 180+ ตัวอักษร',
        tokenInfo: {
          startsWithPlus: tokenToUse.startsWith('+'),
          length: tokenToUse.length,
          firstChars: tokenToUse.substring(0, 5) + '...'
        }
      }, 400);
    }

    console.log('🧪 Testing Line push message to:', userId);
    console.log('🔑 Token info:', {
      length: tokenToUse.length,
      startsWithPlus: tokenToUse.startsWith('+'),
      firstChars: tokenToUse.substring(0, 10) + '...'
    });
    
    const payload = {
      to: userId,
      messages: [{ type: 'text', text: message }],
    };
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenToUse}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 Line API test response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      const error = `Line API error: ${response.status} - ${errorBody}`;
      console.error('❌ Line API Test Error:', error);
      
      let errorDetails = {
        status: response.status,
        body: errorBody,
        payload: payload,
        tokenProvided: !!tokenToUse,
        tokenLength: tokenToUse?.length,
        isTestToken: !!testAccessToken
      };

      await saveLog('error', 'Line API test error', errorDetails);
      
      // ให้คำแนะนำเฉพาะสำหรับ error แต่ละประเภท
      let helpMessage = '';
      let solution = '';
      
      if (response.status === 401) {
        helpMessage = 'Authentication failed: Token ไม่ถูกต้องหรือหมดอายุ';
        solution = '1. ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN ใน environment variables\n2. สร้าง token ใหม่ใน Line Developers Console\n3. ตรวจสอบว่าใช้ "Channel Access Token (Long-lived)" ไม่ใช่ "Short-lived"';
      } else if (response.status === 400) {
        helpMessage = 'Bad Request: รูปแบบข้อมูลไม่ถูกต้อง';
        solution = 'ตรวจสอบ userId (ต้องเป็น Line User ID ที่ถูกต้อง) และรูปแบบข้อความ';
      } else if (response.status === 403) {
        helpMessage = 'Forbidden: ไม่มีสิทธิ์ในการส่งข้อความ';
        solution = 'ตรวจสอบว่า Bot เปิดใช้งานแล้วและ user ได้ add Bot เป็นเพื่อนแล้ว';
      }
      
      return c.json({ 
        error: 'Test failed',
        details: error,
        status: response.status,
        help: helpMessage,
        solution: solution,
        timestamp: new Date().toISOString(),
        troubleshooting: {
          tokenLength: tokenToUse.length,
          tokenFormat: tokenToUse.startsWith('+') ? 'ถูกต้อง' : 'ไม่ถูกต้อง (ควรเริ่มต้นด้วย +)',
          isTestToken: !!testAccessToken,
          lineApiResponse: errorBody
        }
      }, response.status);
    }

    const result = await response.json();
    console.log('✅ Test Line message sent successfully:', result);
    await saveLog('info', 'Test Line message sent successfully', { userId, message, isTestToken: !!testAccessToken });
    
    return c.json({ 
      status: 'success',
      message: 'Test message sent successfully! ส่งข้อความทดสอบสำเร็จ',
      sentTo: userId,
      sentMessage: message,
      timestamp: new Date().toISOString(),
      tokenInfo: {
        length: tokenToUse.length,
        format: tokenToUse.startsWith('+') ? 'Valid' : 'Invalid',
        isTestToken: !!testAccessToken
      },
      response: result
    });
  } catch (error) {
    console.error('❌ Test Line API error:', error);
    await saveLog('error', 'Test Line API failed', { error: error.message });
    
    return c.json({ 
      error: 'Test failed',
      details: error.message,
      help: 'เกิดข้อผิดพลาดระหว่างการส่งข้อความ',
      solution: 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและ Line API status',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Route: ดู logs (สำหรับ debug)
app.get('/make-server-ae50d4c0/logs', async (c) => {
  try {
    console.log('📋 Fetching logs...');
    const logs = await kv.getByPrefix('log:') || [];
    console.log(`📋 Found ${logs.length} log entries`);
    
    const sortedLogs = logs
      .filter(item => item && item.value) // Filter out null/undefined items
      .map(item => item.value)
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 100); // Increase to 100 logs
    
    console.log(`📋 Returning ${sortedLogs.length} sorted logs`);
    return c.json({ 
      logs: sortedLogs,
      total: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get logs error:', error);
    await saveLog('error', 'Failed to retrieve logs', { error: error.message });
    return c.json({ 
      error: 'Failed to get logs', 
      details: error.message,
      logs: [] // Return empty array as fallback
    }, 500);
  }
});

// เริ่มต้น server
Deno.serve(app.fetch);