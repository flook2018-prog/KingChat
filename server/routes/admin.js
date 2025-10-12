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

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const adminData = {
      full_name: fullName,
      username,
      password: hashedPassword,
      role,
      level: role === 'super_admin' ? 100 : 80,
      points: points || 0,
      messages_handled: 0
    };
    
    const newAdmin = await Admin.create(adminData);
    
    const transformedAdmin = {
      id: newAdmin.id,
      fullName: newAdmin.full_name,
      username: newAdmin.username,
      role: newAdmin.role,
      level: newAdmin.level,
      points: newAdmin.points,
      messagesHandled: newAdmin.messages_handled,
      lastLogin: newAdmin.created_at
    };
    
    res.status(201).json(transformedAdmin);
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create admin' });
    }
  }
});

// PUT /api/admin/:id - Update admin
router.put('/:id', async (req, res) => {
  try {
    const { fullName, username, password, role, points } = req.body;
    
    const updateData = {};
    if (fullName) updateData.full_name = fullName;
    if (username) updateData.username = username;
    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role) {
      updateData.role = role;
      updateData.level = role === 'super_admin' ? 100 : 80;
    }
    if (points !== undefined) updateData.points = points;
    
    const [affectedRows] = await Admin.update(updateData, {
      where: { id: req.params.id }
    });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    const updatedAdmin = await Admin.findByPk(req.params.id);
    
    const transformedAdmin = {
      id: updatedAdmin.id,
      fullName: updatedAdmin.full_name,
      username: updatedAdmin.username,
      role: updatedAdmin.role,
      level: updatedAdmin.level,
      points: updatedAdmin.points,
      messagesHandled: updatedAdmin.messages_handled,
      lastLogin: updatedAdmin.created_at
    };
    
    res.json(transformedAdmin);
  } catch (error) {
    console.error('Error updating admin:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update admin' });
    }
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const deletedRows = await Admin.destroy({
      where: { id: req.params.id }
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({ message: 'Admin deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: '✅ Admin API is working!', 
    timestamp: new Date(),
    endpoints: [
      'GET /api/admin - Get all admins',
      'GET /api/admin/:id - Get admin by ID',
      'POST /api/admin - Create admin',
      'PUT /api/admin/:id - Update admin',
      'DELETE /api/admin/:id - Delete admin'
    ]
  });
});

module.exports = router;