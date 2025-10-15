const { Pool } = require('pg');

console.log('🔍 Testing Railway Database Connection URLs...');

// All possible Railway database URLs
const TEST_URLS = [
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@roundhouse.proxy.rlwy.net:49935/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@viaduct.proxy.rlwy.net:51932/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@autorack.proxy.rlwy.net:33388/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@ballast.proxy.rlwy.net:38432/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@junction.proxy.rlwy.net:43062/railway',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@monorail.proxy.rlwy.net:16543/railway',
  // Try without SSL
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@roundhouse.proxy.rlwy.net:49935/railway?sslmode=disable',
  'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@viaduct.proxy.rlwy.net:51932/railway?sslmode=disable'
];

async function testConnection(url, index) {
  const maskedUrl = url.replace(/:([^:@]*@)/, ':***@');
  console.log(`\n🔄 Test ${index + 1}: ${maskedUrl}`);
  
  try {
    const pool = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 5000,
      ssl: false // Try without SSL first
    });
    
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    const duration = Date.now() - start;
    
    console.log(`✅ SUCCESS! (${duration}ms)`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // Test admin table
    try {
      const adminResult = await pool.query('SELECT COUNT(*) FROM admins');
      console.log(`   Admin records: ${adminResult.rows[0].count}`);
    } catch (tableError) {
      console.log(`   Admin table: Not found (${tableError.message})`);
    }
    
    await pool.end();
    return { success: true, url, duration };
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return { success: false, url, error: error.message };
  }
}

async function testAllConnections() {
  console.log(`🚀 Testing ${TEST_URLS.length} database URLs...\n`);
  
  const results = [];
  
  for (let i = 0; i < TEST_URLS.length; i++) {
    const result = await testConnection(TEST_URLS[i], i);
    results.push(result);
    
    if (result.success) {
      console.log(`🎯 WORKING URL FOUND! Use this for production:`);
      console.log(`   ${result.url}`);
      break; // Stop at first working URL
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total tested: ${results.length}`);
  console.log(`   Successful: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  
  const working = results.find(r => r.success);
  if (working) {
    console.log(`\n🎯 Use this URL in production:`);
    console.log(`   DATABASE_URL=${working.url}`);
  } else {
    console.log('\n❌ No working database URL found');
  }
}

testAllConnections().catch(error => {
  console.error('💥 Test script failed:', error);
});