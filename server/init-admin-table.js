// Simple admin table creation script for Railway
const { Pool } = require('pg');

async function createAdminTable() {
  // Use Railway's internal database URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway',
    ssl: false // Internal connection doesn't need SSL
  });

  try {
    console.log('🚀 Creating admin table...');
    
    // Create admins table
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
    
    console.log('✅ Admin table created');
    
    // Create default admin if not exists
    const existingAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    
    if (existingAdmin.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await pool.query(`
        INSERT INTO admins (username, password, role, status)
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, 'super_admin', 'active']);
      
      console.log('✅ Default admin created: admin/admin123');
    } else {
      console.log('ℹ️ Admin already exists');
    }
    
    // Show current admins
    const admins = await pool.query('SELECT id, username, role, status, created_at FROM admins');
    console.log('📋 Current admins:');
    console.table(admins.rows);
    
    return { success: true, admins: admins.rows };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
  }
}

// Auto-run when server starts
createAdminTable().then(result => {
  console.log('🎯 Admin setup result:', result);
});

module.exports = { createAdminTable };