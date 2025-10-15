const { Pool } = require('pg');

// ทดสอบการเชื่อมต่อฐานข้อมูล - ใช้ URL จาก production ที่ทำงาน
const pool = new Pool({
  connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@viaduct.proxy.rlwy.net:51932/railway',
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // ทดสอบ query admins table
    const result = await client.query('SELECT * FROM admins LIMIT 5');
    console.log('📊 Admins in database:', result.rows);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();