const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('🔐 Auth Hybrid: Loading with database and fallback support');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key-for-kingchat-2024';
const JWT_EXPIRES_IN = '24h';

// Try to import database connection
let isDatabaseConnected, testQuery;
try {
  const db = require('../models/database-direct');
  isDatabaseConnected = db.isDatabaseConnected;
  testQuery = db.testQuery;
  console.log('📊 Database module loaded for auth');
} catch (error) {
  console.log('⚠️ Database module not available, using fallback mode');
  isDatabaseConnected = () => false;
  testQuery = () => { throw new Error('Database not available'); };
}

// Fallback admin data (sync with admin routes)
const FALLBACK_ADMINS = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$12$LKKQdJYzfEJMYXYgGJqhiOs5m2ycqd5Pr0Ys/QnvM42KqL0KYm0ji', // admin123
    email: 'admin@kingchat.com',
    role: 'super-admin',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    last_login: '2025-10-15T10:56:57.125Z'
  },
  {
    id: 2,
    username: 'manager',
    password: '$2b$12$HGKdJYzfEJMYXYgGJqhiOs5m2ycqd5Pr0Ys/QnvM42KqL0KYm1kl', // manager123
    email: 'manager@kingchat.com',
    role: 'admin',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    last_login: null
  },
  {
    id: 3,
    username: 'operator',
    password: '$2b$12$IGKdJYzfEJMYXYgGJqhiOs5m2ycqd5Pr0Ys/QnvM42KqL0KYm2mn', // operator123
    email: 'operator@kingchat.com',
    role: 'operator',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    last_login: null
  }
];

// Dynamic admin storage for fallback mode
let dynamicAdmins = [...FALLBACK_ADMINS];

// Function to hash password for new admins
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Function to add admin in fallback mode
async function addFallbackAdmin(adminData) {
  const hashedPassword = await hashPassword(adminData.password);
  const newAdmin = {
    id: Math.max(...dynamicAdmins.map(a => a.id)) + 1,
    username: adminData.username,
    password: hashedPassword,
    email: adminData.email || `${adminData.username}@kingchat.com`,
    role: adminData.role || 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: null
  };
  
  dynamicAdmins.push(newAdmin);
  console.log(`✅ Added fallback admin: ${newAdmin.username}`);
  return newAdmin;
}

// POST /api/auth/login - Login with hybrid authentication
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    console.log(`🔍 Authenticating user: ${username}`);
    
    let user = null;
    let usingDatabase = false;
    
    // Try database first
    if (isDatabaseConnected()) {
      try {
        console.log('📊 Attempting database authentication...');
        const result = await testQuery(
          'SELECT id, username, password, email, role, status, last_login FROM admins WHERE username = $1',
          [username]
        );
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          usingDatabase = true;
          console.log(`✅ User found in database: ${username}`);
        }
      } catch (dbError) {
        console.log(`⚠️ Database auth failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data if database failed
    if (!user) {
      console.log('📋 Using fallback authentication...');
      user = dynamicAdmins.find(admin => admin.username === username);
      
      if (user) {
        console.log(`✅ User found in fallback data: ${username}`);
      }
    }
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        database: usingDatabase
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      console.log(`❌ User inactive: ${username} (status: ${user.status})`);
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        database: usingDatabase
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        database: usingDatabase
      });
    }
    
    // Update last login time if using database
    if (usingDatabase) {
      try {
        await testQuery(
          'UPDATE admins SET last_login = NOW() WHERE id = $1',
          [user.id]
        );
      } catch (updateError) {
        console.log('⚠️ Could not update last login in database');
      }
    } else {
      // Update in fallback data
      const userIndex = dynamicAdmins.findIndex(a => a.id === user.id);
      if (userIndex !== -1) {
        dynamicAdmins[userIndex].last_login = new Date().toISOString();
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    console.log(`✅ Authentication successful: ${username} (${usingDatabase ? 'database' : 'fallback'})`);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      database: usingDatabase,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed due to server error',
      details: error.message
    });
  }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    console.log('🔍 Verifying JWT token');
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user = null;
    let usingDatabase = false;
    
    // Try to get fresh user data from database
    if (isDatabaseConnected()) {
      try {
        const result = await testQuery(
          'SELECT id, username, email, role, status FROM admins WHERE id = $1 AND status = $2',
          [decoded.id, 'active']
        );
        
        if (result.rows.length > 0) {
          user = result.rows[0];
          usingDatabase = true;
        }
      } catch (dbError) {
        console.log(`⚠️ Database verification failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data verification
    if (!user) {
      user = dynamicAdmins.find(admin => admin.id === decoded.id && admin.status === 'active');
    }
    
    if (!user) {
      console.log(`❌ User no longer exists or inactive: ${decoded.username}`);
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'User no longer exists or is inactive',
        database: usingDatabase
      });
    }
    
    console.log(`✅ Token verified for user: ${user.username} (${usingDatabase ? 'database' : 'fallback'})`);
    
    res.json({
      success: true,
      valid: true,
      database: usingDatabase,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Invalid JWT token');
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      console.log('❌ JWT token expired');
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Token expired'
      });
    }
    
    console.error('❌ Token verification error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Token verification failed',
      details: error.message
    });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', (req, res) => {
  console.log('👋 User logging out');
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.',
    database: isDatabaseConnected()
  });
});

// Admin sync endpoint (for internal use)
router.post('/sync-admin', async (req, res) => {
  try {
    const adminData = req.body;
    
    if (!adminData.username || !adminData.password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Check if admin already exists
    const existingAdmin = dynamicAdmins.find(admin => admin.username === adminData.username);
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin already exists in fallback data'
      });
    }
    
    const newAdmin = await addFallbackAdmin(adminData);
    
    res.json({
      success: true,
      message: 'Admin synced to authentication system',
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status
      }
    });
    
  } catch (error) {
    console.error('❌ Admin sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync admin',
      details: error.message
    });
  }
});

module.exports = router;