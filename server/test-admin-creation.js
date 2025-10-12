// Test script for admin creation and login
const bcrypt = require('bcrypt');

// Test password hashing
async function testPasswordHashing() {
  console.log('🧪 Testing password hashing...\n');
  
  const testPassword = 'admin123';
  const rounds = 12;
  
  // Create hash
  const hash = await bcrypt.hash(testPassword, rounds);
  console.log('Original password:', testPassword);
  console.log('Hashed password:', hash);
  
  // Test verification
  const isValid = await bcrypt.compare(testPassword, hash);
  console.log('Hash verification:', isValid ? '✅ VALID' : '❌ INVALID');
  
  // Test with existing hash from database
  const existingHash = '$2a$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y';
  console.log('\n🔍 Testing existing database hash...');
  
  const testPasswords = ['admin123', 'admin', 'password', '123456', 'kingchat'];
  
  for (const pwd of testPasswords) {
    const match = await bcrypt.compare(pwd, existingHash);
    console.log(`Password "${pwd}": ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
  }
}

// Simulate API call
function simulateAdminCreation() {
  console.log('\n📝 Example admin creation API call:');
  console.log('POST /api/admin');
  console.log('Content-Type: application/json');
  console.log('\nBody:');
  console.log(JSON.stringify({
    fullName: 'ทดสอบ แอดมิน',
    username: 'test_admin',
    password: 'test123',
    role: 'admin',
    points: 0
  }, null, 2));
  
  console.log('\n📝 Example login API call:');
  console.log('POST /api/admin-auth/login');
  console.log('Content-Type: application/json');
  console.log('\nBody:');
  console.log(JSON.stringify({
    username: 'test_admin',
    password: 'test123'
  }, null, 2));
}

async function runTests() {
  console.log('🚀 KingChat Admin Password Test\n');
  console.log('=' .repeat(50));
  
  await testPasswordHashing();
  simulateAdminCreation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Test completed!');
  console.log('\n💡 Tips:');
  console.log('- รหัสผ่านที่สร้างในหน้าจัดการแอดมินจะถูก hash แล้วเก็บในฐานข้อมูล');
  console.log('- ใช้รหัสผ่านเดิมที่ป้อนในฟอร์ม (ไม่ใช่ hash) สำหรับ login');
  console.log('- ระบบจะ hash รหัสผ่านอัตโนมัติด้วย bcrypt rounds 12');
}

if (require.main === module) {
  runTests();
}

module.exports = { testPasswordHashing };