const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const { getPool, isDbConnected } = require('../models/database-working');

console.log('✅ Admin routes loading with working database connection');

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    
    if (!pool || !isDbConnected()) {
      console.log('❌ Database not connected, using fallback');
      return res.json({
        success: true,
        admins: [
          {
            id: 1,
            username: 'admin',
            role: 'super-admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          {
            id: 2,
            username: 'manager',
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: null
          },
          {
            id: 3,
            username: 'operator',
            role: 'operator',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: null
          }
        ],
        fallback: true,
        message: 'Using fallback data - database not connected'
      });
    }

    console.log('📁 Fetching admins from database');
    const result = await pool.query(
      'SELECT id, username, role, status, created_at, updated_at, last_login FROM admins ORDER BY created_at DESC'
    );
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ 
      success: true, 
      admins: result.rows,
      database: true,
      message: 'Data loaded from PostgreSQL database'
    });
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admins',
      details: error.message 
    });
  }
});

// GET /api/admin/:id - Get specific admin
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    
    if (!pool || !isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }

    const { id } = req.params;
    console.log(`📁 Fetching admin ID ${id} from database`);
    
    const result = await pool.query(
      'SELECT id, username, role, status, created_at, updated_at, last_login FROM admins WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Found admin: ${result.rows[0].username}`);
    res.json({ success: true, admin: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admin',
      details: error.message 
    });
  }
});

// POST /api/admin - Create new admin
router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    
    if (!pool || !isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected - cannot create admin'
      });
    }

    const { username, password, role, email } = req.body;
    
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
      'INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, role, status, created_at',
      [username, hashedPassword, email || `${username}@kingchat.com`, role || 'admin', 'active']
    );
    
    const newAdmin = result.rows[0];
    console.log(`✅ Created new admin: ${username}`);
    res.status(201).json({ 
      success: true, 
      admin: newAdmin,
      database: true,
      message: 'Admin created successfully in database'
    });
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
    const pool = getPool();
    
    if (!pool || !isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected - cannot update admin'
      });
    }

    const { id } = req.params;
    const { username, password, role, status, email } = req.body;
    
    console.log(`📝 Updating admin ID: ${id}`);
    
    // Check if admin exists
    const adminExists = await pool.query(
      'SELECT id FROM admins WHERE id = $1',
      [id]
    );
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Check if username already exists for another admin
    if (username) {
      const existingUser = await pool.query(
        'SELECT id FROM admins WHERE username = $1 AND id != $2',
        [username, id]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already exists' 
        });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (username) {
      updateFields.push(`username = $${paramCount}`);
      updateValues.push(username);
      paramCount++;
    }
    
    if (password) {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateFields.push(`password = $${paramCount}`);
      updateValues.push(hashedPassword);
      paramCount++;
    }
    
    if (email) {
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
      paramCount++;
    }
    
    if (role) {
      updateFields.push(`role = $${paramCount}`);
      updateValues.push(role);
      paramCount++;
    }
    
    if (status) {
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
      paramCount++;
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id); // For WHERE clause
    
    const updateQuery = `
      UPDATE admins 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, status, created_at, updated_at
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin: ${updatedAdmin.username}`);
    res.json({ 
      success: true, 
      admin: updatedAdmin,
      database: true,
      message: 'Admin updated successfully in database'
    });
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
    const pool = getPool();
    
    if (!pool || !isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected - cannot delete admin'
      });
    }

    const { id } = req.params;
    console.log(`🗑️ Deleting admin ID: ${id}`);
    
    // Check if admin exists
    const adminExists = await pool.query(
      'SELECT id, username FROM admins WHERE id = $1',
      [id]
    );
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Check if this is the last admin
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins WHERE status = $1', ['active']);
    
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete the last admin' 
      });
    }
    
    const deletedAdmin = adminExists.rows[0];
    
    // Delete admin
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    
    console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'Admin deleted successfully from database',
      database: true
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