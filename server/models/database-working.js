const { Pool } = require('pg');

// Database connection with multiple fallback URLs
const databaseUrls = [
  // Railway internal URLs
  process.env.DATABASE_URL,
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres.railway.internal:5432/railway',
  
  // Railway proxy URLs (external accessible)
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@viaduct.proxy.rlwy.net:51932/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@autorack.proxy.rlwy.net:33388/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@ballast.proxy.rlwy.net:38432/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@junction.proxy.rlwy.net:43062/railway'
].filter(Boolean); // Remove undefined values

let workingPool = null;
let isConnected = false;

// Test connection function
async function testConnection(url) {
  const testPool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 3000,
    statement_timeout: 3000,
  });

  try {
    const result = await testPool.query('SELECT NOW() as current_time, version() as db_version');
    console.log(`✅ Database connection successful: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')}`);
    console.log(`📅 Database time: ${result.rows[0].current_time}`);
    return testPool;
  } catch (error) {
    console.log(`❌ Failed: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')} - ${error.message}`);
    await testPool.end().catch(() => {});
    return null;
  }
}

// Initialize database connection
async function initializeDatabase() {
  console.log('🔍 Testing database connections...');
  
  for (const url of databaseUrls) {
    console.log(`🔄 Testing: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')}`);
    
    const pool = await testConnection(url);
    if (pool) {
      workingPool = pool;
      isConnected = true;
      
      // Configure the working pool with better settings
      await workingPool.end();
      workingPool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        max: 20,
        min: 2,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        statement_timeout: 10000,
      });
      
      console.log(`🎉 Using database: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')}`);
      
      // Initialize tables
      await setupTables();
      return workingPool;
    }
  }
  
  console.log('❌ No working database connection found');
  isConnected = false;
  return null;
}

// Setup required tables
async function setupTables() {
  if (!workingPool) return;
  
  try {
    console.log('🔧 Setting up database tables...');
    
    // Create admins table
    await workingPool.query(`
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
    const adminCount = await workingPool.query('SELECT COUNT(*) FROM admins');
    console.log(`📊 Current admin count: ${adminCount.rows[0].count}`);
    
    // Insert default admins if none exist
    if (parseInt(adminCount.rows[0].count) === 0) {
      console.log('🔧 Creating default admin accounts...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await workingPool.query(`
        INSERT INTO admins (username, password, email, role, status) VALUES 
        ('admin', $1, 'admin@kingchat.com', 'super-admin', 'active'),
        ('manager', $1, 'manager@kingchat.com', 'admin', 'active'),
        ('operator', $1, 'operator@kingchat.com', 'operator', 'active'),
        ('GGG', $1, 'ggg@kingchat.com', 'super-admin', 'active')
      `, [hashedPassword]);
      
      console.log('✅ Default admin accounts created');
    }
    
    // Create other tables
    await workingPool.query(`
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
    
    await workingPool.query(`
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
    
    console.log('✅ Database tables setup completed');
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error.message);
  }
}

// Get pool instance
function getPool() {
  return workingPool;
}

// Check if connected
function isDbConnected() {
  return isConnected;
}

// Initialize on module load
initializeDatabase().catch(error => {
  console.error('❌ Database initialization failed:', error.message);
});

module.exports = {
  getPool,
  isDbConnected,
  initializeDatabase,
  setupTables
};