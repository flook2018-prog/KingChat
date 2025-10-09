const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function showAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingchat');
    
    const admins = await Admin.find();
    console.log('📋 Admin credentials for testing:');
    
    for(const admin of admins) {
      console.log(`👤 Username: ${admin.username}`);
      console.log(`   Display Name: ${admin.displayName}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.isActive}`);
      console.log('');
    }
    
    console.log('🔑 Try these common passwords for login:');
    console.log('- admin123');
    console.log('- king123456'); 
    console.log('- 123456');
    console.log('- password');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

showAdmins();