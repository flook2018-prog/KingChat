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

// Helper function to test database connection with retry
async function testDatabaseConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`✅ Database connection successful on attempt ${i + 1}`);
      return true;
    } catch (error) {
      console.log(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log('⏳ Waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return false;
}

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

// Simple database connection test
router.get('/db-simple', async (req, res) => {
  try {
    console.log('🔍 Simple database test starting...');
    
    // Show what DATABASE_URL we're actually using
    const urlToUse = DATABASE_URL.replace(/\/\/.*@/, '//***:***@');
    console.log('🔗 Using URL:', urlToUse);
    
    // Try to get a client from the pool
    const client = await pool.connect();
    console.log('✅ Got client from pool');
    
    // Simple query
    const result = await client.query('SELECT NOW() as current_time, 1 as test');
    console.log('✅ Query executed successfully');
    
    client.release();
    console.log('✅ Client released');
    
    res.json({
      success: true,
      message: 'Database connection successful',
      result: result.rows[0],
      database_url: urlToUse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple database test failed:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      code: error.code,
      database_url: DATABASE_URL.replace(/\/\/.*@/, '//***:***@'),
      timestamp: new Date().toISOString()
    });
  }
});

// Direct database connection test
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

// Direct admins endpoint with fresh connection
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
      const bcrypt = require('bcrypt');
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

// Apply authentication to all admin routes EXCEPT test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin v2 routes working!',
    timestamp: new Date().toISOString(),
    version: '2.0',
    deployment: 'latest-with-retry-mechanism',
    pool_status: pool ? 'initialized' : 'not_initialized',
    pool_total_count: pool ? pool.totalCount : 0,
    pool_idle_count: pool ? pool.idleCount : 0,
    pool_waiting_count: pool ? pool.waitingCount : 0
  });
});

// Database reset and fix endpoint
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
    const bcrypt = require('bcrypt');
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

// Health check endpoint without authentication
router.get('/health', async (req, res) => {
  console.log('🏥 Health check requested...');
  
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database pool not initialized',
        timestamp: new Date().toISOString()
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

// Simple status endpoint without database
router.get('/status', (req, res) => {
  res.json({ 
    success: true, 
    server: 'online',
    routes: 'loaded',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_PUBLIC_URL_EXISTS: !!process.env.DATABASE_PUBLIC_URL,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT
    },
    timestamp: new Date().toISOString()
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
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@tramway.proxy.rlwy.net:48079/railway',
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

// Comprehensive database connection test
router.get('/db-debug', async (req, res) => {
  const connectionTests = [];
  
  // Test 1: Environment variables
  const envTest = {
    test: 'Environment Variables',
    DATABASE_URL: process.env.DATABASE_URL ? 'Available' : 'Missing',
    DATABASE_PUBLIC_URL: process.env.DATABASE_PUBLIC_URL ? 'Available' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT ? 'Available' : 'Missing'
  };
  connectionTests.push(envTest);
  
  // Test 2: Direct connection strings
  const testConnections = [
    {
      name: 'Railway Public URL (from env)',
      url: process.env.DATABASE_PUBLIC_URL,
      expectedToWork: true
    },
    {
      name: 'Railway Internal URL (from env)', 
      url: process.env.DATABASE_URL,
      expectedToWork: false // Internal might not work from external
    },
    {
      name: 'Hardcoded Public URL (Correct)',
      url: 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@tramway.proxy.rlwy.net:48079/railway',
      expectedToWork: true
    }
  ];
  
  for (const conn of testConnections) {
    if (!conn.url) {
      connectionTests.push({
        name: conn.name,
        status: 'SKIPPED',
        reason: 'URL not available'
      });
      continue;
    }
    
    try {
      const testPool = new Pool({
        connectionString: conn.url,
        ssl: conn.url.includes('railway.internal') ? false : { rejectUnauthorized: false },
        max: 1,
        connectionTimeoutMillis: 10000
      });
      
      const client = await testPool.connect();
      const result = await client.query('SELECT NOW() as current_time, current_database() as db_name');
      client.release();
      await testPool.end();
      
      connectionTests.push({
        name: conn.name,
        status: 'SUCCESS',
        url: conn.url.replace(/\/\/.*@/, '//***:***@'),
        result: result.rows[0],
        expectedToWork: conn.expectedToWork
      });
      
    } catch (error) {
      connectionTests.push({
        name: conn.name,
        status: 'FAILED',
        url: conn.url.replace(/\/\/.*@/, '//***:***@'),
        error: error.message,
        code: error.code,
        expectedToWork: conn.expectedToWork
      });
    }
  }
  
  res.json({
    success: true,
    message: 'Database connection debugging complete',
    tests: connectionTests,
    recommendation: 'Use the connection that shows SUCCESS status',
    timestamp: new Date().toISOString()
  });
});
router.get('/health', (req, res) => {
  res.json({
    success: true,
    server: 'online',
    routes: 'loaded',
    timestamp: new Date().toISOString(),
    version: 'emergency-stable'
  });
});

// EMERGENCY: Working endpoint with hardcoded data (NO DATABASE, NO AUTH)
router.get('/admins-working', (req, res) => {
  console.log('🆘 Emergency /admins-working endpoint called - returning hardcoded data');
  
  const workingAdmins = [
    {
      id: 1,
      username: 'admin',
      full_name: 'ผู้ดูแลระบบหลัก',
      role: 'super-admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    },
    {
      id: 2,
      username: 'manager',
      full_name: 'ผู้จัดการระบบ', 
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    }
  ];
  
  res.json({
    success: true,
    admins: workingAdmins,
    count: workingAdmins.length,
    source: 'hardcoded-emergency-data',
    message: 'Emergency working data - database connection issues'
  });
});

// GET /api/admin/admins - Get all admins (NO AUTH REQUIRED FOR TESTING)
router.get('/admins', async (req, res) => {
  try {
    console.log('🎯 ROUTE CALLED: /admins endpoint - NOT /:id endpoint!');
    console.log('📁 Admin v2: Fetching admins from PostgreSQL via /admins endpoint');
    console.log('🔗 Database URL check:', DATABASE_URL ? 'Available' : 'Missing');
    console.log('🔐 Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Test database connection with retry
    const connectionOk = await testDatabaseConnection(3);
    if (!connectionOk) {
      throw new Error('Database connection failed after 3 retries');
    }
    
    console.log('✅ Database connection verified for /admins');
    
    // Check if admins table has data, if not create default admin
    let result = await pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC');
    
    if (result.rows.length === 0) {
      console.log('📝 No admins found, creating default admin...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await pool.query(
        'INSERT INTO admins (username, password, full_name, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hashedPassword, 'ผู้ดูแลระบบหลัก', 'super-admin', 'active']
      );
      
      console.log('✅ Default admin created');
      
      // Re-fetch after creating default admin
      result = await pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC');
    }
    
    console.log(`✅ Admin v2: Retrieved ${result.rows.length} admins from database`);
    console.log('📊 Sample admin data:', result.rows.length > 0 ? result.rows[0] : 'No admins found');
    
    res.json({ 
      success: true, 
      admins: result.rows, 
      count: result.rows.length, 
      source: 'railway-postgresql',
      database_url: DATABASE_URL.replace(/\/\/.*@/, '//***:***@')
    });
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
      code: error.code,
      database_url: DATABASE_URL.replace(/\/\/.*@/, '//***:***@')
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