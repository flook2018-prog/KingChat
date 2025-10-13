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

console.log('🔧 Loading auth-simple.js routes...');

// PostgreSQL connection using public URL for Railway compatibility
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@ballast.proxy.rlwy.net:38432/railway',
    ssl: false
  });
  console.log('✅ PostgreSQL pool created for auth routes');
} catch (error) {
  console.error('❌ Failed to create PostgreSQL pool:', error.message);
  throw error;
}

// Test database connection immediately
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Auth route database connection failed:', err.message);
  } else {
    console.log('✅ Auth route database connected successfully at:', result.rows[0].now);
  }
});

console.log('✅ Auth routes: router created and pool configured');

// Simple test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    bcrypt_available: !!bcrypt,
    pool_available: !!pool
  });
});

// Login endpoint
router.post('/login', async (req, res) => {
  console.log('🚀 AUTH ROUTE HIT: POST /login');
  console.log('📦 Request body:', req.body);
  
  try {
    // Test database connection before proceeding
    console.log('🔗 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection OK');
    
    console.log('🔐 Login attempt for:', req.body.username);
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({ 
        success: false,
        error: 'Username and password required' 
      });
    }

    // Find user
    console.log('🔍 Searching for user:', username);
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1 OR email = $1',
      [username]
    );
    console.log('📊 Query result count:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];
    console.log('👤 Found user:', { id: user.id, username: user.username, email: user.email, isActive: user.isActive });

    if (!user.isActive) {
      console.log('❌ Account deactivated:', username);
      return res.status(400).json({ 
        success: false,
        error: 'Account deactivated' 
      });
    }

    // Check password
    console.log('🔐 Checking password for:', username);
    console.log('🔒 Stored password hash (first 10 chars):', user.password?.substring(0, 10));
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
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server error: ' + error.message 
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'railway-jwt-secret-2024');
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('🏥 AUTH HEALTH CHECK HIT');
  res.json({ 
    status: 'ok', 
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Auth routes defined: POST /login, GET /verify, GET /health');

// Health check for auth routes
router.get('/health', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT COUNT(*) as admin_count FROM admins');
    res.json({ 
      success: true,
      status: 'Auth routes healthy',
      database: 'connected',
      admin_count: dbTest.rows[0].admin_count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      status: 'Auth routes unhealthy',
      database: 'disconnected',
      error: error.message 
    });
  }
});

module.exports = router;