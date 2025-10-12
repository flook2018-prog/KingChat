// สคริปต์สร้างรหัสผู้ใช้ง่าย ๆ
console.log('🎉 รหัสเข้าใช้งาน KingChat System');
console.log('====================================');
console.log('');

// รายการผู้ใช้ที่แนะนำ
const users = [
  {
    username: 'admin',
    password: 'admin123', 
    level: 100,
    role: 'Super Admin',
    description: 'ผู้ดูแลระบบระดับสูงสุด'
  },
  {
    username: 'kingchat',
    password: 'kingchat2024',
    level: 80, 
    role: 'Admin',
    description: 'ผู้ดูแลระบบทั่วไป'
  },
  {
    username: 'manager',
    password: 'manager123',
    level: 70,
    role: 'Manager', 
    description: 'ผู้จัดการ'
  },
  {
    username: 'user',
    password: 'user123',
    level: 50,
    role: 'User',
    description: 'ผู้ใช้ทั่วไป'
  }
];

console.log('🔑 รหัสเข้าใช้งานที่แนะนำ:');
console.log('====================================');

users.forEach((user, index) => {
  console.log(`${index + 1}. Username: ${user.username.padEnd(12)} | Password: ${user.password.padEnd(15)} | Level: ${user.level} (${user.role})`);
  console.log(`   ${user.description}`);
  console.log('');
});

console.log('🌐 Website URL: https://kingchat.up.railway.app');
console.log('');
console.log('🔧 คำแนะนำ:');
console.log('- ใช้ admin/admin123 สำหรับการทดสอบ');
console.log('- ปรับเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบ');
console.log('- ระบบรองรับ 2 ระดับผู้ใช้: Super Admin (100) และ Admin (80)');
console.log('');

// แสดงวันที่สร้าง
const now = new Date();
console.log(`📅 สร้างเมื่อ: ${now.toLocaleString('th-TH')}`);
console.log('');

console.log('✅ หากระบบทำงานปกติ รหัสเหล่านี้ควรใช้งานได้');
console.log('❗ หากยังไม่ได้ ให้ตรวจสอบการเชื่อมต่อ Database');

// JSON format สำหรับ import
console.log('');
console.log('📋 JSON Format (สำหรับ Database Import):');
console.log('====================================');
console.log(JSON.stringify(users, null, 2));