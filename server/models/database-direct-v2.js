const { Pool } = require('pg');
const bcrypt = require('bcrypt');

console.log('🔧 Database Direct v2: Loading Railway environment variables...');

// Railway database URLs (latest from dashboard)
const RAILWAY_DB_URLS = [
  process.env.DATABASE_URL, // Primary Railway database URL
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@roundhouse.proxy.rlwy.net:49935/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@viaduct.proxy.rlwy.net:51932/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@autorack.proxy.rlwy.net:33388/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@ballast.proxy.rlwy.net:38432/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@junction.proxy.rlwy.net:43062/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@monorail.proxy.rlwy.net:16543/railway'
].filter(Boolean);

console.log(`🔍 Found ${RAILWAY_DB_URLS.length} database URLs to test`);
console.log(`📍 Primary DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

let pool = null;
let currentUrl = null;
let connectionAttempts = 0;

// Connection configuration
const getPoolConfig = (connectionString) => ({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Reduced timeout
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function connectToDatabase() {
  console.log('🚀 Starting database connection process...');
  
  for (const url of RAILWAY_DB_URLS) {
    try {
      connectionAttempts++;
      console.log(`🔄 Attempt ${connectionAttempts}: Testing connection...`);
      
      // Mask password in logs
      const maskedUrl = url.replace(/:([^:@]*@)/, ':***@');
      console.log(`🔗 Testing: ${maskedUrl}`);
      
      // Create test pool
      const testPool = new Pool(getPoolConfig(url));
      
      // Test connection with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 8000);
      });
      
      const connectPromise = testPool.query('SELECT NOW() as current_time, current_database() as database_name');
      
      const result = await Promise.race([connectPromise, timeoutPromise]);
      
      console.log(`✅ SUCCESS: Connected to database "${result.rows[0].database_name}" at ${result.rows[0].current_time}`);
      
      // Close old pool if exists
      if (pool) {
        await pool.end();
      }
      
      pool = testPool;
      currentUrl = url;
      
      // Create admin table
      await createAdminTable();
      
      console.log(`🎯 Database connection established successfully`);
      return true;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      
      // Try to close pool if it was created
      try {
        if (testPool) await testPool.end();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      continue;
    }
  }
  
  console.error('❌ Could not connect to any Railway database URL');
  console.error(`🔢 Total attempts: ${connectionAttempts}`);
  return false;
}

async function createAdminTable() {
  try {
    console.log('🏗️ Creating/verifying admin table...');
    
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    console.log('✅ Admin table verified/created');
    
    // Check if any admins exist
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins');
    const count = parseInt(adminCount.rows[0].count);
    
    if (count === 0) {
      console.log('👤 Creating default admin accounts...');
      
      const defaultAdmins = [
        { username: 'admin', password: 'admin123', role: 'super-admin' },
        { username: 'manager', password: 'manager123', role: 'admin' },
        { username: 'operator', password: 'operator123', role: 'operator' }
      ];
      
      for (const admin of defaultAdmins) {
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        await pool.query(
          'INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [admin.username, hashedPassword, `${admin.username}@kingchat.com`, admin.role, 'active']
        );
        console.log(`✅ Created admin: ${admin.username} (${admin.role})`);
      }
      
      console.log(`🎯 Created ${defaultAdmins.length} default admin accounts`);
    } else {
      console.log(`📊 Found ${count} existing admin accounts`);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin table:', error.message);
  }
}

// Start connection immediately when module loads
connectToDatabase().catch(error => {
  console.error('❌ Initial database connection failed:', error.message);
});

// Retry connection every 30 seconds if failed
const retryInterval = setInterval(async () => {
  if (!pool) {
    console.log('🔄 Retrying database connection...');
    const connected = await connectToDatabase();
    if (connected) {
      clearInterval(retryInterval);
    }
  }
}, 30000);

// Export functions
function getPool() {
  return pool;
}

function isDatabaseConnected() {
  return pool !== null;
}

async function testQuery(query, params = []) {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return await pool.query(query, params);
}

function getDatabaseInfo() {
  return {
    connected: isDatabaseConnected(),
    url: currentUrl ? currentUrl.replace(/:([^:@]*@)/, ':***@') : null,
    attempts: connectionAttempts
  };
}

module.exports = {
  getPool,
  isDatabaseConnected,
  testQuery,
  getDatabaseInfo
};