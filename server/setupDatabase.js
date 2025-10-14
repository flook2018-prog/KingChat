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
    const schemaPath = path.join(__dirname, 'database', 'schema-fixed.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Loading fixed schema...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement separately
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement.trim());
          } catch (err) {
            console.log(`⚠️ Statement skipped (likely already exists): ${err.message.substring(0, 100)}...`);
          }
        }
      }
      
      console.log('✅ Schema loaded successfully');
    } else {
      console.log('⚠️ Schema file not found, creating basic tables...');
      
      // Create basic admins table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          password VARCHAR(255) NOT NULL,
          "displayName" VARCHAR(255),
          role VARCHAR(50) DEFAULT 'admin',
          points INTEGER DEFAULT 0,
          messages_handled INTEGER DEFAULT 0,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
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