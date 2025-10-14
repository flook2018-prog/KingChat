const { pool } = require('./models/database');
const bcrypt = require('bcrypt');

async function testDatabaseFix() {
    console.log('🧪 Testing Database Fix...');
    
    try {
        // Test 1: Check connection
        console.log('📡 1. Testing connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection OK');
        
        // Test 2: Check admins table
        console.log('📊 2. Checking admins table...');
        const adminResult = await pool.query('SELECT COUNT(*) as count FROM admins');
        console.log(`✅ Admins table exists with ${adminResult.rows[0].count} records`);
        
        // Test 3: Get all admins
        console.log('👥 3. Getting all admins...');
        const admins = await pool.query(`
            SELECT id, username, email, "displayName", role, points, messages_handled 
            FROM admins 
            ORDER BY id
        `);
        console.log('✅ Admin data:');
        admins.rows.forEach(admin => {
            console.log(`   ${admin.id}: ${admin.displayName || admin.username} (@${admin.username}) - ${admin.role}`);
        });
        
        // Test 4: API format transformation
        console.log('🔄 4. Testing API format...');
        const transformedAdmins = admins.rows.map(admin => ({
            id: admin.id,
            fullName: admin.displayName || admin.username,
            username: admin.username,
            role: admin.role,
            level: admin.role === 'super_admin' ? 100 : 80,
            points: admin.points || 0,
            messagesHandled: admin.messages_handled || 0,
            lastLogin: admin.updatedAt || admin.createdAt
        }));
        
        console.log('✅ Transformed data for API:');
        console.log(JSON.stringify(transformedAdmins, null, 2));
        
        // Test 5: Check other tables
        console.log('📋 5. Checking other tables...');
        const tables = ['users', 'line_accounts', 'customers', 'chat_messages', 'quick_messages', 'settings'];
        
        for (const table of tables) {
            try {
                const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`✅ ${table}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`⚠️ ${table}: Not found or error - ${error.message}`);
            }
        }
        
        console.log('🎉 Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run test
testDatabaseFix()
    .then(() => {
        console.log('✅ Test completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });