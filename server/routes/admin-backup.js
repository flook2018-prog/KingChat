const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    const admins = await Admin.getAll();
    
    // Transform data to match frontend expectations
    const transformedAdmins = admins.map(admin => ({
      id: admin.id,
      fullName: admin.full_name || admin.display_name,
      username: admin.username,
      role: admin.role,
      level: admin.level,
      points: admin.points,
      messagesHandled: admin.messages_handled,
      lastLogin: admin.created_at
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
    const admin = await Admin.getById(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    const transformedAdmin = {
      id: admin.id,
      fullName: admin.full_name || admin.display_name,
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
    
    const adminData = {
      fullName,
      username,
      password,
      role,
      points: points || 0
    };
    
    const newAdmin = await Admin.create(adminData);
    
    const transformedAdmin = {
      id: newAdmin.id,
      fullName: newAdmin.full_name || newAdmin.display_name,
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
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Username already exists' });
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
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (points !== undefined) updateData.points = points;
    
    const updatedAdmin = await Admin.update(req.params.id, updateData);
    
    if (!updatedAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    const transformedAdmin = {
      id: updatedAdmin.id,
      fullName: updatedAdmin.full_name || updatedAdmin.display_name,
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
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update admin' });
    }
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const deletedAdmin = await Admin.delete(req.params.id);
    
    if (!deletedAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({ message: 'Admin deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

module.exports = router;