const https = require('https');

console.log('🔍 Railway Environment Variables Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('   PORT:', process.env.PORT);

if (process.env.DATABASE_URL) {
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]*@)/, ':***@');
  console.log('   DATABASE_URL (masked):', maskedUrl);
}

// Test API connection
console.log('\n🌐 Testing API connection...');
https.get('https://kingchat.up.railway.app/api/admin', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('✅ API Response received');
      console.log('   Success:', parsed.success);
      console.log('   Database:', parsed.database || 'Not specified');
      console.log('   Fallback:', parsed.fallback || 'Not specified');
      console.log('   Admin count:', parsed.admins ? parsed.admins.length : 'No admins');
      console.log('   Message:', parsed.message || 'No message');
      
      if (parsed.admins && parsed.admins.length > 0) {
        console.log('\n👤 Admin accounts found:');
        parsed.admins.forEach(admin => {
          console.log(`   - ${admin.username} (${admin.role})`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to parse API response:', error.message);
      console.log('📄 Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error('❌ API request failed:', error.message);
});

console.log('\n⏳ Waiting for API response...');