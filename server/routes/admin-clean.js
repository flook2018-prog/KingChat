const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Use direct database connection with Railway PostgreSQL
const { Pool } = require('pg');

// Use Railway DATABASE_PUBLIC_URL directly from Variables
const DATABASE_URL = process.env.DATABASE_PUBLIC_URL || 
                    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@tramway.proxy.rlwy.net:48079/railway';

console.log('🔗 Database connection URL:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
console.log('🔧 Environment variables check:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Available' : 'Missing');
console.log('   DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'Available' : 'Missing');
console.log('   POSTGRES_URL:', process.env.POSTGRES_URL ? 'Available' : 'Missing');  
console.log('   DATABASE_PRIVATE_URL:', process.env.DATABASE_PRIVATE_URL ? 'Available' : 'Missing');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('🎯 Final DATABASE_URL used:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

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

  jwt.verify(token, process.env.JWT_SECRET || 'kingchat-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token',
        details: err.message 
      });
    }
    req.user = decoded;
    next();
  });
};

let pool;
let poolInitialized = false;
let poolInitError = null;

// Initialize pool with error handling
async function initializePool() {
  try {
    console.log('🔄 Initializing PostgreSQL pool...');
    
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false,
        require: true
      },
      max: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
      acquireTimeoutMillis: 60000,
      // Additional connection options for Railway
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
      poolInitialized = false;
      poolInitError = err;
    });

    // Test connection on startup with retry logic
    pool.on('connect', () => {
      console.log('✅ PostgreSQL client connected successfully');
    });

    // Test initial connection
    console.log('🔍 Testing initial database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Initial database test successful:', result.rows[0]);
    client.release();
    
    poolInitialized = true;
    poolInitError = null;
    console.log('✅ PostgreSQL pool initialized successfully');
    
  } catch (error) {
    console.error('❌ CRITICAL: Failed to initialize PostgreSQL pool:', error);
    poolInitialized = false;
    poolInitError = error;
    
    // Don't create dummy pool, let endpoints handle the error
    pool = null;
  }
}

// Initialize pool immediately
initializePool();

