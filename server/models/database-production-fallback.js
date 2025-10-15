const { Pool } = require('pg');
const bcrypt = require('bcrypt');

console.log('🔧 PostgreSQL Production Connection: Loading Railway database...');

// Railway PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway';

console.log('🔗 Database URL configured');
console.log('📍 Target: Railway PostgreSQL');

// Connection pool configuration
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
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
    
    // Test connection with shorter timeout
    const testResult = await Promise.race([
      pool.query('SELECT NOW() as current_time, current_database() as db_name'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 8000))
    ]);
    
    console.log(`✅ Connected to database: ${testResult.rows[0].db_name}`);
    console.log(`⏰ Server time: ${testResult.rows[0].current_time}`);
    
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
    
    // Retry after delay
    if (connectionAttempts < 3) { // Reduced attempts
      console.log(`🔄 Retrying in 5 seconds...`);
      setTimeout(() => {
        initializeDatabase();
      }, 5000);
    } else {
      console.error('💥 Maximum connection attempts reached. Using fallback mode.');
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
  
  // Simple fallback for common queries
  if (query.includes('SELECT') && query.includes('admins')) {
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
    return { rows: [newAdmin] };
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