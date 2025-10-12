const express = require('express');
const router = express.Router();

// Use direct database connection instead of Sequelize
const { pool } = require('../models/database');
console.log('✅ Admin routes loading with direct PostgreSQL connection');

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, "displayName", role FROM admins ORDER BY id'
    );
    
    // Transform data to match frontend expectations
    const transformedAdmins = result.rows.map(admin => ({
      id: admin.id,
      fullName: admin.displayName || admin.username,
      username: admin.username,
      role: admin.role,
      level: admin.role === 'admin' ? 100 : 80,
      points: 0, // Could be calculated or stored separately
      messagesHandled: 0, // Could be calculated from messages table
      lastLogin: admin.updatedAt || admin.createdAt
    }));
    
    res.json(transformedAdmins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// GET /api/admin/:id - Get admin by ID
router.get('/:id', async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    const transformedAdmin = {
      id: admin.id,
      fullName: admin.full_name,
      username: admin.username,
      role: admin.role,
      level: admin.level,
      points: admin.points,
      messagesHandled: admin.messages_handled,
      lastLogin: admin.created_at
    };
    
    res.json(transformedAdmin);
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
});

// POST /api/admin - Create new admin
router.post('/', async (req, res) => {
  try {
    const { fullName, username, password, role, points } = req.body;
    
    // Validate required fields
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: fullName, username, password, role' 
      });
    }

    console.log('🔐 Creating new admin:', username);

    // Hash password using bcrypt
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 12); // Use same rounds as existing hash
    
    console.log('✅ Password hashed successfully');

    // Insert new admin into database
    const result = await pool.query(
      `INSERT INTO admins (username, email, password, "displayName", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, username, email, "displayName", role, "createdAt"`,
      [
        username.toLowerCase(),
        `${username}@kingchat.com`, // Generate email
        hashedPassword,
        fullName,
        role
      ]
    );

    const newAdmin = result.rows[0];
    console.log('✅ Admin created successfully:', newAdmin.username);
    
    const transformedAdmin = {
      id: newAdmin.id,
      fullName: newAdmin.displayName,
      username: newAdmin.username,
      role: newAdmin.role,
      level: role === 'super_admin' ? 100 : 80,
      points: points || 0,
      messagesHandled: 0,
      lastLogin: newAdmin.createdAt
    };
    
    res.status(201).json(transformedAdmin);
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create admin: ' + error.message });
    }
  }
});

// PUT /api/admin/:id - Update admin
router.put('/:id', async (req, res) => {
  try {
    const { fullName, username, password, role, points } = req.body;
    
    console.log('🔄 Updating admin ID:', req.params.id);

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (fullName) {
      updateFields.push(`"displayName" = $${paramIndex++}`);
      updateValues.push(fullName);
    }
    if (username) {
      updateFields.push(`username = $${paramIndex++}`);
      updateValues.push(username.toLowerCase());
    }
    if (password) {
      console.log('🔐 Hashing new password...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.push(`password = $${paramIndex++}`);
      updateValues.push(hashedPassword);
      console.log('✅ Password hashed and ready for update');
    }
    if (role) {
      updateFields.push(`role = $${paramIndex++}`);
      updateValues.push(role);
    }

    // Add updated timestamp
    updateFields.push(`"updatedAt" = NOW()`);
    
    // Add ID for WHERE clause
    updateValues.push(req.params.id);
    
    if (updateFields.length === 1) { // Only timestamp was added
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updateQuery = `
      UPDATE admins 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, username, email, "displayName", role, "updatedAt"
    `;

    const result = await pool.query(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const updatedAdmin = result.rows[0];
    console.log('✅ Admin updated successfully:', updatedAdmin.username);
    
    const transformedAdmin = {
      id: updatedAdmin.id,
      fullName: updatedAdmin.displayName,
      username: updatedAdmin.username,
      role: updatedAdmin.role,
      level: updatedAdmin.role === 'super_admin' ? 100 : 80,
      points: points || 0,
      messagesHandled: 0,
      lastLogin: updatedAdmin.updatedAt
    };
    
    res.json(transformedAdmin);
  } catch (error) {
    console.error('Error updating admin:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update admin: ' + error.message });
    }
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM admins WHERE id = $1 RETURNING id, username',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const deletedAdmin = result.rows[0];
    console.log('✅ Admin deleted successfully:', deletedAdmin.username);
    
    res.json({ 
      message: 'Admin deleted successfully', 
      id: req.params.id,
      username: deletedAdmin.username
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin: ' + error.message });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: '✅ Admin API is working!', 
    timestamp: new Date(),
    database: 'PostgreSQL with raw SQL queries',
    endpoints: [
      'GET /api/admin - Get all admins',
      'GET /api/admin/:id - Get admin by ID',
      'POST /api/admin - Create admin (with password hashing)',
      'PUT /api/admin/:id - Update admin (with password hashing)',
      'DELETE /api/admin/:id - Delete admin'
    ]
  });
});

module.exports = router;