// Middleware to log all admin requests
router.use((req, res, next) => {
  console.log(`🌐 Admin API ${req.method} ${req.path} - Auth: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  next();
});

// ========== NON-AUTHENTICATED ROUTES ==========

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin routes working!',
    timestamp: new Date().toISOString(),
    version: '3.0',
    deployment: 'clean-routes',
    pool_status: pool ? 'initialized' : 'not_initialized',
    pool_initialized: poolInitialized
  });
});

// Health check endpoint (no auth required)
router.get('/health', async (req, res) => {
  console.log('🏥 Health check requested...');
  
  try {
    if (!pool || !poolInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Database pool not initialized',
        poolInitialized,
        poolInitError: poolInitError?.message
      });
    }
    
    // Quick connection test with timeout
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({
      success: true,
      message: 'Database connection healthy',
      pool_status: 'connected',
      pool_total_count: pool.totalCount,
      pool_idle_count: pool.idleCount,
      pool_waiting_count: pool.waitingCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database reset endpoint (no auth required for emergency)
router.get('/reset-db', async (req, res) => {
  console.log('🔧 Database reset requested...');
  
  if (!pool || !poolInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Database pool not initialized',
      poolInitialized,
      poolInitError: poolInitError?.message
    });
  }

  try {
    const client = await pool.connect();
    
    // Drop existing table to fix schema issues
    console.log('🗑️ Dropping existing admins table...');
    await client.query('DROP TABLE IF EXISTS admins CASCADE');
    
    // Create clean table
    console.log('📋 Creating clean admins table...');
    await client.query(`
      CREATE TABLE admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create default admin
    console.log('👤 Creating default admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO admins (username, password, email, role, status)
      VALUES ($1, $2, $3, $4, $5)
    `, ['admin', hashedPassword, 'admin@kingchat.com', 'super_admin', 'active']);
    
    // Verify table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'admins' 
      ORDER BY ordinal_position
    `);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Database reset successfully',
      table_structure: tableInfo.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database reset failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========== AUTHENTICATED ROUTES ==========

// Direct connection test
router.get('/direct-test', authenticateToken, async (req, res) => {
  console.log('🔍 Testing direct database connection...');
  console.log('🔧 Using DATABASE_URL:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
  console.log('🏊 Pool status - initialized:', poolInitialized, 'error:', poolInitError?.message);
  
  const { Pool } = require('pg');
  const directPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false,
      require: true
    },
    max: 1,
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('🔗 Attempting to connect to database...');
    const client = await directPool.connect();
    console.log('✅ Database connection established');
    
    console.log('📊 Executing test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query executed successfully:', result.rows[0]);
    
    client.release();
    await directPool.end();
    console.log('🔐 Connection pool closed');
    
    const response = {
      success: true,
      message: 'Direct database connection successful',
      data: result.rows[0],
      connection_url: DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending success response:', response);
    res.json(response);
    
  } catch (error) {
    await directPool.end();
    console.error('❌ Direct database connection failed:', error.message);
    console.error('❌ Error details:', error);
    
    const errorResponse = {
      success: false,
      error: 'Direct database connection failed',
      details: error.message,
      code: error.code,
      connection_url: DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Get all admins with direct connection
router.get('/admins-direct', authenticateToken, async (req, res) => {
  console.log('🔍 Getting admins with direct database connection...');
  console.log('🔧 Using DATABASE_URL:', DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));
  console.log('🏊 Pool status - initialized:', poolInitialized, 'error:', poolInitError?.message);
  
  const { Pool } = require('pg');
  const directPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false,
      require: true
    },
    max: 1,
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('🔗 Connecting to database for admins query...');
    const client = await directPool.connect();
    console.log('✅ Connected successfully');
    
    // Check if admins table exists
    console.log('📋 Checking if admins table exists...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'admins'
    `);
    console.log('🔍 Table check result:', tableCheck.rows.length > 0 ? 'exists' : 'does not exist');
    
    if (tableCheck.rows.length === 0) {
      // Create admins table
      console.log('📋 Creating admins table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          role VARCHAR(20) DEFAULT 'admin',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Admins table created successfully');
    }
    
    // Get all admins
    const result = await client.query('SELECT id, username, email, role, status, created_at, updated_at FROM admins ORDER BY id');
    
    // If no admins exist, create default admin
    if (result.rows.length === 0) {
      console.log('👤 Creating default admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO admins (username, password, email, role, status)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', hashedPassword, 'admin@kingchat.com', 'super_admin', 'active']);
      
      // Get admins again
      const newResult = await client.query('SELECT id, username, email, role, status, created_at, updated_at FROM admins ORDER BY id');
      client.release();
      await directPool.end();
      
      return res.json({
        success: true,
        data: newResult.rows,
        message: 'Admins retrieved with direct connection (default admin created)',
        connection: 'direct',
        timestamp: new Date().toISOString()
      });
    }
    
    client.release();
    await directPool.end();
    
    res.json({
      success: true,
      data: result.rows,
      message: 'Admins retrieved with direct connection',
      connection: 'direct',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await directPool.end();
    console.error('❌ Direct admins query failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Direct admins query failed',
      details: error.message,
      code: error.code,
      connection_url: DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
      timestamp: new Date().toISOString()
    });
  }
});

// Get all admins (using main pool)
router.get('/admins', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Getting all admins from database');
    
    if (!pool || !poolInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected',
        poolInitialized,
        poolInitError: poolInitError?.message
      });
    }

    const result = await pool.query('SELECT id, username, email, role, status, created_at, updated_at FROM admins ORDER BY id');
    
    console.log(`✅ Retrieved ${result.rows.length} admins`);
    res.json({
      success: true,
      data: result.rows,
      message: `Retrieved ${result.rows.length} admins`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
    });
  }
});

// Create new admin
router.post('/admins', authenticateToken, async (req, res) => {
  try {
    const { username, password, email, role = 'admin', status = 'active' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    if (!pool || !poolInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO admins (username, password, email, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, status, created_at',
      [username, hashedPassword, email, role, status]
    );
    
    console.log(`✅ Created new admin: ${username}`);
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Admin created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Database connection error',
        details: error.message
      });
    }
  }
});

// Update admin
router.put('/admins/:id', authenticateToken, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { username, email, role, status } = req.body;
    
    if (isNaN(adminId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid admin ID' 
      });
    }

    if (!pool || !poolInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }

    const result = await pool.query(
      'UPDATE admins SET username = $1, email = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, email, role, status, updated_at',
      [username, email, role, status, adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Updated admin ID ${adminId}: ${username}`);
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Admin updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Database connection error',
        details: error.message
      });
    }
  }
});

// Delete admin
router.delete('/admins/:id', authenticateToken, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    
    if (isNaN(adminId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid admin ID' 
      });
    }

    if (!pool || !poolInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }

    const result = await pool.query(
      'DELETE FROM admins WHERE id = $1 RETURNING username',
      [adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Deleted admin ID ${adminId}: ${result.rows[0].username}`);
    res.json({
      success: true,
      message: `Admin ${result.rows[0].username} deleted successfully`
    });
    
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
    });
  }
});

// Get admin by ID (MUST BE LAST - parameterized route)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`🚨 ROUTE CALLED: /:id endpoint with param: ${req.params.id}`);
    
    // Validate that id is actually a number
    const adminId = parseInt(req.params.id);
    if (isNaN(adminId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid admin ID format - must be numeric' 
      });
    }
    
    if (!pool || !poolInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }
    
    console.log(`📁 Admin: Fetching admin ID ${adminId} from database`);
    
    const result = await pool.query(
      'SELECT id, username, email, role, status, created_at, updated_at FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Admin: Retrieved admin: ${result.rows[0].username}`);
    res.json({ success: true, data: result.rows[0] });
    
  } catch (error) {
    console.error('❌ Admin: Error fetching admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
    });
  }
});

module.exports = router;