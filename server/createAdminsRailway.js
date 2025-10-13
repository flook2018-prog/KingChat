const bcrypt = require('bcrypt');

async function createAdminsOnRailway() {
      console.log('🔐 LOGIN CREDENTIALS:');
    console.log('====================');
    console.log('Username: admin       | Password: admin123     | Role: Super Admin');
    console.log('Username: somchai     | Password: somchai123   | Role: Admin');
    console.log('Username: supha       | Password: supha123     | Role: Admin');
    console.log('Username: vichai      | Password: vichai123    | Role: Admin');
    console.log('Username: supha_admin | Password: password123  | Role: Admin');
    console.log('====================');    const { Admin } = require('./models/postgresql');
    
    console.log('🏗️ Creating default admin users for Railway...');
    
    // Admin accounts for login
    const defaultAdmins = [
      {
        displayName: 'ผู้ดูแลระบบหลัก',
        username: 'admin',
        email: 'admin@kingchat.com',
        password: 'admin123',
        role: 'super_admin',
        permissions: ['all']
      },
      {
        displayName: 'สมชาย ใจดี',
        username: 'somchai',
        email: 'somchai@kingchat.com',
        password: 'somchai123',
        role: 'admin',
        permissions: ['admin']
      },
      {
        displayName: 'สุภา รักงาน',
        username: 'supha',
        email: 'supha@kingchat.com',
        password: 'supha123',
        role: 'admin',
        permissions: ['admin']
      },
      {
        displayName: 'วิชัย เก่งงาน',
        username: 'vichai',
        email: 'vichai@kingchat.com',
        password: 'vichai123',
        role: 'admin',
        permissions: ['admin']
      },
      {
        displayName: 'สุภา ผู้ดูแล',
        username: 'supha_admin',
        email: 'supha_admin@kingchat.com',
        password: 'password123',
        role: 'admin',
        permissions: ['admin']
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

        console.log(`✅ Created admin: ${adminData.username} (${adminData.displayName})`);
        
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