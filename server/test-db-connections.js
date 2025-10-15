const { Pool } = require('pg');

// Test different connection configurations
const connections = [
  {
    name: 'Environment DATABASE_URL',
    config: {
      connectionString: process.env.DATABASE_URL,
      ssl: false
    }
  },
  {
    name: 'Internal Railway URL',
    config: {
      connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway',
      ssl: false
    }
  },
  {
    name: 'External Railway URL with SSL',
    config: {
      connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@autorack.proxy.rlwy.net:33388/railway',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'External Railway URL without SSL',
    config: {
      connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@autorack.proxy.rlwy.net:33388/railway',
      ssl: false
    }
  }
];

async function testConnections() {
  console.log('🔧 Environment Variables:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('   RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT ? 'SET' : 'NOT SET');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('');

  for (const { name, config } of connections) {
    console.log(`🔄 Testing: ${name}`);
    
    if (!config.connectionString) {
      console.log('   ❌ Connection string not available');
      console.log('');
      continue;
    }

    try {
      const pool = new Pool({
        ...config,
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000
      });

      const client = await pool.connect();
      
      // Test query
      const result = await client.query('SELECT NOW(), version()');
      console.log('   ✅ Connection successful');
      console.log('   📅 Server time:', result.rows[0].now);
      console.log('   🗄️ Version:', result.rows[0].version.substring(0, 50) + '...');
      
      client.release();
      await pool.end();
      
      console.log('   🎉 This connection works! Use this configuration.');
      return config;
      
    } catch (error) {
      console.log('   ❌ Connection failed:', error.message);
    }
    
    console.log('');
  }
  
  console.log('💥 All connection attempts failed!');
  return null;
}

if (require.main === module) {
  testConnections().then((workingConfig) => {
    if (workingConfig) {
      console.log('✅ Found working configuration!');
      process.exit(0);
    } else {
      console.log('❌ No working configuration found!');
      process.exit(1);
    }
  });
}

module.exports = { testConnections };