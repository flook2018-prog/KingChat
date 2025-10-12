// Test direct database connection
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  const connectionConfigs = [
    {
      name: 'Railway Public URL',
      config: {
        connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@ballast.proxy.rlwy.net:38432/railway',
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Railway Public URL (No SSL)',
      config: {
        connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@ballast.proxy.rlwy.net:38432/railway'
      }
    }
  ];

  for (const { name, config } of connectionConfigs) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`Connection string: ${config.connectionString.replace(/uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn/, '***')}`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log('✅ Connection successful!');
      
      // Test query
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      console.log('📋 Database info:');
      console.log('   Time:', result.rows[0].current_time);
      console.log('   Version:', result.rows[0].postgres_version.substring(0, 50) + '...');
      
      // Test admin table
      try {
        const adminResult = await client.query('SELECT COUNT(*) as admin_count FROM admins');
        console.log(`👥 Admin count: ${adminResult.rows[0].admin_count}`);
      } catch (error) {
        console.log('❌ Admin table error:', error.message);
      }
      
      await client.end();
      console.log('✅ Connection closed successfully');
      return true;
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      try {
        await client.end();
      } catch (endError) {
        // Ignore end errors
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 Database Connection Test\n');
  console.log('=' .repeat(50));
  
  const success = await testDatabaseConnection();
  
  console.log('\n' + '=' .repeat(50));
  if (success) {
    console.log('🎉 Database connection working!');
    console.log('💡 You can now use the admin system with real database');
  } else {
    console.log('❌ All database connections failed');
    console.log('💡 You need to:');
    console.log('   1. Check Railway database status');
    console.log('   2. Verify connection credentials');
    console.log('   3. Try deploying to Railway environment');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDatabaseConnection };