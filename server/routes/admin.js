const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Use direct database connection with fallback
const { pool } = require('../models/database');
console.log('✅ Admin routes loading with direct PostgreSQL connection');

// Check if database is available
async function isDatabaseAvailable() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database check failed:', error);
    return false;
  }
}

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      console.log('📁 Using database for admin list');
      const result = await pool.query(
        'SELECT id, username, email, "displayName", role, "createdAt" FROM admins ORDER BY id'
      );
      
      // Transform data to match frontend expectations
      const transformedAdmins = result.rows.map(admin => ({
        id: admin.id,
        fullName: admin.displayName || admin.username,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }));
      
      console.log(`✅ Retrieved ${transformedAdmins.length} admins from database`);
      res.json(transformedAdmins);
    } else {
      console.log('⚠️ Database not available, using demo data');
      res.json([
        {
          id: 1,
          fullName: 'System Administrator',
          username: 'admin',
          email: 'admin@kingchat.com',
          role: 'admin',
          createdAt: new Date()
        }
      ]);
    }
  } catch (error) {
    console.error('❌ Error in GET /api/admin:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/admin/:id - Get specific admin
router.get('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      const result = await pool.query(
        'SELECT id, username, email, "displayName", role, "createdAt" FROM admins WHERE id = $1',
        [adminId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      const admin = result.rows[0];
      const transformedAdmin = {
        id: admin.id,
        fullName: admin.displayName || admin.username,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      };
      
      res.json(transformedAdmin);
    } else {
      res.status(404).json({ error: 'Database not available' });
    }
  } catch (error) {
    console.error('❌ Error in GET /api/admin/:id:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/admin - Create new admin
router.post('/', async (req, res) => {
  try {
    const { fullName, username, email, password, role } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      // Check if username already exists
      const existingUser = await pool.query(
        'SELECT id FROM admins WHERE username = $1',
        [username]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert new admin
      const result = await pool.query(
        'INSERT INTO admins (username, email, "displayName", password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, email, "displayName", role, "createdAt"',
        [username, email || null, fullName || username, hashedPassword, role || 'admin']
      );
      
      const newAdmin = result.rows[0];
      const transformedAdmin = {
        id: newAdmin.id,
        fullName: newAdmin.displayName || newAdmin.username,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt
      };
      
      console.log(`✅ Created new admin: ${username}`);
      res.status(201).json(transformedAdmin);
    } else {
      res.status(503).json({ error: 'Database not available' });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/admin:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// PUT /api/admin/:id - Update admin
router.put('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { fullName, username, email, password, role } = req.body;
    
    // Validation
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      // Check if admin exists
      const existingAdmin = await pool.query(
        'SELECT id FROM admins WHERE id = $1',
        [adminId]
      );
      
      if (existingAdmin.rows.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      // Check if username is taken by another user
      const usernameCheck = await pool.query(
        'SELECT id FROM admins WHERE username = $1 AND id != $2',
        [username, adminId]
      );
      
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      let updateQuery;
      let updateParams;
      
      if (password) {
        // Update with password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        updateQuery = `
          UPDATE admins 
          SET username = $1, email = $2, "displayName" = $3, password = $4, role = $5, "updatedAt" = NOW()
          WHERE id = $6
          RETURNING id, username, email, "displayName", role, "createdAt"
        `;
        updateParams = [username, email || null, fullName || username, hashedPassword, role || 'admin', adminId];
      } else {
        // Update without password
        updateQuery = `
          UPDATE admins 
          SET username = $1, email = $2, "displayName" = $3, role = $4, "updatedAt" = NOW()
          WHERE id = $5
          RETURNING id, username, email, "displayName", role, "createdAt"
        `;
        updateParams = [username, email || null, fullName || username, role || 'admin', adminId];
      }
      
      const result = await pool.query(updateQuery, updateParams);
      const updatedAdmin = result.rows[0];
      
      const transformedAdmin = {
        id: updatedAdmin.id,
        fullName: updatedAdmin.displayName || updatedAdmin.username,
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        createdAt: updatedAdmin.createdAt
      };
      
      console.log(`✅ Updated admin: ${username}`);
      res.json(transformedAdmin);
    } else {
      res.status(503).json({ error: 'Database not available' });
    }
  } catch (error) {
    console.error('❌ Error in PUT /api/admin/:id:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      // Check if admin exists
      const existingAdmin = await pool.query(
        'SELECT id, username FROM admins WHERE id = $1',
        [adminId]
      );
      
      if (existingAdmin.rows.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      // Prevent deleting the last admin
      const adminCount = await pool.query('SELECT COUNT(*) as count FROM admins');
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
      
      // Delete admin
      await pool.query('DELETE FROM admins WHERE id = $1', [adminId]);
      
      console.log(`✅ Deleted admin: ${existingAdmin.rows[0].username}`);
      res.json({ message: 'Admin deleted successfully' });
    } else {
      res.status(503).json({ error: 'Database not available' });
    }
  } catch (error) {
    console.error('❌ Error in DELETE /api/admin/:id:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;