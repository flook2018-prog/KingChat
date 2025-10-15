const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Direct database connection for Railway
let pool = null;
let isConnected = false;

// Railway database URLs to try
const databaseUrls = [
  // Primary Railway database URL from environment
  process.env.DATABASE_URL,
  
  // Backup URLs with different Railway proxy hosts
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@viaduct.proxy.rlwy.net:51932/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@autorack.proxy.rlwy.net:33388/railway', 
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@ballast.proxy.rlwy.net:38432/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@junction.proxy.rlwy.net:43062/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@monorail.proxy.rlwy.net:16543/railway'
].filter(Boolean);

async function connectToDatabase() {
  console.log('🔍 Attempting to connect to Railway PostgreSQL...');
  
  for (const url of databaseUrls) {
    try {
      console.log(`🔄 Testing: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')}`);
      
      const testPool = new Pool({
        connectionString: url,
        ssl: {
          rejectUnauthorized: false
        },
        max: 1,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 5000,
      });

      // Test connection
      const result = await testPool.query('SELECT NOW() as current_time');
      await testPool.end();
      
      // Create the actual pool
      pool = new Pool({
        connectionString: url,
        ssl: {
          rejectUnauthorized: false
        },
        max: 10,
        min: 2,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      });
      
      isConnected = true;
      console.log(`✅ Connected to Railway PostgreSQL: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')}`);
      console.log(`📅 Database time: ${result.rows[0].current_time}`);
      
      // Setup tables
      await setupDatabaseTables();
      return true;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }
      isConnected = false;
    }
  }
  
  console.log('❌ Could not connect to any database URL');
  return false;
}

async function setupDatabaseTables() {
  if (!pool) return;
  
  try {
    console.log('🔧 Setting up database tables...');
    
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    // Check if we have any admins
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins');
    console.log(`📊 Current admin count: ${adminCount.rows[0].count}`);
    
    // Insert default admins if table is empty
    if (parseInt(adminCount.rows[0].count) === 0) {
      console.log('🔧 Creating default admin accounts...');
      
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await pool.query(`
        INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES 
        ('admin', $1, 'admin@kingchat.com', 'super-admin', 'active', NOW(), NOW()),
        ('manager', $1, 'manager@kingchat.com', 'admin', 'active', NOW(), NOW()),
        ('operator', $1, 'operator@kingchat.com', 'operator', 'active', NOW(), NOW()),
        ('GGG', $1, 'ggg@kingchat.com', 'super-admin', 'active', NOW(), NOW())
      `, [hashedPassword]);
      
      console.log('✅ Default admin accounts created with password: admin123');
    }
    
    // Create other necessary tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS line_oa_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        channel_id VARCHAR(255),
        channel_secret VARCHAR(255),
        channel_access_token TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        line_user_id VARCHAR(255),
        display_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ All database tables setup completed');
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
  }
}

// Get database pool
function getPool() {
  return pool;
}

// Check if connected
function isDatabaseConnected() {
  return isConnected && pool !== null;
}

// Test query with error handling
async function testQuery(query, params = []) {
  if (!isDatabaseConnected()) {
    throw new Error('Database not connected');
  }
  
  try {
    return await pool.query(query, params);
  } catch (error) {
    console.error('❌ Database query failed:', error.message);
    throw error;
  }
}

// Initialize connection when module loads
console.log('🚀 Initializing database connection...');
connectToDatabase().catch(error => {
  console.error('❌ Initial database connection failed:', error.message);
});

module.exports = {
  getPool,
  isDatabaseConnected,
  testQuery,
  connectToDatabase,
  setupDatabaseTables
};