const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Default admin already exists');
      
      // Update the admin to ensure it has proper password hashing
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      console.log('✅ Updated default admin password');
    } else {
      // Create default admin
      const defaultAdmin = new Admin({
        username: 'admin',
        displayName: 'System Administrator',
        password: 'admin123', // Will be hashed by pre-save middleware
        email: 'admin@kingchat.com',
        role: 'super_admin',
        permissions: ['manage_users', 'manage_chat', 'manage_lineoa', 'view_reports', 'system_settings'],
        status: 'offline',
        isActive: true
      });

      await defaultAdmin.save();
      console.log('✅ Created default admin:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Role: super_admin');
    }

    // Also ensure test user exists
    const testUser = await Admin.findOne({ username: 'testuser' });
    if (!testUser) {
      const newTestUser = new Admin({
        username: 'testuser',
        displayName: 'Test User',
        password: '123456',
        email: 'testuser@kingchat.com',
        role: 'admin',
        permissions: ['manage_users', 'manage_chat', 'view_reports'],
        status: 'offline',
        isActive: true
      });
      
      await newTestUser.save();
      console.log('✅ Created test user:');
      console.log('   Username: testuser');
      console.log('   Password: 123456');
      console.log('   Role: admin');
    }

    console.log('✅ Admin setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📱 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createDefaultAdmin();