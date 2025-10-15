const { Pool } = require('pg');

// Create a simple database setup script to ensure admin table exists
const pool = new Pool({
  connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@autorack.proxy.rlwy.net:33388/railway',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function setupAdminTable() {
  try {
    console.log('🚀 Setting up admin table...');
    
    // Create admins table with the correct structure
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    console.log('✅ Admin table created successfully');
    
    // Check if any admin exists
    const adminCount = await pool.query('SELECT COUNT(*) as count FROM admins');
    console.log(`👥 Current admin count: ${adminCount.rows[0].count}`);
    
    if (parseInt(adminCount.rows[0].count) === 0) {
      console.log('🔧 Creating default admin...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await pool.query(`
        INSERT INTO admins (username, password, role, status)
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 'super_admin', 'active']);
      
      console.log('✅ Default admin created: admin/admin123');
    }
    
    // Test query
    const admins = await pool.query('SELECT id, username, role, status, created_at FROM admins');
    console.log('📋 Current admins:', admins.rows);
    
  } catch (error) {
    console.error('❌ Admin table setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupAdminTable();