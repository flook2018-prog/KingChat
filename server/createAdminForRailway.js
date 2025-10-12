const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@junction.proxy.rlwy.net:41738/railway',
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 เชื่อมต่อ PostgreSQL สำเร็จ');
    
    // สร้างตาราง admins ถ้ายังไม่มี
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        level INTEGER DEFAULT 80,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    console.log('✅ ตาราง admins ถูกสร้างแล้ว');
    
    // สร้างรหัสผ่านแบบ hash
    const password1 = await bcrypt.hash('admin123', 10);
    const password2 = await bcrypt.hash('kingchat2024', 10);
    const password3 = await bcrypt.hash('superadmin', 10);
    
    // ลบข้อมูลเก่า (ถ้ามี)
    await client.query('DELETE FROM admins');
    
    // เพิ่มผู้ใช้ใหม่
    const users = [
      { username: 'admin', password: password1, level: 100 },
      { username: 'kingchat', password: password2, level: 80 },
      { username: 'superadmin', password: password3, level: 100 }
    ];
    
    for (const user of users) {
      await client.query(
        'INSERT INTO admins (username, password, level) VALUES ($1, $2, $3)',
        [user.username, user.password, user.level]
      );
      console.log(`✅ สร้าง user: ${user.username} (level: ${user.level}) สำเร็จ`);
    }
    
    // แสดงรายการผู้ใช้ทั้งหมด
    const result = await client.query('SELECT id, username, level, created_at FROM admins ORDER BY id');
    
    console.log('\n🎉 สร้างผู้ใช้สำเร็จ! รายการผู้ใช้ในระบบ:');
    console.log('====================================');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id} | Username: ${row.username} | Level: ${row.level} | สร้างเมื่อ: ${row.created_at}`);
    });
    
    console.log('\n🔑 รหัสเข้าใช้งาน:');
    console.log('====================================');
    console.log('1. Username: admin     | Password: admin123     | Level: Super Admin');
    console.log('2. Username: kingchat  | Password: kingchat2024 | Level: Admin');
    console.log('3. Username: superadmin| Password: superadmin   | Level: Super Admin');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// รันฟังก์ชัน
createAdminUser();