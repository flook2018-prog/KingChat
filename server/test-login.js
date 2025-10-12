// Test login script for KingChat admin system
const bcrypt = require('bcrypt');

// Demo admin data that matches the database structure
const adminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@kingchat.com',
  password: '$2a$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y',
  displayName: 'System Administrator',
  role: 'admin'
};

async function testPassword() {
  console.log('🧪 Testing password validation...');
  
  const testPasswords = ['admin123', 'admin', 'password', '123456'];
  
  for (const password of testPasswords) {
    try {
      const isMatch = await bcrypt.compare(password, adminUser.password);
      console.log(`Password "${password}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    } catch (error) {
      console.error(`Error testing password "${password}":`, error.message);
    }
  }
}

// Function to create test admin data
async function createTestAdmin() {
  const newPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  console.log('\n🔑 Test Admin Credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('Hashed:', hashedPassword);
  
  return {
    username: 'admin',
    email: 'admin@kingchat.com',
    password: hashedPassword,
    displayName: 'System Administrator',
    role: 'admin'
  };
}

// Test JWT token creation
function testJWT() {
  const jwt = require('jsonwebtoken');
  const secret = 'KingChat-Railway-JWT-Secret-2025-Ultra-Secure-Key-9X8Y7Z';
  
  const token = jwt.sign(
    { 
      id: adminUser.id, 
      username: adminUser.username, 
      role: adminUser.role,
      email: adminUser.email
    },
    secret,
    { expiresIn: '24h' }
  );
  
  console.log('\n🎫 JWT Token Test:');
  console.log('Token:', token);
  
  try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verification successful');
    console.log('Decoded:', decoded);
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 KingChat Admin Login Test\n');
  
  await testPassword();
  await createTestAdmin();
  testJWT();
  
  console.log('\n📝 Summary:');
  console.log('- Use username: admin');
  console.log('- Use password: admin123 (if hash matches)');
  console.log('- JWT Secret is configured');
  console.log('- Login endpoint: POST /api/admin-auth/login');
}

if (require.main === module) {
  runTests();
}

module.exports = { testPassword, createTestAdmin, testJWT };