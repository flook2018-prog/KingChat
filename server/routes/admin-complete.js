const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Debug route to check if admin API is working
router.get('/debug', (req, res) => {
  res.json({
    message: 'Admin API is working',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /admin-users',
      'POST /admin-users', 
      'PUT /admin-users/:id',
      'DELETE /admin-users/:id',
      'PUT /admin-users/:id/password',
      'POST /update-activity',
      'GET /debug/users - Check all users in database'
    ]
  });
});

// Debug route to check users in database
router.get('/debug/users', async (req, res) => {
  try {
    const { debugDatabase } = require('../models/database');
    const result = await debugDatabase();
    
    res.json({
      message: 'Database debug completed',
      timestamp: new Date().toISOString(),
      result: result
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update last login when user accesses admin panel
router.post('/update-activity', auth, async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const userId = req.user.id;
    
    console.log('🔄 Updating activity for user ID:', userId);
    
    await pool.query(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1;
    `, [userId]);
    
    res.json({ 
      success: true,
      message: 'Activity updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin details with password (for super admin only)
router.get('/admin-users/:id/details', auth, async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { id } = req.params;
    
    // Check if current user is super admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    
    const result = await pool.query(`
      SELECT id, username, email, role, status, last_login, created_at, password_hash
      FROM users 
      WHERE id = $1;
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({
      admin: {
        ...result.rows[0],
        password_hash: result.rows[0].password_hash // Include password hash for super admin
      }
    });
  } catch (error) {
    console.error('Get admin details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all admin users
router.get('/admin-users', auth, async (req, res) => {
  try {
    const { pool } = require('../models/database');
    
    console.log('📋 Getting all admins...');
    
    const result = await pool.query(`
      SELECT id, username, email, role, status, last_login, created_at
      FROM users 
      ORDER BY created_at ASC;
    `);
    
    console.log('✅ Found admins:', result.rows.length);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single admin user
router.get('/admin-users/:id', auth, async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { id } = req.params;
    
    console.log('📋 Getting admin user ID:', id);
    
    const result = await pool.query(`
      SELECT id, username, email, role, status, last_login, created_at
      FROM users 
      WHERE id = $1;
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update admin password
router.put('/admin-users/:id/password', auth, async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { id } = req.params;
    const { password } = req.body;
    
    // Check if current user is super admin or editing own password
    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    console.log('🔐 Updating password for user ID:', id);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email;
    `, [hashedPassword, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Password updated successfully',
      user: result.rows[0],
      password_hash: hashedPassword
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new admin user
router.post('/admin-users', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { username, email, password, role, displayName } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    console.log('➕ Creating new admin user:', username);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, username, email, role, status, created_at;
    `, [username, email, hashedPassword, role]);
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update admin user
router.put('/admin-users/:id', auth, async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { id } = req.params;
    const { username, email, role, status } = req.body;
    
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    console.log('✏️ Updating admin user ID:', id);
    
    const result = await pool.query(`
      UPDATE users 
      SET username = $1, email = $2, role = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, username, email, role, status, last_login, created_at;
    `, [username, email, role, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Admin user updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete admin user
router.delete('/admin-users/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { id } = req.params;
    
    console.log('🗑️ Deleting admin user ID:', id);
    
    const result = await pool.query(`
      DELETE FROM users 
      WHERE id = $1
      RETURNING id, username, email;
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'Admin user deleted successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;