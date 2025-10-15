const { Pool } = require('pg');

// Use Railway environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupAdminTable() {
  try {
    console.log('🚀 Setting up admin table on Railway PostgreSQL...');
    
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
    
    console.log('✅ Admin table created successfully');
    
    // Check if admin exists
    const adminCheck = await pool.query('SELECT COUNT(*) as count FROM admins WHERE username = $1', ['admin']);
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('🔧 Creating default admin...');
      
      // Create default admin (password: admin123)
      await pool.query(`
        INSERT INTO admins (username, password, role, status)
        VALUES ($1, $2, $3, $4)
      `, ['admin', '$2b$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y', 'super_admin', 'active']);
      
      console.log('✅ Default admin created: admin/admin123');
    } else {
      console.log('ℹ️ Admin already exists');
    }
    
    // Show current admins
    const admins = await pool.query('SELECT id, username, role, status, created_at FROM admins');
    console.log('📋 Current admins in database:');
    console.table(admins.rows);
    
    console.log('🎯 Admin system ready!');
    console.log('🔗 Test at: https://kingchat.up.railway.app/client/admin-working.html');
    
  } catch (error) {
    console.error('❌ Error setting up admin table:', error);
  } finally {
    await pool.end();
  }
}

// Run if this script is called directly
if (require.main === module) {
  setupAdminTable();
}

module.exports = { setupAdminTable };