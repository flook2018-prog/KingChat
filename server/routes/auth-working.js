const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { getPool, isDbConnected } = require('../models/database-working');

console.log('✅ Auth routes loading with working database connection');

// Mock users for fallback
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'super-admin',
    status: 'active',
    email: 'admin@kingchat.com'
  },
  {
    id: 2,
    username: 'manager',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'admin',
    status: 'active',
    email: 'manager@kingchat.com'
  },
  {
    id: 3,
    username: 'operator',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'operator',
    status: 'active',
    email: 'operator@kingchat.com'
  },
  {
    id: 4,
    username: 'GGG',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'super-admin',
    status: 'active',
    email: 'ggg@kingchat.com'
  }
];

// Login endpoint
router.post('/login', async (req, res) => {
  console.log('🚀 AUTH ROUTE HIT: POST /login');
  console.log('📦 Request body:', req.body);
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ 
        success: false,
        error: 'Username and password required' 
      });
    }

    const pool = getPool();
    
    if (pool && isDbConnected()) {
      try {
        // Try database first
        console.log('🔍 Searching for user in database:', username);
        const result = await pool.query(
          'SELECT * FROM admins WHERE username = $1 OR email = $1',
          [username]
        );
        console.log('📊 Query result count:', result.rows.length);

        if (result.rows.length > 0) {
          const user = result.rows[0];
          console.log('👤 Found user in database:', { id: user.id, username: user.username, role: user.role });

          if (user.status !== 'active') {
            console.log('❌ Account deactivated:', username);
            return res.status(400).json({ 
              success: false,
              error: 'Account deactivated' 
            });
          }

          // Check password
          console.log('🔐 Checking password for:', username);
          const isMatch = await bcrypt.compare(password, user.password);
          console.log('✅ Password match result:', isMatch);
          
          if (!isMatch) {
            console.log('❌ Wrong password for:', username);
            return res.status(400).json({ 
              success: false,
              error: 'Invalid credentials' 
            });
          }

          // Update last login
          await pool.query(
            'UPDATE admins SET last_login = NOW() WHERE id = $1',
            [user.id]
          );

          // Generate token
          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'railway-jwt-secret-2024',
            { expiresIn: '7d' }
          );

          console.log('✅ Database login successful for:', username);
          return res.json({ 
            success: true, 
            token,
            user: { 
              id: user.id, 
              username: user.username, 
              role: user.role,
              email: user.email 
            },
            database: true,
            message: 'Authenticated via PostgreSQL database'
          });
        }
      } catch (dbError) {
        console.log('❌ Database query failed:', dbError.message);
      }
    }

    // Fallback to mock users
    console.log('🔄 Using fallback authentication for:', username);
    
    const user = mockUsers.find(u => u.username === username || u.email === username);

    if (!user) {
      console.log('❌ User not found in mock data:', username);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    if (user.status !== 'active') {
      console.log('❌ Mock account deactivated:', username);
      return res.status(400).json({ 
        success: false,
        error: 'Account deactivated' 
      });
    }

    // Check password for mock users
    console.log('🔐 Checking password for mock user:', username);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('✅ Mock password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Wrong password for mock user:', username);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'railway-jwt-secret-2024',
      { expiresIn: '7d' }
    );

    console.log('✅ Mock login successful for:', username);
    res.json({ 
      success: true, 
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email 
      },
      fallback: true,
      message: 'Using fallback authentication - database connection issues'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed',
      details: error.message 
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  const pool = getPool();
  res.json({ 
    success: true, 
    message: 'Auth service is healthy',
    database_connected: isDbConnected(),
    timestamp: new Date().toISOString()
  });
});

// Token verification
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'railway-jwt-secret-2024');
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

console.log('✅ Auth routes defined: POST /login, GET /verify, GET /health');

module.exports = router;