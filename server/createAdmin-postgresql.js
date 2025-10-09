const { sequelize, testConnection } = require('./config/database');
const bcrypt = require('bcryptjs');

// Create Admin table manually using raw SQL
async function createAdminTable() {
  try {
    console.log('🔄 Creating Admin table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "displayName" VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        permissions TEXT DEFAULT '[]',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Admin table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating admin table:', error.message);
    return false;
  }
}

// Create admin user
async function createAdminUser() {
  try {
    console.log('👤 Creating admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Check if admin already exists
    const [existingAdmin] = await sequelize.query(`
      SELECT id FROM admins WHERE username = 'admin' OR email = 'admin@kingchat.com';
    `);
    
    if (existingAdmin.length > 0) {
      console.log('ℹ️  Admin user already exists');
      return true;
    }
    
    // Create admin user
    await sequelize.query(`
      INSERT INTO admins (username, email, password, "displayName", role, permissions, "isActive")
      VALUES ('admin', 'admin@kingchat.com', :password, 'System Administrator', 'admin', '["all"]', true);
    `, {
      replacements: { password: hashedPassword }
    });
    
    console.log('✅ Admin user created successfully');
    console.log('📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return false;
  }
}

// Main initialization function
async function initializeAdmin() {
  try {
    console.log('🚀 Initializing KingChat Admin...');
    console.log('🗄️  Database: PostgreSQL');
    console.log('🔗 Connection: Railway PostgreSQL');
    
    // Test database connection
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    // Create admin table
    const tableCreated = await createAdminTable();
    if (!tableCreated) {
      throw new Error('Failed to create admin table');
    }
    
    // Create admin user
    const adminCreated = await createAdminUser();
    if (!adminCreated) {
      throw new Error('Failed to create admin user');
    }
    
    console.log('🎉 Admin initialization completed successfully!');
    console.log('🌐 You can now access: https://kingchat-production.up.railway.app/login');
    console.log('🔐 Login with: admin / admin123');
    
  } catch (error) {
    console.error('❌ Admin initialization failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run initialization
if (require.main === module) {
  initializeAdmin();
}

module.exports = { initializeAdmin, createAdminTable, createAdminUser };