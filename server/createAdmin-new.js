const { User } = require('./models/postgresql');
const { testConnection } = require('./config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to PostgreSQL
    await testConnection();
    console.log('✅ Connected to PostgreSQL');

    // Sync the User model
    await User.sync();

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ where: { role: 'super_admin' } });
    if (existingAdmin) {
      console.log('❌ Super Admin user already exists:', existingAdmin.username);
      console.log('📧 Email:', existingAdmin.email);
      return;
    }

    // Create super admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@kingchat.com',
      password: 'admin123', // Will be hashed automatically by model hook
      displayName: 'System Administrator',
      role: 'super_admin',
      isActive: true,
      permissions: JSON.stringify({
        canManageUsers: true,
        canManageLineOA: true,
        canViewAllChats: true,
        canManageSettings: true,
        canManageAdmins: true
      })
    });

    console.log('✅ Super Admin user created successfully');
    console.log('📧 Email: admin@kingchat.com'); 
    console.log('🔑 Username: admin');
    console.log('🔒 Password: admin123');
    console.log('👑 Role: super_admin');
    console.log('🆔 ID:', admin.id);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;