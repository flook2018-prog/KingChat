const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('🔐 Auth Fallback Primary: Loading with fallback-first approach');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key-for-kingchat-2024';
const JWT_EXPIRES_IN = '24h';

// Pre-hash passwords for fallback admin data
const FALLBACK_ADMINS = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$12$5EjsPpFzG3r36Wu0LwUyku9z/GgjXIMIIMbADln0gVvCVivybsJuC', // admin123
    email: 'admin@kingchat.com',
    role: 'super-admin',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    last_login: '2025-10-15T10:56:57.125Z'
  },
  {
    id: 2,
    username: 'manager',
    password: '$2b$12$e3UEDEIy8HbVJ5RvDS1OuuKrfnNudq8vS4splC6QMpeyUB7TPZH32', // manager123
    email: 'manager@kingchat.com',
    role: 'admin',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    last_login: null
  },
  {
    id: 3,
    username: 'operator',
    password: '$2b$12$myQDZcyeEOBJAtLNJAiWsexv3MR.W6X01m/IBlBbhk/xZ0jGF0fdS', // operator123
    email: 'operator@kingchat.com',
    role: 'operator',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    last_login: null
  }
];

// Dynamic admin storage for runtime additions
let dynamicAdmins = [...FALLBACK_ADMINS];

// Function to hash password for new admins
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// POST /api/auth/login - Login with fallback-first authentication
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    console.log(`🔍 Authenticating user (fallback-first): ${username}`);
    
    // Search in fallback data first (no database timeout)
    const user = dynamicAdmins.find(admin => admin.username === username);
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        database: false
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      console.log(`❌ User inactive: ${username} (status: ${user.status})`);
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        database: false
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        database: false
      });
    }
    
    // Update last login in fallback data
    const userIndex = dynamicAdmins.findIndex(a => a.id === user.id);
    if (userIndex !== -1) {
      dynamicAdmins[userIndex].last_login = new Date().toISOString();
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
    
    console.log(`✅ Authentication successful (fallback): ${username}`);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      database: false,
      fallback: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        last_login: dynamicAdmins[userIndex].last_login
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
    
    console.log('🔍 Verifying JWT token (fallback)');
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check user in fallback data
    const user = dynamicAdmins.find(admin => admin.id === decoded.id && admin.status === 'active');
    
    if (!user) {
      console.log(`❌ User no longer exists or inactive: ${decoded.username}`);
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'User no longer exists or is inactive',
        database: false
      });
    }
    
    console.log(`✅ Token verified for user (fallback): ${user.username}`);
    
    res.json({
      success: true,
      valid: true,
      database: false,
      fallback: true,
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

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log(`🔍 Getting user info (fallback): ${decoded.username}`);
    
    // Get user data from fallback
    const user = dynamicAdmins.find(admin => admin.id === decoded.id);
    
    if (!user) {
      console.log(`❌ User not found: ${decoded.username}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        database: false
      });
    }
    
    console.log(`✅ Retrieved user info (fallback): ${user.username}`);
    
    res.json({
      success: true,
      database: false,
      fallback: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('❌ Get user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      details: error.message
    });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', (req, res) => {
  console.log('👋 User logging out (fallback)');
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.',
    database: false,
    fallback: true
  });
});

// POST /api/auth/sync-admin - Sync admin from admin system
router.post('/sync-admin', async (req, res) => {
  try {
    const adminData = req.body;
    
    if (!adminData.username || !adminData.password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    console.log(`🔄 Syncing admin to auth system: ${adminData.username}`);
    
    // Check if admin already exists
    const existingAdmin = dynamicAdmins.find(admin => admin.username === adminData.username);
    if (existingAdmin) {
      console.log(`⚠️ Admin already exists: ${adminData.username}`);
      return res.json({
        success: true,
        message: 'Admin already exists in authentication system',
        admin: {
          id: existingAdmin.id,
          username: existingAdmin.username,
          role: existingAdmin.role
        }
      });
    }
    
    // Hash password and create new admin
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
    console.log(`✅ Admin synced to auth system: ${newAdmin.username} (ID: ${newAdmin.id})`);
    
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