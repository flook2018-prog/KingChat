const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Use direct database connection with Railway PostgreSQL
const { Pool } = require('pg');

// Try multiple environment variable names that Railway might use
const DATABASE_URL = process.env.DATABASE_PUBLIC_URL || 
                    process.env.DATABASE_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.DATABASE_PRIVATE_URL ||
                    process.env.POSTGRES_PRIVATE_URL ||
                    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@roundhouse.proxy.rlwy.net:48079/railway' || // Railway public URL from Variables tab
                    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@roundhouse.proxy.rlwy.net:27936/railway'; // Railway public URL as fallback

console.log('🔗 Database connection URL:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
console.log('🔧 Environment variables check:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Available' : 'Missing');
console.log('   DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'Available' : 'Missing');
console.log('   POSTGRES_URL:', process.env.POSTGRES_URL ? 'Available' : 'Missing');  
console.log('   DATABASE_PRIVATE_URL:', process.env.DATABASE_PRIVATE_URL ? 'Available' : 'Missing');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('🎯 Final DATABASE_URL used:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

let pool;
try {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('railway.internal') ? false : { rejectUnauthorized: false }, // No SSL for internal, SSL for external
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Additional connection options for Railway
    keepAlive: true,
    keepAliveInitialDelayMillis: 0
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
  });

  // Test connection on startup with retry logic
  pool.on('connect', () => {
    console.log('✅ PostgreSQL client connected successfully');
  });

  // Test initial connection
  (async () => {
    try {
      console.log('🔍 Testing initial database connection...');
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Initial database test successful:', result.rows[0].current_time);
      client.release();
    } catch (error) {
      console.error('❌ Initial database connection failed:', error.message);
    }
  })();

  console.log('✅ Admin routes v2 loading with PostgreSQL database connection only');
} catch (error) {
  console.error('❌ CRITICAL: Failed to create PostgreSQL pool:', error);
  console.log('⚠️  Admin routes will load with limited functionality');
  
  // Create a dummy pool for fallback
  pool = {
    query: async () => {
      throw new Error('Database connection not available');
    }
  };
}

// Middleware to log all admin requests
router.use((req, res, next) => {
  console.log(`🌐 Admin API ${req.method} ${req.path} - Auth: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }
  
  try {
    console.log('🔐 Verifying admin token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('✅ Token verified for user:', decoded.username);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Apply authentication to all admin routes EXCEPT test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin v2 routes working!',
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
});

router.get('/db-test', async (req, res) => {
  try {
    console.log('🧪 Testing database connection directly...');
    console.log('🔗 Using connection string:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
    
    // Show all environment variables for debugging
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Available' : 'Missing',
      DATABASE_PUBLIC_URL: process.env.DATABASE_PUBLIC_URL ? 'Available' : 'Missing',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'Available' : 'Missing',
      DATABASE_PRIVATE_URL: process.env.DATABASE_PRIVATE_URL ? 'Available' : 'Missing',
      POSTGRES_PRIVATE_URL: process.env.POSTGRES_PRIVATE_URL ? 'Available' : 'Missing',
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT ? 'Available' : 'Missing',
      // Show actual URLs (masked) for debugging
      DATABASE_URL_VALUE: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@') : 'Not set',
      DATABASE_PUBLIC_URL_VALUE: process.env.DATABASE_PUBLIC_URL ? process.env.DATABASE_PUBLIC_URL.replace(/\/\/.*@/, '//***:***@') : 'Not set'
    };
    
    // Test basic connection
    const testResult = await pool.query('SELECT 1 as test, current_database() as db_name, current_user as username');
    console.log('✅ Basic connection test passed');
    
    // Test admins table
    const adminCount = await pool.query('SELECT COUNT(*) as count FROM admins');
    console.log('✅ Admins table query successful');
    
    res.json({ 
      success: true, 
      message: 'Database connection working!',
      database: testResult.rows[0].db_name,
      user: testResult.rows[0].username,
      adminCount: adminCount.rows[0].count,
      connectionUrl: DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
      environmentVariables: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database test failed',
      details: error.message,
      code: error.code,
      connectionUrl: DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
      environmentVariables: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Available' : 'Missing',
        POSTGRES_URL: process.env.POSTGRES_URL ? 'Available' : 'Missing',
        DATABASE_PRIVATE_URL: process.env.DATABASE_PRIVATE_URL ? 'Available' : 'Missing',
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Alternative database test with different connection methods
router.get('/db-test-alt', async (req, res) => {
  const testUrls = [
    process.env.DATABASE_PUBLIC_URL,
    process.env.DATABASE_URL, 
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@roundhouse.proxy.rlwy.net:48079/railway',
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway'
  ].filter(Boolean);

  const results = [];

  for (const url of testUrls) {
    try {
      const testPool = new Pool({
        connectionString: url,
        ssl: url.includes('railway.internal') ? false : { rejectUnauthorized: false },
        max: 1,
        connectionTimeoutMillis: 5000
      });

      const result = await testPool.query('SELECT 1 as test');
      results.push({ url: url.replace(/\/\/.*@/, '//***:***@'), status: 'SUCCESS', result: result.rows[0] });
      await testPool.end();
      break; // Stop on first success
    } catch (error) {
      results.push({ url: url.replace(/\/\/.*@/, '//***:***@'), status: 'FAILED', error: error.message });
    }
  }

  res.json({
    success: results.some(r => r.status === 'SUCCESS'),
    results,
    timestamp: new Date().toISOString()
  });
});

// GET /api/admin/admins - Get all admins (NO AUTH REQUIRED FOR TESTING)
router.get('/admins', async (req, res) => {
  try {
    console.log('📁 Admin v2: Fetching admins from PostgreSQL via /admins endpoint');
    console.log('🔗 Database URL check:', DATABASE_URL ? 'Available' : 'Missing');
    console.log('🔐 Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Test database connection first
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified for /admins');
    
    const result = await pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC');
    
    console.log(`✅ Admin v2: Retrieved ${result.rows.length} admins from database`);
    console.log('📊 Sample admin data:', result.rows.length > 0 ? result.rows[0] : 'No admins found');
    
    res.json({ success: true, admins: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('❌ Admin v2: Error fetching admins:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    res.status(503).json({ 
      success: false, 
      error: 'Database not connected',
      details: error.message,
      code: error.code
    });
  }
});

router.use(authenticateToken);

// Initialize database on startup
(async () => {
  try {
    console.log('🔧 Admin v2: Initializing database schema...');
    
    await pool.query('SELECT 1');
    console.log('✅ Admin v2: Database connection test successful');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    const adminExists = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
    
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        'INSERT INTO admins (username, password, full_name, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hashedPassword, 'ผู้ดูแลระบบหลัก', 'super-admin', 'active']
      );
      console.log('✅ Admin v2: Created default admin account (admin/admin123)');
    }
    
    console.log('✅ Admin v2: Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Admin v2: Error initializing database:', error);
  }
})();

// IMPORTANT: Specific routes MUST come before parameterized routes

// POST /api/admin/admins - Create new admin (specific route)
router.post('/admins', async (req, res) => {
  try {
    const { username, password, full_name, role, status } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
      });
    }
    
    console.log(`📝 Admin v2: Creating new admin: ${username}`);
    
    const existingUser = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      'INSERT INTO admins (username, password, full_name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, full_name, role, status, created_at',
      [username, hashedPassword, full_name || username, role || 'admin', status || 'active']
    );
    
    const newAdmin = result.rows[0];
    console.log(`✅ Admin v2: Created new admin: ${username}`);
    res.status(201).json({ 
      success: true, 
      message: 'เพิ่มผู้ดูแลระบบเรียบร้อยแล้ว',
      admin: newAdmin 
    });
    
  } catch (error) {
    console.error('❌ Admin v2: Error creating admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ',
      details: error.message
    });
  }
});

// PUT /api/admin/admins/:id - Update admin (specific route)
router.put('/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, full_name, role, status } = req.body;
    
    console.log(`📝 Admin v2: Updating admin ID: ${id}`);
    
    if (!username || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }
    
    const adminExists = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการอัปเดต' 
      });
    }
    
    const duplicateCheck = await pool.query('SELECT id FROM admins WHERE username = $1 AND id != $2', [username, id]);
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
      });
    }
    
    let updateQuery;
    let updateValues;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery = 'UPDATE admins SET username = $1, password = $2, full_name = $3, role = $4, status = $5, updated_at = NOW() WHERE id = $6 RETURNING id, username, full_name, role, status, created_at, updated_at';
      updateValues = [username, hashedPassword, full_name || username, role, status || 'active', id];
    } else {
      updateQuery = 'UPDATE admins SET username = $1, full_name = $2, role = $3, status = $4, updated_at = NOW() WHERE id = $5 RETURNING id, username, full_name, role, status, created_at, updated_at';
      updateValues = [username, full_name || username, role, status || 'active', id];
    }
    
    const result = await pool.query(updateQuery, updateValues);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Admin v2: Updated admin: ${updatedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว', 
      admin: updatedAdmin 
    });
    
  } catch (error) {
    console.error('❌ Admin v2: Error updating admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ดูแลระบบ',
      details: error.message
    });
  }
});

// DELETE /api/admin/admins/:id - Delete admin (specific route)
router.delete('/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Admin v2: Deleting admin ID: ${id}`);
    
    const adminExists = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการลบ' 
      });
    }
    
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins WHERE status = $1', ['active']);
    
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้' 
      });
    }
    
    const deletedAdmin = adminExists.rows[0];
    
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    
    console.log(`✅ Admin v2: Deleted admin: ${deletedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว' 
    });
    
  } catch (error) {
    console.error('❌ Admin v2: Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ',
      details: error.message
    });
  }
});

// GET /api/admin - Get all admins (legacy route)
router.get('/', async (req, res) => {
  try {
    console.log('📁 Admin v2: Fetching admins from PostgreSQL via legacy / endpoint');
    
    const result = await pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC');
    
    console.log(`✅ Admin v2: Retrieved ${result.rows.length} admins from database`);
    res.json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('❌ Admin v2: Error fetching admins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
    });
  }
});

// GET /api/admin/:id - Get specific admin (parameterized route MUST come last)
router.get('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    
    // Validate that id is actually a number
    if (isNaN(adminId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid admin ID format' 
      });
    }
    
    console.log(`📁 Admin v2: Fetching admin ID ${adminId} from PostgreSQL database`);
    
    const result = await pool.query(
      'SELECT id, username, full_name, role, status, created_at, last_login FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Admin v2: Retrieved admin: ${result.rows[0].username}`);
    res.json({ success: true, admin: result.rows[0] });
  } catch (error) {
    console.error('❌ Admin v2: Error fetching admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
    });
  }
});

module.exports = router;