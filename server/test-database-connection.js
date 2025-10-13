const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@junction.proxy.rlwy.net:43062/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
});

async function testDatabaseConnection() {
    console.log('🔍 Testing PostgreSQL Database Connection...');
    console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
    
    try {
        // Test basic connection
        console.log('1. 🔗 Testing basic connection...');
        const client = await pool.connect();
        console.log('✅ Basic connection successful!');
        
        // Test query
        console.log('2. 📊 Testing basic query...');
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Query successful!');
        console.log('   Current time:', result.rows[0].current_time);
        console.log('   PostgreSQL version:', result.rows[0].pg_version.substring(0, 50) + '...');
        
        // Test admin table
        console.log('3. 👥 Testing admin table...');
        try {
            const adminResult = await client.query('SELECT COUNT(*) as admin_count FROM admin');
            console.log('✅ Admin table exists!');
            console.log('   Admin count:', adminResult.rows[0].admin_count);
            
            // Get admin details
            const adminList = await client.query('SELECT id, username, display_name, role, points FROM admin ORDER BY points DESC');
            console.log('📋 Admin list:');
            adminList.rows.forEach(admin => {
                console.log(`   - ${admin.username} (${admin.display_name}) - ${admin.role} - ${admin.points} points`);
            });
            
        } catch (error) {
            console.log('❌ Admin table error:', error.message);
            
            // Try to create admin table
            console.log('🔧 Attempting to create admin table...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    display_name VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'admin',
                    points INTEGER DEFAULT 0,
                    messages_handled INTEGER DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Admin table created!');
            
            // Insert admin data
            await client.query(`
                INSERT INTO admin (username, password_hash, display_name, role, points, messages_handled) 
                VALUES 
                ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ผู้ดูแลระบบหลัก', 'super_admin', 4500, 450),
                ('somchai', '$2b$10$k8RQ4K9yOQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'สมชาย ใจดี', 'admin', 3200, 320),
                ('supha', '$2b$10$m9SL5N0pQJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'สุภา รักงาน', 'admin', 2300, 230),
                ('vichai', '$2b$10$n6TM8O1qRJYvXUzFQnbh.eOqJ8QeKvR4yTgNcQS8zKqQgW3Md8QKxy', 'วิชัย เก่งงาน', 'admin', 1800, 180)
                ON CONFLICT (username) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    points = EXCLUDED.points,
                    messages_handled = EXCLUDED.messages_handled
            `);
            console.log('✅ Admin data inserted!');
        }
        
        // Test users table
        console.log('4. 👤 Testing users table...');
        try {
            const userResult = await client.query('SELECT COUNT(*) as user_count FROM users');
            console.log('✅ Users table exists!');
            console.log('   User count:', userResult.rows[0].user_count);
        } catch (error) {
            console.log('❌ Users table error:', error.message);
            
            // Create users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'user',
                    status VARCHAR(50) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Users table created!');
        }
        
        client.release();
        console.log('🎉 Database connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Error detail:', error.detail);
        process.exit(1);
    }
}

// Run the test
testDatabaseConnection().then(() => {
    console.log('✅ All database tests passed!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Database test failed:', error);
    process.exit(1);
});