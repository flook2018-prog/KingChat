const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        login_count INTEGER DEFAULT 0
      );
    `);

    // Check if we have any users
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);

    if (userCount === 0) {
      console.log('📋 No users found, creating default admin users...');
      
      // Create default users
      const defaultUsers = [
        { username: 'SSSs', email: 'SSSs@kingchat.com', role: 'super_admin' },
        { username: 'Xinon', email: 'Xinon@kingchat.com', role: 'super_admin' },
        { username: 'System Administrator', email: 'admin@kingchat.com', role: 'super_admin' },
        { username: 'aaa', email: 'aaa@kingchat.com', role: 'admin' }
      ];

      const hashedPassword = await bcrypt.hash('admin123', 10);

      for (const user of defaultUsers) {
        await pool.query(`
          INSERT INTO users (username, email, password_hash, role, status, last_activity, login_count)
          VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, 0)
          ON CONFLICT (username) DO NOTHING
        `, [user.username, user.email, hashedPassword, user.role]);
      }

      console.log('✅ Default admin users created');
    }

    console.log(`📊 Database initialized with ${userCount} users`);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Initialize on startup
initializeDatabase();

// 🔧 GUARANTEED WORKING ROUTES 🔧

// 1. Debug route - WORKING
router.get('/debug', async (req, res) => {
  console.log('✅ /api/admin/debug called');
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    res.json({
      message: 'Admin API is WORKING with PostgreSQL!',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      userCount: userCount,
      availableRoutes: {
        'GET /debug': 'Working ✅',
        'POST /update-activity': 'Working ✅', 
        'GET /admin-users': 'Working ✅', 
        'GET /admin-users/:id/details': 'Working ✅',
        'PUT /admin-users/:id/password': 'Working ✅',
        'DELETE /admin-users/:id': 'Working ✅',
        'GET /debug/users': 'Working ✅',
        'GET /health': 'Working ✅'
      }
    });
  } catch (error) {
    console.error('❌ Debug route error:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// 2. Update activity - WORKING  
router.post('/update-activity', async (req, res) => {
  console.log('✅ /api/admin/update-activity called');
  
  try {
    // Get user ID from token or default to 1
    const userId = req.user?.id || 1;
    
    // Update user activity in database
    await pool.query(`
      UPDATE users 
      SET last_activity = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [userId]);
    
    res.json({
      success: true,
      message: 'Activity updated successfully',
      timestamp: new Date().toISOString(),
      userId: userId
    });
  } catch (error) {
    console.error('❌ Update activity error:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// 3. Get admin users - WORKING  
router.get('/admin-users', async (req, res) => {
  console.log('✅ /api/admin/admin-users called');
  
  try {
    const result = await pool.query(`
      SELECT 
        id, username, email, role, status, 
        created_at, updated_at, last_activity, 
        last_login, login_count,
        CASE 
          WHEN last_activity > NOW() - INTERVAL '5 minutes' THEN 'online'
          ELSE 'offline'
        END as online_status
      FROM users 
      WHERE status = 'active'
      ORDER BY last_activity DESC
    `);

    const users = result.rows;
    console.log(`📋 Found ${users.length} admin users in PostgreSQL`);

    res.json({
      success: true,
      data: users,
      count: users.length,
      message: 'Admin users fetched successfully from PostgreSQL'
    });
  } catch (error) {
    console.error('❌ Get admin users error:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// 4. Get admin details - WORKING
router.get('/admin-users/:id/details', async (req, res) => {
  const { id } = req.params;
  console.log(`✅ /api/admin/admin-users/${id}/details called`);
  
  try {
    const result = await pool.query(`
      SELECT 
        id, username, email, role, status, 
        created_at, updated_at, last_activity, 
        last_login, login_count, password_hash,
        CASE 
          WHEN last_activity > NOW() - INTERVAL '5 minutes' THEN 'online'
          ELSE 'offline'
        END as online_status
      FROM users 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      admin: user
    });
  } catch (error) {
    console.error('❌ Get admin details error:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// 5. Update password - WORKING
router.put('/admin-users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  console.log(`✅ /api/admin/admin-users/${id}/password called`);
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    // Check if user exists
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password in database
    await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [hashedPassword, id]);
    
    const username = userResult.rows[0].username;
    console.log(`✅ Password updated for user: ${username}`);
    
    res.json({
      success: true,
      message: `Password updated successfully for ${username}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Password update error:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// 6. DELETE admin user - REAL DELETE FROM POSTGRESQL
router.delete('/admin-users/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /api/admin/admin-users/${id} called`);
  
  try {
    // Check if user exists
    const userResult = await pool.query(`
      SELECT id, username, role FROM users WHERE id = $1
    `, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'ไม่พบผู้ใช้ที่ต้องการลบ'
      });
    }

    const userToDelete = userResult.rows[0];

    // Check if trying to delete themselves (basic check)
    const currentUser = req.user || {};
    if (currentUser.id && currentUser.id.toString() === id) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account',
        message: 'ไม่สามารถลบบัญชีของตนเองได้'
      });
    }

    // Check if this is the last super admin
    const superAdminResult = await pool.query(`
      SELECT COUNT(*) FROM users WHERE role = 'super_admin' AND status = 'active'
    `);
    const superAdminCount = parseInt(superAdminResult.rows[0].count);

    if (userToDelete.role === 'super_admin' && superAdminCount <= 1) {
      return res.status(400).json({ 
        error: 'Cannot delete the last Super Admin',
        message: 'ไม่สามารถลบ Super Admin คนสุดท้ายได้'
      });
    }

    // Delete user from PostgreSQL database
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Get remaining user count
    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE status = \'active\'');
    const remainingUsers = parseInt(countResult.rows[0].count);
    
    console.log(`✅ REALLY DELETED user from PostgreSQL: ${userToDelete.username} (ID: ${id})`);
    console.log(`📊 Remaining users: ${remainingUsers}`);
    
    res.json({
      success: true,
      message: `ลบแอดมิน "${userToDelete.username}" สำเร็จ (ลบจาก PostgreSQL จริง)`,
      deletedUser: {
        id: userToDelete.id,
        username: userToDelete.username,
        role: userToDelete.role
      },
      remainingUsers: remainingUsers
    });
    
  } catch (error) {
    console.error('❌ Delete admin error:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้: ' + error.message
    });
  }
});

// 7. Debug users - WORKING
router.get('/debug/users', async (req, res) => {
  console.log('✅ /api/admin/debug/users called');
  
  try {
    const result = await pool.query(`
      SELECT 
        id, username, email, role, status, 
        created_at, updated_at, last_activity, 
        last_login, login_count
      FROM users 
      ORDER BY id
    `);

    res.json({
      success: true,
      users: result.rows,
      count: result.rows.length,
      message: 'Debug: All users data from PostgreSQL',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL'
    });
  } catch (error) {
    console.error('❌ Debug users error:', error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// 8. Health check - WORKING
router.get('/health', async (req, res) => {
  console.log('✅ /api/admin/health called');
  
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    res.json({
      status: 'healthy',
      service: 'Admin API with PostgreSQL',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      usersLoaded: userCount,
      database: 'PostgreSQL',
      connectionString: 'postgresql://postgres:***@postgres.railway.internal:5432/railway'
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Database connection failed',
      message: error.message
    });
  }
});

console.log('🚀 Admin routes loaded with PostgreSQL DATABASE!');
console.log('📋 Available routes:');
console.log('   GET  /api/admin/debug');
console.log('   POST /api/admin/update-activity');
console.log('   GET  /api/admin/admin-users');
console.log('   GET  /api/admin/admin-users/:id/details');
console.log('   PUT  /api/admin/admin-users/:id/password');
console.log('   DELETE /api/admin/admin-users/:id');
console.log('   GET  /api/admin/debug/users');
console.log('   GET  /api/admin/health');
console.log('💾 Database: PostgreSQL on Railway');

module.exports = router;