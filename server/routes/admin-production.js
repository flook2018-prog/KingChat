const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const { executeQuery, isDatabaseConnected } = require('../models/database-production-fallback');

console.log('📁 Admin Production Routes: Loading with PostgreSQL database connection');

// GET /api/admin/users - Alias for getting all admins
router.get('/users', async (req, res) => {
  try {
    console.log('👥 Fetching all users/admins from database');
    const result = await executeQuery(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login FROM admins ORDER BY created_at DESC'
    );
    
    console.log(`✅ Retrieved ${result.rows.length} users from database`);
    res.json({ 
      success: true, 
      users: result.rows,
      database: isDatabaseConnected() ? 'postgresql' : 'fallback',
      count: result.rows.length,
      message: isDatabaseConnected() ? 'Data loaded from PostgreSQL database' : 'Data loaded from fallback storage'
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// POST /api/admin/users - Create new user/admin
router.post('/users', async (req, res) => {
  try {
    const { username, password, role, email } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    console.log(`👤 Creating new user: ${username}`);
    
    // Check if username already exists
    const existingUser = await executeQuery(
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
    
    // Insert new user
    const result = await executeQuery(
      'INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, email, role, status, created_at',
      [username, hashedPassword, email || `${username}@kingchat.com`, role || 'admin', 'active']
    );
    
    const newUser = result.rows[0];
    console.log(`✅ Created new user: ${username} (ID: ${newUser.id})`);
    res.status(201).json({ 
      success: true, 
      user: newUser,
      database: isDatabaseConnected() ? 'postgresql' : 'fallback',
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user',
      details: error.message 
    });
  }
});

// GET /api/admin - Get all admins (PostgreSQL with fallback)
router.get('/', async (req, res) => {
  try {
    console.log('📁 Fetching all admins from database (PostgreSQL or fallback)');
    const result = await executeQuery(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login FROM admins ORDER BY created_at DESC'
    );
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ 
      success: true, 
      admins: result.rows,
      database: isDatabaseConnected() ? 'postgresql' : 'fallback',
      count: result.rows.length,
      message: isDatabaseConnected() ? 'Data loaded from PostgreSQL database' : 'Data loaded from fallback storage'
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

// GET /api/admin/:id - Get specific admin from PostgreSQL
router.get('/:id', async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected'
      });
    }

    const { id } = req.params;
    console.log(`📁 Fetching admin ID ${id} from PostgreSQL database`);
    
    const result = await executeQuery(
      'SELECT id, username, email, role, status, created_at, updated_at, last_login FROM admins WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Found admin: ${result.rows[0].username}`);
    res.json({ 
      success: true, 
      admin: result.rows[0],
      database: true
    });
  } catch (error) {
    console.error('❌ Error fetching admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch admin',
      details: error.message 
    });
  }
});

// POST /api/admin - Create new admin (PostgreSQL with fallback)
router.post('/', async (req, res) => {
  try {
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
    const existingUser = await executeQuery(
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
    const result = await executeQuery(
      'INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, email, role, status, created_at',
      [username, hashedPassword, email || `${username}@kingchat.com`, role || 'admin', 'active']
    );
    
    const newAdmin = result.rows[0];
    console.log(`✅ Created new admin: ${username} (ID: ${newAdmin.id})`);
    res.status(201).json({ 
      success: true, 
      admin: newAdmin,
      database: isDatabaseConnected() ? 'postgresql' : 'fallback',
      message: 'Admin created successfully'
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

// PUT /api/admin/:id - Update admin in PostgreSQL
router.put('/:id', async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected - cannot update admin'
      });
    }

    const { id } = req.params;
    const { username, password, role, status, email } = req.body;
    
    console.log(`📝 Updating admin ID ${id} in PostgreSQL`);
    
    // Check if admin exists
    const adminExists = await executeQuery(
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
      const existingUser = await executeQuery(
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
    
    if (email !== undefined) {
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
    
    const result = await executeQuery(updateQuery, updateValues);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin in PostgreSQL: ${updatedAdmin.username} (ID: ${id})`);
    res.json({ 
      success: true, 
      admin: updatedAdmin,
      database: true,
      message: 'Admin updated successfully in PostgreSQL database'
    });
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update admin in database',
      details: error.message 
    });
  }
});

// DELETE /api/admin/:id - Delete admin from PostgreSQL
router.delete('/:id', async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected - cannot delete admin'
      });
    }

    const { id } = req.params;
    console.log(`🗑️ Deleting admin ID ${id} from PostgreSQL`);
    
    // Check if admin exists
    const adminExists = await executeQuery(
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
    const adminCount = await executeQuery('SELECT COUNT(*) FROM admins WHERE status = $1', ['active']);
    
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete the last admin' 
      });
    }
    
    const deletedAdmin = adminExists.rows[0];
    
    // Delete admin
    await executeQuery('DELETE FROM admins WHERE id = $1', [id]);
    
    console.log(`✅ Deleted admin from PostgreSQL: ${deletedAdmin.username} (ID: ${id})`);
    res.json({ 
      success: true, 
      message: 'Admin deleted successfully from PostgreSQL database',
      database: true,
      deleted_admin: deletedAdmin.username
    });
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete admin from database',
      details: error.message 
    });
  }
});

// Include the new admin routes
const adminRoutes = require('./admin-routes');

// Mount admin management routes
router.use('/', adminRoutes);

module.exports = router;