// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testProductionAPI() {
    const baseURL = 'https://kingchat.up.railway.app';
    
    console.log('🧪 Testing Production API at:', baseURL);
    console.log('⏰ Test started at:', new Date().toISOString());
    console.log('');
    
    try {
        // Test 1: Basic connectivity
        console.log('📡 Test 1: Basic connectivity...');
        const healthResponse = await fetch(`${baseURL}/`);
        console.log('   Status:', healthResponse.status);
        console.log('   Headers:', Object.fromEntries(healthResponse.headers.entries()));
        
        if (healthResponse.ok) {
            console.log('✅ Basic connectivity works');
        } else {
            console.log('❌ Basic connectivity failed');
        }
        console.log('');
        
        // Test 2: Admin API test endpoint
        console.log('📡 Test 2: Admin API test endpoint...');
        const testResponse = await fetch(`${baseURL}/api/admin/test`);
        console.log('   Status:', testResponse.status);
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('✅ Test endpoint works:', testData.message);
        } else {
            const errorText = await testResponse.text();
            console.log('❌ Test endpoint failed:', errorText);
        }
        console.log('');
        
        // Test 3: Admin list endpoint
        console.log('📡 Test 3: Admin list endpoint...');
        const adminResponse = await fetch(`${baseURL}/api/admin`);
        console.log('   Status:', adminResponse.status);
        console.log('   Content-Type:', adminResponse.headers.get('content-type'));
        
        if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            console.log('✅ Admin endpoint works');
            console.log('📊 Admin count:', adminData.length);
            console.log('👥 Admin data sample:', adminData.slice(0, 2));
        } else {
            const errorText = await adminResponse.text();
            console.log('❌ Admin endpoint failed:', errorText);
        }
        console.log('');
        
        // Test 4: CORS check
        console.log('📡 Test 4: CORS headers check...');
        const corsResponse = await fetch(`${baseURL}/api/admin`, {
            method: 'OPTIONS'
        });
        console.log('   CORS Status:', corsResponse.status);
        console.log('   Access-Control-Allow-Origin:', corsResponse.headers.get('access-control-allow-origin'));
        console.log('   Access-Control-Allow-Methods:', corsResponse.headers.get('access-control-allow-methods'));
        console.log('');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('   Error type:', error.name);
        console.error('   Error code:', error.code);
    }
    
    console.log('⏰ Test completed at:', new Date().toISOString());
}

// Run the test
testProductionAPI();