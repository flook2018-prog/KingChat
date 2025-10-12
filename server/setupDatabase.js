const { pool } = require('./models/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing PostgreSQL database...');
    
    // Create admins table first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        level INTEGER DEFAULT 80,
        role VARCHAR(50) DEFAULT 'admin',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Admins table created');
    
    // Create default admin if not exists
    const existingAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(`
        INSERT INTO admins (username, email, password, level, role, "isActive") 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', 'admin@kingchat.com', hashedPassword, 100, 'super_admin', true]);
      
      console.log('✅ Default admin created: admin/admin123');
    }
    
    // Read schema file if exists
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
    }
    
    console.log('✅ Database initialized successfully');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - line_accounts');
    console.log('   - customers');
    console.log('   - chat_messages');
    console.log('   - quick_messages');
    console.log('   - broadcast_messages');
    
    // Test the connection
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Users in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };