const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

// Use direct database connection
const { pool } = require('../models/database');

console.log('✅ Admin auth routes loading with direct PostgreSQL connection');

// Demo data for when database is not available
const demoAdmins = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@kingchat.com',
    displayname: 'System Administrator',
    role: 'admin',
    password: '$2a$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y' // admin123
  }
];

// Check if database is available
async function isDatabaseAvailable() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

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

    const dbAvailable = await isDatabaseAvailable();
    let admin = null;

    if (dbAvailable) {
      console.log('📁 Using database for authentication');
      // Find admin in database using raw SQL
      const result = await pool.query(
        'SELECT * FROM admins WHERE username = $1 OR email = $1 LIMIT 1',
        [username]
      );

      if (result.rows.length > 0) {
        admin = result.rows[0];
      }
    } else {
      console.log('💾 Using demo data for authentication');
      // Find admin in demo data
      admin = demoAdmins.find(a => 
        a.username.toLowerCase() === username.toLowerCase() || 
        a.email.toLowerCase() === username.toLowerCase()
      );
    }

    if (!admin) {
      console.log('❌ Admin not found:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    console.log('✅ Admin login successful for:', username);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role,
        email: admin.email
      },
      process.env.JWT_SECRET || 'kingchat-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login (only if using database)
    if (dbAvailable) {
      await pool.query(
        'UPDATE admins SET "updatedAt" = NOW() WHERE id = $1',
        [admin.id]
      );
    }

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.displayname || admin.displayName || admin.username,
        role: admin.role,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในระบบ' 
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kingchat-secret-key');
    
    // Check if admin still exists
    const result = await pool.query(
      'SELECT * FROM admins WHERE id = $1 LIMIT 1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบผู้ใช้' 
      });
    }

    const admin = result.rows[0];

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.displayname || admin.username,
        role: admin.role,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
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