const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function fixAdminPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kingchat');
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find();
    console.log(`📋 Found ${admins.length} admin(s) to check`);

    for (const admin of admins) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashed = /^\$2[ayb]\$/.test(admin.password);
      
      if (!isHashed) {
        console.log(`🔧 Fixing password for admin: ${admin.username}`);
        
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(admin.password, saltRounds);
        
        // Update using findByIdAndUpdate to avoid pre-save middleware
        await Admin.findByIdAndUpdate(admin._id, { 
          password: hashedPassword 
        });
        
        console.log(`✅ Password hashed for: ${admin.username}`);
      } else {
        console.log(`✓ Password already hashed for: ${admin.username}`);
      }
    }

    console.log('🎉 All admin passwords are now properly hashed!');
    
    // Verify
    const updatedAdmins = await Admin.find();
    for (const admin of updatedAdmins) {
      console.log(`👤 ${admin.username}: ${admin.password.substring(0, 10)}...`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAdminPasswords();