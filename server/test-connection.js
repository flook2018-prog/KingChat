const { Pool } = require('pg');

async function testConnection() {
  // Try different connection URLs
  const connections = [
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres.railway.internal:5432/railway',
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@viaduct.proxy.rlwy.net:51932/railway',
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@autorack.proxy.rlwy.net:33388/railway',
    'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@ballast.proxy.rlwy.net:38432/railway'
  ];

  for (const url of connections) {
    try {
      console.log(`🔄 Testing: ${url.replace(/BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR/, '***')}`);
      
      const pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      const result = await pool.query('SELECT NOW()');
      console.log(`✅ Success! Time: ${result.rows[0].now}`);
      await pool.end();
      console.log(`✅ Working URL: ${url}`);
      return url;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  console.log('❌ All connections failed');
  return null;
}

testConnection().then(workingUrl => {
  if (workingUrl) {
    console.log('\n🎉 Use this URL:', workingUrl);
  } else {
    console.log('\n💥 No working connection found');
  }
  process.exit(0);
});