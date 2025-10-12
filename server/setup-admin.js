const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { pool } = require('./models/database');

async function setupAdmins() {
  try {
    console.log('🔧 Setting up admin users...');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    
    // Create admin users
    const admins = [
      {
        full_name: 'ผู้ดูแลระบบ',
        username: 'admin',
        password: adminPassword,
        role: 'super_admin',
        level: 100,
        points: 5000,
        messages_handled: 500
      },
      {
        full_name: 'สมชาย ใจดี',
        username: 'somchai_admin',
        password: adminPassword,
        role: 'admin',
        level: 80,
        points: 2500,
        messages_handled: 250
      },
      {
        full_name: 'สุภา รักงาน',
        username: 'supha_admin',
        password: adminPassword,
        role: 'admin',
        level: 80,
        points: 2000,
        messages_handled: 200
      }
    ];

    // Insert admins into database
    for (const admin of admins) {
      try {
        await pool.query(
          `INSERT INTO admins (full_name, username, password, role, level, points, messages_handled, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (username) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           password = EXCLUDED.password,
           role = EXCLUDED.role,
           level = EXCLUDED.level,
           points = EXCLUDED.points,
           messages_handled = EXCLUDED.messages_handled,
           updated_at = NOW()`,
          [
            admin.full_name,
            admin.username,
            admin.password,
            admin.role,
            admin.level,
            admin.points,
            admin.messages_handled
          ]
        );
        console.log(`✅ Admin created/updated: ${admin.username}`);
      } catch (error) {
        console.error(`❌ Error creating admin ${admin.username}:`, error.message);
      }
    }

    console.log('\n🎉 Admin setup completed!');
    console.log('\n📝 Login credentials:');
    console.log('   Super Admin: admin / admin123');
    console.log('   Admin 1: somchai_admin / admin123');
    console.log('   Admin 2: supha_admin / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupAdmins();
}

module.exports = { setupAdmins };