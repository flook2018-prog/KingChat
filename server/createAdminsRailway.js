const bcrypt = require('bcryptjs');

// Create admin script for Railway deployment
async function createAdminsOnRailway() {
  try {
    const { pool } = require('./models/database');
    
    console.log('🔧 Creating admin users on Railway...');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating users table...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          status VARCHAR(20) DEFAULT 'active',
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Users table created');
    }
    
    // Create admin users
    const adminUsers = [
      {
        username: 'SSSs',
        email: 'SSSs@kingchat.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'Xinon',
        email: 'Xinon@kingchat.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'King Administrator',
        email: 'kingadmin@kingchat.com',
        password: 'king123',
        role: 'user'
      },
      {
        username: 'aaa',
        email: 'aaa@kingchat.com',
        password: 'aaa123',
        role: 'user'
      },
      {
        username: 'System Administrator',
        email: 'admin@kingchat.com',
        password: 'system123',
        role: 'admin'
      }
    ];
    
    for (const user of adminUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await pool.query(`
          INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (username) DO UPDATE SET
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            updated_at = CURRENT_TIMESTAMP
        `, [user.username, user.email, hashedPassword, user.role]);
        
        console.log(`✅ Created/Updated user: ${user.username} (${user.role})`);
      } catch (error) {
        console.log(`⚠️ User ${user.username} might already exist:`, error.message);
      }
    }
    
    // Show final users
    const users = await pool.query(`
      SELECT id, username, email, role, status, created_at 
      FROM users 
      ORDER BY created_at ASC
    `);
    
    console.log('\n👥 Users in database:');
    users.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Email: ${user.email}`);
    });
    
    console.log('\n🎉 Admin setup completed!');
    
  } catch (error) {
    console.error('❌ Admin creation failed:', error);
    throw error;
  }
}

module.exports = { createAdminsOnRailway };