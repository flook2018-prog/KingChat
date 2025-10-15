const { pool } = require('./models/database');

async function checkAdminTable() {
  try {
    console.log('🔍 Checking admin table structure...');
    
    // Check if admins table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin', 'admins', 'users')
    `);
    
    console.log('📋 Existing tables:', tableCheck.rows.map(row => row.table_name));
    
    if (tableCheck.rows.find(row => row.table_name === 'admins')) {
      console.log('✅ Found admins table, checking structure...');
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'admins' 
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Admins table columns:');
      columns.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Check current data
      const data = await pool.query('SELECT id, username, role FROM admins LIMIT 5');
      console.log('👥 Current admin data:', data.rows);
      
    } else if (tableCheck.rows.find(row => row.table_name === 'admin')) {
      console.log('✅ Found admin table (singular), checking structure...');
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'admin' 
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Admin table columns:');
      columns.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
    } else if (tableCheck.rows.find(row => row.table_name === 'users')) {
      console.log('✅ Found users table, checking structure...');
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Users table columns:');
      columns.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
    } else {
      console.log('❌ No admin-related table found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin table:', error);
  } finally {
    await pool.end();
  }
}

checkAdminTable();