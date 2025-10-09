const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingchat');
    console.log('✅ Connected to MongoDB');

    // Delete existing test admin if exists
    await Admin.deleteOne({ username: 'testadmin' });
    
    // Create new test admin
    const testAdmin = new Admin({
      username: 'testadmin',
      displayName: 'Test Administrator',
      password: 'admin123', // This will be hashed by pre-save middleware
      email: 'testadmin@kingchat.com',
      role: 'admin',
      permissions: ['manage_users', 'manage_chat', 'manage_lineoa', 'view_reports', 'system_settings'],
      status: 'offline',
      isActive: true
    });

    const savedAdmin = await testAdmin.save();
    
    console.log('✅ Test admin created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: testadmin');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestAdmin();