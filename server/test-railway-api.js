// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

async function testRailwayAPI() {
    const baseURL = 'https://kingchat.up.railway.app/api/admin';
    
    console.log('🧪 Testing Railway API after database fix...');
    console.log('⏰ Test started at:', new Date().toISOString());
    console.log('');
    
    try {
        // Test 1: Check if API is working
        console.log('📡 Test 1: Basic API connectivity...');
        const response = await fetch(baseURL);
        console.log('   Status:', response.status);
        console.log('   Content-Type:', response.headers.get('content-type'));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Response successful');
            console.log('📊 Admin count:', data.length);
            
            if (data.length > 0) {
                console.log('👥 Admin data structure:');
                console.log('   Sample admin:', JSON.stringify(data[0], null, 2));
                
                // Validate data structure
                const firstAdmin = data[0];
                const requiredFields = ['id', 'fullName', 'username', 'role', 'points'];
                const missingFields = requiredFields.filter(field => !(field in firstAdmin));
                
                if (missingFields.length === 0) {
                    console.log('✅ All required fields present');
                } else {
                    console.log('❌ Missing fields:', missingFields);
                }
                
                // Test individual admin details
                console.log('');
                console.log('👤 All admins:');
                data.forEach((admin, index) => {
                    console.log(`   ${index + 1}. ${admin.fullName} (@${admin.username}) - ${admin.role} - ${admin.points} points`);
                });
                
            } else {
                console.log('⚠️ No admin data returned');
            }
            
        } else {
            const errorText = await response.text();
            console.log('❌ API Error:', errorText);
        }
        
        console.log('');
        
        // Test 2: Check specific admin endpoint
        console.log('📡 Test 2: Specific admin endpoint...');
        try {
            const adminResponse = await fetch(`${baseURL}/1`);
            if (adminResponse.ok) {
                const adminData = await adminResponse.json();
                console.log('✅ Individual admin endpoint works');
                console.log('👤 Admin #1:', JSON.stringify(adminData, null, 2));
            } else {
                console.log('❌ Individual admin endpoint failed:', adminResponse.status);
            }
        } catch (adminError) {
            console.log('❌ Individual admin test failed:', adminError.message);
        }
        
        console.log('');
        
        // Test 3: Check test endpoint
        console.log('📡 Test 3: Test endpoint...');
        try {
            const testResponse = await fetch(`${baseURL}/test`);
            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('✅ Test endpoint works:', testData.message);
            } else {
                console.log('❌ Test endpoint failed:', testResponse.status);
            }
        } catch (testError) {
            console.log('❌ Test endpoint error:', testError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('   Error type:', error.name);
    }
    
    console.log('');
    console.log('⏰ Test completed at:', new Date().toISOString());
}

// Run the test without requiring node-fetch
if (typeof fetch === 'undefined') {
    // Use built-in fetch for Node.js 18+
    global.fetch = require('https').get;
    
    // Simple fetch implementation for testing
    global.fetch = async function(url, options = {}) {
        const https = require('https');
        const { URL } = require('url');
        
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const req = https.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        headers: {
                            get: (name) => res.headers[name.toLowerCase()]
                        },
                        text: () => Promise.resolve(data),
                        json: () => Promise.resolve(JSON.parse(data))
                    });
                });
            });
            
            req.on('error', reject);
            if (options.body) req.write(options.body);
            req.end();
        });
    };
}

testRailwayAPI();