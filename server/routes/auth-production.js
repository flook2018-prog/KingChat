const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { executeQuery, isDatabaseConnected } = require('../models/database-production-fallback');

console.log('🔐 Auth Production Routes: Loading with PostgreSQL database connection');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key-for-kingchat-2024';
const JWT_EXPIRES_IN = '24h';

// POST /api/auth/login - Login with database authentication (PostgreSQL with fallback)
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
    
    // Find user in database (fallback supported)
    const result = await executeQuery(
      'SELECT id, username, password, email, role, status, last_login FROM admins WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        database: isDatabaseConnected() ? 'postgresql' : 'fallback'
      });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      console.log(`❌ User inactive: ${username} (status: ${user.status})`);
      return res.status(401).json({
        success: false,
        error: 'Account is not active',
        database: true
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log(`❌ Password mismatch for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        database: true
      });
    }
    
    // Update last login time
    await executeQuery(
      'UPDATE admins SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
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
    
    console.log(`✅ Authentication successful from PostgreSQL: ${username} (ID: ${user.id})`);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      database: true,
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
      details: error.message,
      database: true
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
    
    if (!isDatabaseConnected()) {
      return res.json({
        success: true,
        valid: true,
        user: decoded,
        database: false,
        message: 'Token valid but database not connected'
      });
    }
    
    // Check if user still exists and is active in database
    const result = await executeQuery(
      'SELECT id, username, email, role, status FROM admins WHERE id = $1 AND status = $2',
      [decoded.id, 'active']
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User no longer exists or inactive: ${decoded.username}`);
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'User no longer exists or is inactive',
        database: true
      });
    }
    
    const user = result.rows[0];
    console.log(`✅ Token verified for user: ${user.username}`);
    
    res.json({
      success: true,
      valid: true,
      database: true,
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

// GET /api/auth/me - Get current user info from PostgreSQL
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
    
    if (!isDatabaseConnected()) {
      return res.json({
        success: true,
        user: decoded,
        database: false,
        message: 'Using token data - database not connected'
      });
    }
    
    console.log(`🔍 Getting user info from PostgreSQL: ${decoded.username}`);
    
    // Get fresh user data from database
    const result = await executeQuery(
      'SELECT id, username, email, role, status, created_at, last_login FROM admins WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found in PostgreSQL: ${decoded.username}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        database: true
      });
    }
    
    const user = result.rows[0];
    console.log(`✅ Retrieved user info from PostgreSQL: ${user.username}`);
    
    res.json({
      success: true,
      database: true,
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
  console.log('👋 User logging out');
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the token from client storage.',
    database: true
  });
});

module.exports = router;