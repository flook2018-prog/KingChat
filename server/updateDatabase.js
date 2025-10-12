const { pool } = require('./models/database');
const fs = require('fs');
const path = require('path');

async function updateDatabase() {
  try {
    console.log('🔄 Starting database update...');
    
    // Read SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'update_admin_table.sql'), 'utf8');
    
    // Split by semicolon to execute each statement separately
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.trim().substring(0, 50) + '...');
        await pool.query(statement.trim());
      }
    }
    
    console.log('✅ Database update completed successfully!');
    
    // Test the admin API
    console.log('🧪 Testing admin data...');
    const result = await pool.query('SELECT COUNT(*) as count FROM admin');
    console.log(`📊 Admin table now has ${result.rows[0].count} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database update failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateDatabase();
}

module.exports = updateDatabase;