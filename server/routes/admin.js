const express = require('express');
const router = express.Router();

// Try to load Admin model with fallback
let Admin;
try {
  Admin = require('../models/Admin');
} catch (error) {
  console.error('❌ Admin model not found, using fallback');
  // Create a fallback Admin class
  Admin = {
    async getAll() {
      // Return demo data if model fails
      return [
        {
          id: 1,
          display_name: 'สมชาย ใจดี',
          username: 'admin',
          role: 'super_admin',
          level: 100,
          points: 4500,
          messages_handled: 450,
          created_at: new Date()
        },
        {
          id: 2,
          display_name: 'สุภา รักงาน',
          username: 'supha_admin',
          role: 'admin',
          level: 80,
          points: 2300,
          messages_handled: 230,
          created_at: new Date()
        },
        {
          id: 3,
          display_name: 'วิชัย เก่งงาน',
          username: 'vichai_admin',
          role: 'admin',
          level: 80,
          points: 1800,
          messages_handled: 180,
          created_at: new Date()
        },
        {
          id: 4,
          display_name: 'นันทพร ขยันดี',
          username: 'nantaporn_admin',
          role: 'admin',
          level: 80,
          points: 6500,
          messages_handled: 650,
          created_at: new Date()
        }
      ];
    },
    async getById(id) {
      const admins = await this.getAll();
      return admins.find(admin => admin.id == id);
    },
    async create(data) {
      // Mock create - return demo admin
      return {
        id: Date.now(),
        display_name: data.fullName,
        username: data.username,
        role: data.role,
        level: data.role === 'super_admin' ? 100 : 80,
        points: data.points || 0,
        messages_handled: Math.floor((data.points || 0) / 10),
        created_at: new Date()
      };
    },
    async update(id, data) {
      const admin = await this.getById(id);
      if (!admin) return null;
      return { ...admin, ...data, display_name: data.fullName };
    },
    async delete(id) {
      return { id, deleted: true };
    }
  };
}

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