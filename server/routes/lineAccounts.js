const express = require('express');
const { LineAccount, Customer, ChatMessage } = require('../models/database');
const router = express.Router();

// Get all LINE OA accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await LineAccount.getAll();
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Error fetching LINE accounts:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี LINE OA' });
  }
});

// Create new LINE OA account
router.post('/accounts', async (req, res) => {
  try {
    const { name, channel_id, channel_secret, access_token } = req.body;
    
    if (!name || !channel_id || !channel_secret || !access_token) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' 
      });
    }

    // Check if channel_id already exists
    const existingAccount = await LineAccount.getByChannelId(channel_id);
    if (existingAccount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Channel ID นี้มีอยู่ในระบบแล้ว' 
      });
    }

    const newAccount = await LineAccount.create({
      name,
      channel_id,
      channel_secret,
      access_token
    });

    res.json({ 
      success: true, 
      message: 'เพิ่มบัญชี LINE OA สำเร็จ', 
      data: newAccount 
    });
  } catch (error) {
    console.error('Error creating LINE account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเพิ่มบัญชี LINE OA' 
    });
  }
});

// Update LINE OA account
router.put('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, channel_secret, access_token } = req.body;

    if (!name || !channel_secret || !access_token) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' 
      });
    }

    const updatedAccount = await LineAccount.update(id, {
      name,
      channel_secret,
      access_token
    });

    if (!updatedAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบบัญชี LINE OA ที่ต้องการแก้ไข' 
      });
    }

    res.json({ 
      success: true, 
      message: 'แก้ไขบัญชี LINE OA สำเร็จ', 
      data: updatedAccount 
    });
  } catch (error) {
    console.error('Error updating LINE account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการแก้ไขบัญชี LINE OA' 
    });
  }
});

// Delete LINE OA account
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAccount = await LineAccount.delete(id);

    if (!deletedAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบบัญชี LINE OA ที่ต้องการลบ' 
      });
    }

    res.json({ 
      success: true, 
      message: 'ลบบัญชี LINE OA สำเร็จ', 
      data: deletedAccount 
    });
  } catch (error) {
    console.error('Error deleting LINE account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการลบบัญชี LINE OA' 
    });
  }
});

// Test LINE OA connection
router.post('/test-connection', async (req, res) => {
  try {
    const { channel_id, channel_secret, access_token } = req.body;

    // Test LINE API connection by getting profile
    const lineApi = require('@line/bot-sdk');
    const client = new lineApi.Client({
      channelAccessToken: access_token,
      channelSecret: channel_secret
    });

    // Try to get bot info to test connection
    const botInfo = await client.getBotInfo();
    
    res.json({ 
      success: true, 
      message: 'การเชื่อมต่อสำเร็จ',
      data: {
        botId: botInfo.userId,
        displayName: botInfo.displayName,
        pictureUrl: botInfo.pictureUrl
      }
    });
  } catch (error) {
    console.error('LINE connection test failed:', error);
    res.status(400).json({ 
      success: false, 
      message: 'การเชื่อมต่อล้มเหลว: ' + error.message 
    });
  }
});

module.exports = router;