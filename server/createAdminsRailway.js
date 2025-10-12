const bcrypt = require('bcrypt');

async function createAdminsOnRailway() {
  try {
    const { Admin } = require('./models/postgresql');
    
    console.log('🏗️ Creating default admin users for Railway...');
    
    // Admin accounts for login
    const defaultAdmins = [
      {
        full_name: 'ผู้ดูแลระบบหลัก',
        username: 'admin',
        password: 'admin123',
        role: 'super_admin',
        level: 100,
        points: 5000,
        messages_handled: 500
      },
      {
        full_name: 'สมชาย ใจดี',
        username: 'somchai',
        password: 'somchai123',
        role: 'admin',
        level: 80,
        points: 3500,
        messages_handled: 350
      },
      {
        full_name: 'สุภา รักงาน',
        username: 'supha',
        password: 'supha123',
        role: 'admin',
        level: 80,
        points: 2800,
        messages_handled: 280
      },
      {
        full_name: 'วิชัย เก่งงาน',
        username: 'vichai',
        password: 'vichai123',
        role: 'admin',
        level: 80,
        points: 2200,
        messages_handled: 220
      }
    ];

    for (const adminData of defaultAdmins) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
          where: { username: adminData.username }
        });

        if (existingAdmin) {
          console.log(`⚠️  Admin '${adminData.username}' already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        
        // Create admin
        const newAdmin = await Admin.create({
          ...adminData,
          password: hashedPassword
        });

        console.log(`✅ Created admin: ${adminData.username} (${adminData.full_name})`);
        
      } catch (error) {
        console.error(`❌ Failed to create admin '${adminData.username}':`, error.message);
      }
    }

    // Display login information
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('====================');
    console.log('Username: admin     | Password: admin123     | Role: Super Admin');
    console.log('Username: somchai   | Password: somchai123   | Role: Admin');
    console.log('Username: supha     | Password: supha123     | Role: Admin');
    console.log('Username: vichai    | Password: vichai123    | Role: Admin');
    console.log('====================');
    console.log('✅ Admin users setup completed successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up admin users:', error);
    throw error;
  }
}

module.exports = { createAdminsOnRailway };