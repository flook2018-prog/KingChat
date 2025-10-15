const express = require('express');

// Try different bcrypt packages for Railway compatibility
let bcrypt;
try {
  bcrypt = require('bcrypt');
  console.log('✅ Using bcrypt package');
} catch (error) {
  try {
    bcrypt = require('bcryptjs');
    console.log('⚠️ Fallback to bcryptjs package');
  } catch (fallbackError) {
    console.error('❌ No bcrypt package available');
    throw new Error('bcrypt package not found');
  }
}

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();

console.log('🔧 Loading auth-fallback.js routes...');

// PostgreSQL connection using new Railway database
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway',
    ssl: process.env.RAILWAY_ENVIRONMENT ? false : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000,
  });
  console.log('✅ PostgreSQL pool created for auth routes');
} catch (error) {
  console.error('❌ Failed to create PostgreSQL pool:', error.message);
  throw error;
}

// Timeout wrapper for database queries
const withTimeout = (promise, timeoutMs = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    )
  ]);
};

// Mock users for fallback
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'super-admin',
    status: 'active',
    isActive: true,
    email: 'admin@kingchat.com'
  },
  {
    id: 2,
    username: 'manager',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'admin',
    status: 'active',
    isActive: true,
    email: 'manager@kingchat.com'
  },
  {
    id: 3,
    username: 'operator',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'operator',
    status: 'active',
    isActive: true,
    email: 'operator@kingchat.com'
  },
  {
    id: 4,
    username: 'GGG',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFaO.MybG4UG8K.', // password: admin123
    role: 'super-admin',
    status: 'active',
    isActive: true,
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

    try {
      // Try database first
      console.log('🔗 Testing database connection...');
      await withTimeout(pool.query('SELECT 1'));
      console.log('✅ Database connection OK');
      
      console.log('🔍 Searching for user in database:', username);
      const result = await withTimeout(
        pool.query('SELECT * FROM admins WHERE username = $1 OR email = $1', [username])
      );
      console.log('📊 Query result count:', result.rows.length);

      if (result.rows.length === 0) {
        console.log('❌ User not found in database:', username);
        return res.status(400).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      const user = result.rows[0];
      console.log('👤 Found user in database:', { id: user.id, username: user.username, role: user.role });

      if (!user.status || user.status !== 'active') {
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

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'railway-jwt-secret-2024',
        { expiresIn: '7d' }
      );

      console.log('✅ Login successful for:', username);
      res.json({ 
        success: true, 
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email 
        }
      });

    } catch (dbError) {
      // Fallback to mock users
      console.log('🔄 Database unavailable, checking mock users for:', username);
      
      const user = mockUsers.find(u => u.username === username || u.email === username);

      if (!user) {
        console.log('❌ User not found in mock data:', username);
        return res.status(400).json({ 
          success: false,
          error: 'Invalid credentials' 
        });
      }

      if (!user.isActive) {
        console.log('❌ Mock account deactivated:', username);
        return res.status(400).json({ 
          success: false,
          error: 'Account deactivated' 
        });
      }

      // Check password for mock users (default password: admin123)
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
    }
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
  res.json({ 
    success: true, 
    message: 'Auth service is healthy',
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