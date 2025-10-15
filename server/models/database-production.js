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
  connectionTimeoutMillis: 5000,
  ssl: false // Railway internal connection doesn't need SSL
});

let isConnected = false;
let connectionAttempts = 0;

// Test connection and create tables
async function initializeDatabase() {
  try {
    connectionAttempts++;
    console.log(`🚀 Attempting database connection... (attempt ${connectionAttempts})`);
    
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
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
    if (connectionAttempts < 5) {
      console.log(`🔄 Retrying in 10 seconds...`);
      setTimeout(() => {
        initializeDatabase();
      }, 10000);
    } else {
      console.error('💥 Maximum connection attempts reached. Database unavailable.');
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
      const defaultAdmins = [
        { username: 'admin', password: 'admin123', role: 'super-admin', email: 'admin@kingchat.com' },
        { username: 'manager', password: 'manager123', role: 'admin', email: 'manager@kingchat.com' },
        { username: 'operator', password: 'operator123', role: 'operator', email: 'operator@kingchat.com' }
      ];
      
      for (const admin of defaultAdmins) {
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        await pool.query(
          'INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [admin.username, hashedPassword, admin.email, admin.role, 'active']
        );
        console.log(`✅ Created admin: ${admin.username} (${admin.role})`);
      }
      
      console.log(`🎯 Created ${defaultAdmins.length} default admin accounts`);
    } else {
      console.log(`📊 Found ${count} existing admin accounts`);
      
      // Show existing admins
      const existingAdmins = await pool.query('SELECT username, role, status FROM admins');
      existingAdmins.rows.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.role}) [${admin.status}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error creating default admins:', error.message);
  }
}

// Check if database is connected
function isDatabaseConnected() {
  return isConnected;
}

// Get database pool
function getPool() {
  if (!isConnected) {
    throw new Error('Database not connected');
  }
  return pool;
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  if (!isConnected) {
    throw new Error('Database not connected');
  }
  
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    console.error('📝 Query:', query);
    console.error('🔢 Params:', params);
    throw error;
  }
}

// Start database initialization
console.log('🚀 Initializing PostgreSQL connection...');
initializeDatabase();

module.exports = {
  pool,
  getPool,
  isDatabaseConnected,
  executeQuery,
  initializeDatabase
};