const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Use direct database connection
const { pool } = require('../models/database');
console.log('✅ Admin routes loading with direct PostgreSQL connection');

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    console.log('📁 Fetching admins from PostgreSQL database');
    const result = await pool.query(
      'SELECT id, username, role, status, created_at, last_login FROM admins ORDER BY created_at DESC'
    );
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('❌ Error fetching admins from database:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admins from database',
      details: error.message 
    });
  }
});

// GET /api/admin/:id - Get specific admin
router.get('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    console.log(`📁 Fetching admin ID ${adminId} from PostgreSQL database`);
    
    const result = await pool.query(
      'SELECT id, username, role, status, created_at, last_login FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Retrieved admin: ${result.rows[0].username}`);
    res.json({ success: true, admin: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching admin from database:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admin from database',
      details: error.message 
    });
  }
});

// POST /api/admin - Create new admin
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    console.log(`📝 Creating new admin: ${username}`);
    
    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new admin
    const result = await pool.query(
      'INSERT INTO admins (username, password, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, username, role, status, created_at',
      [username, hashedPassword, role || 'admin', 'active']
    );
    
    const newAdmin = result.rows[0];
    console.log(`✅ Created new admin: ${username}`);
    res.status(201).json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create admin',
      details: error.message 
    });
  }
});

// PUT /api/admin/:id - Update admin
router.put('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { username, password, role } = req.body;
    
    // Validation
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username is required' 
      });
    }
    
    console.log(`📝 Updating admin ID ${adminId}: ${username}`);
    
    // Check if admin exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Check if username is taken by another user
    const usernameCheck = await pool.query(
      'SELECT id FROM admins WHERE username = $1 AND id != $2',
      [username, adminId]
    );
    
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    let updateQuery;
    let updateParams;
    
    if (password) {
      // Update with password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      updateQuery = `
        UPDATE admins 
        SET username = $1, password = $2, role = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING id, username, role, status, created_at, last_login
      `;
      updateParams = [username, hashedPassword, role || 'admin', adminId];
    } else {
      // Update without password
      updateQuery = `
        UPDATE admins 
        SET username = $1, role = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, username, role, status, created_at, last_login
      `;
      updateParams = [username, role || 'admin', adminId];
    }
    
    const result = await pool.query(updateQuery, updateParams);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin: ${username}`);
    res.json({ success: true, admin: updatedAdmin });
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update admin',
      details: error.message 
    });
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    console.log(`🗑️ Deleting admin ID ${adminId}`);
    
    // Check if admin exists
    const existingAdmin = await pool.query(
      'SELECT id, username FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Prevent deleting the last admin
    const adminCount = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete the last admin' 
      });
    }
    
    // Delete admin
    await pool.query('DELETE FROM admins WHERE id = $1', [adminId]);
    
    console.log(`✅ Deleted admin: ${existingAdmin.rows[0].username}`);
    res.json({ 
      success: true, 
      message: 'Admin deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete admin',
      details: error.message 
    });
  }
});

module.exports = router;