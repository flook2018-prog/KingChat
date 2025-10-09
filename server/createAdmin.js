const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingchat');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      return;
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@kingchat.com',
      password: 'admin123', // Will be hashed automatically
      displayName: 'System Administrator',
      role: 'admin',
      permissions: {
        canManageUsers: true,
        canManageLineOA: true,
        canViewAllChats: true,
        canManageSettings: true
      }
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@kingchat.com');
    console.log('🔑 Username: admin');
    console.log('🔒 Password: admin123');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();