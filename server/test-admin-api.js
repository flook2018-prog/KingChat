// Quick Admin API Test
// Using built-in fetch (Node.js 18+)

async function testAdminAPI() {
  console.log('🧪 Testing Admin API...');
  
  try {
    const response = await fetch('https://kingchat-up.railway.app/api/admin');
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin API working!');
      console.log('👥 Admin count:', data.length);
      console.log('📊 Admin data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      const text = await response.text();
      console.log('📄 Error body:', text);
    }
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAdminAPI();