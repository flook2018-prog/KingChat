const { Pool } = require('pg');
const bcrypt = require('bcrypt');

console.log('🔧 PostgreSQL Production Connection: Loading Railway database...');

// Railway PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway';

console.log('🔗 Database URL configured');
console.log('📍 Target: Railway PostgreSQL');

// Connection pool configuration for Railway PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30 seconds for Railway startup
  queryTimeout: 60000, // 60 seconds for queries  
  ssl: false // Railway internal connection doesn't need SSL
});

let isConnected = false;
let connectionAttempts = 0;
let fallbackData = {
  admins: []
};

// Initialize fallback admin data
async function initializeFallbackData() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    fallbackData.admins = [
      {
        id: 1,
        username: 'admin',
        password: hashedPassword,
        email: 'admin@kingchat.com',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    console.log('✅ Fallback admin data initialized');
  } catch (error) {
    console.error('❌ Error initializing fallback data:', error);
  }
}

// Test connection and create tables
async function initializeDatabase() {
  try {
    connectionAttempts++;
    console.log(`🚀 Attempting database connection... (attempt ${connectionAttempts})`);
    
    // Test connection with extended timeout since PostgreSQL is ready
    const testResult = await Promise.race([
      pool.query('SELECT NOW() as current_time, current_database() as db_name, version() as db_version'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 25 seconds')), 25000))
    ]);
    
    console.log(`✅ Connected to PostgreSQL database: ${testResult.rows[0].db_name}`);
    console.log(`⏰ Server time: ${testResult.rows[0].current_time}`);
    console.log(`🗄️ PostgreSQL version: ${testResult.rows[0].db_version.split(' ')[0]} ${testResult.rows[0].db_version.split(' ')[1]}`);
    
    isConnected = true;
    
    // Create admin table
    await createAdminTable();
    
    // Create default admins
    await createDefaultAdmins();
    
    console.log('🎯 Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error(`❌ Database connection failed (attempt ${connectionAttempts}):`, error.message);
    isConnected = false;
    
    // Retry with extended delays since PostgreSQL is ready but may need time
    if (connectionAttempts < 8) { // More attempts
      const retryDelay = Math.min(5000 + (connectionAttempts * 3000), 20000); // 5s, 8s, 11s, 14s, 17s, 20s, 20s
      console.log(`🔄 PostgreSQL is ready, retrying connection in ${retryDelay/1000} seconds... (attempt ${connectionAttempts + 1}/8)`);
      setTimeout(() => {
        initializeDatabase();
      }, retryDelay);
    } else {
      console.error('💥 Maximum connection attempts reached. PostgreSQL is ready but connection failed.');
      console.error('🔄 Switching to fallback mode while PostgreSQL stabilizes...');
      await initializeFallbackData();
    }
    
    return false;
  }
}

// Create admin table
async function createAdminTable() {
  try {
    console.log('🏗️ Creating admin table...');
    
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
    
    console.log('✅ Admin table created/verified');
    
  } catch (error) {
    console.error('❌ Error creating admin table:', error.message);
    throw error;
  }
}

// Create default admin accounts
async function createDefaultAdmins() {
  try {
    console.log('👤 Creating default admin accounts...');
    
    // Check if any admins exist
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins');
    const count = parseInt(adminCount.rows[0].count);
    
    if (count === 0) {
      console.log('📝 No admins found, creating default admin...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(`
        INSERT INTO admins (username, password, email, role, status)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', hashedPassword, 'admin@kingchat.com', 'admin', 'active']);
      
      console.log('✅ Default admin created: admin / admin123');
    } else {
      console.log(`📊 Found ${count} existing admin(s)`);
    }
    
  } catch (error) {
    console.error('❌ Error creating default admins:', error.message);
    throw error;
  }
}

// Execute query with fallback
async function executeQuery(query, params = []) {
  if (isConnected) {
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('❌ Database query failed, falling back to memory storage:', error.message);
      isConnected = false;
      // Fall through to fallback mode
    }
  }
  
  // Fallback mode
  console.log('⚠️ Using fallback mode for query:', query.substring(0, 50) + '...');
  
  // Handle different query types
  if (query.includes('SELECT')) {
    if (query.includes('COUNT(*)')) {
      // Count query
      return { rows: [{ count: fallbackData.admins.length.toString() }] };
    }
    
    if (query.includes('WHERE')) {
      // SELECT with WHERE clause
      if (query.includes('username = $1') && params[0]) {
        const admin = fallbackData.admins.find(a => a.username === params[0]);
        return { rows: admin ? [admin] : [] };
      }
      if (query.includes('id = $1') && params[0]) {
        const admin = fallbackData.admins.find(a => a.id === parseInt(params[0]));
        return { rows: admin ? [admin] : [] };
      }
    }
    
    // Default SELECT all admins
    return { rows: fallbackData.admins };
  }
  
  if (query.includes('INSERT INTO admins')) {
    const newId = fallbackData.admins.length + 1;
    const newAdmin = {
      id: newId,
      username: params[0],
      password: params[1],
      email: params[2],
      role: params[3] || 'admin',
      status: params[4] || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackData.admins.push(newAdmin);
    console.log(`✅ Fallback: Added admin ${params[0]} with ID ${newId}`);
    return { rows: [newAdmin] };
  }
  
  if (query.includes('UPDATE admins')) {
    // Handle UPDATE queries
    if (query.includes('WHERE id = $')) {
      const adminId = params[params.length - 1]; // Last parameter is usually the ID
      const adminIndex = fallbackData.admins.findIndex(a => a.id === parseInt(adminId));
      if (adminIndex !== -1) {
        // Update admin (simplified)
        fallbackData.admins[adminIndex].updated_at = new Date().toISOString();
        return { rows: [fallbackData.admins[adminIndex]] };
      }
    }
  }
  
  if (query.includes('DELETE FROM admins')) {
    // Handle DELETE queries
    if (query.includes('WHERE id = $1') && params[0]) {
      const adminIndex = fallbackData.admins.findIndex(a => a.id === parseInt(params[0]));
      if (adminIndex !== -1) {
        const deletedAdmin = fallbackData.admins.splice(adminIndex, 1)[0];
        return { rows: [deletedAdmin] };
      }
    }
  }
  
  return { rows: [] };
}

// Get connection pool
function getPool() {
  return pool;
}

// Check if database is connected
function isDatabaseConnected() {
  return isConnected;
}

// Get status
function getStatus() {
  return {
    connected: isConnected,
    attempts: connectionAttempts,
    fallback: !isConnected,
    admins_count: fallbackData.admins.length
  };
}

// Initialize database on module load
console.log('🚀 Initializing PostgreSQL connection...');
initializeDatabase();

module.exports = {
  getPool,
  isDatabaseConnected,
  executeQuery,
  initializeDatabase,
  getStatus
};