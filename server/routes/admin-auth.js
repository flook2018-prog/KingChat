const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

// Use direct database connection
const { pool } = require('../models/database');

console.log('✅ Admin auth routes loading with direct PostgreSQL connection');

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
      });
    }

    console.log('🔐 Admin login attempt for:', username);

    // Query admin from database
    const result = await pool.query(
      'SELECT id, username, password, role, status FROM admins WHERE username = $1 AND status = $2',
      [username, 'active']
    );

    if (result.rows.length === 0) {
      console.log('❌ Admin not found:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    const admin = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      console.log('❌ Invalid password for admin:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    // Update last login
    await pool.query(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ Admin login successful:', username);

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ',
      details: error.message 
    });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบ token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Check if admin still exists and is active
    const result = await pool.query(
      'SELECT id, username, role, status FROM admins WHERE id = $1 AND status = $2',
      [decoded.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบผู้ใช้หรือบัญชีถูกระงับ' 
      });
    }

    const admin = result.rows[0];

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token ไม่ถูกต้อง' 
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ออกจากระบบเรียบร้อย' 
  });
});

// GET /api/admin-auth/demo-accounts - Get demo account credentials
router.get('/demo-accounts', (req, res) => {
  res.json({
    accounts: [
      {
        username: 'admin',
        password: 'ใช้รหัสผ่านจริงจากฐานข้อมูล',
        role: 'Super Admin',
        description: 'ผู้ดูแลระบบหลัก'
      }
    ]
  });
});

module.exports = router;