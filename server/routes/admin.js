const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

console.log('✅ Admin routes loading with mock data for development');

// Mock data for admins
let mockAdmins = [
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
];

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    console.log('📁 Fetching admins from mock data');
    console.log(`✅ Retrieved ${mockAdmins.length} admins from mock data`);
    res.json({ success: true, admins: mockAdmins });
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
    const adminId = parseInt(req.params.id);
    console.log(`📁 Fetching admin ID ${adminId} from mock data`);
    
    const admin = mockAdmins.find(a => a.id === adminId);
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Retrieved admin: ${admin.username}`);
    res.json({ success: true, admin });
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
    const existingUser = mockAdmins.find(a => a.username === username);
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    // Create new admin
    const newAdmin = {
      id: Date.now(),
      username,
      role: role || 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    };
    
    mockAdmins.push(newAdmin);
    
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
    
    console.log(`✏️ Updating admin ID ${adminId}: ${username}`);
    
    // Find admin
    const adminIndex = mockAdmins.findIndex(a => a.id === adminId);
    
    if (adminIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Check if new username already exists (for other admins)
    const usernameExists = mockAdmins.find(a => a.username === username && a.id !== adminId);
    
    if (usernameExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    // Update admin
    mockAdmins[adminIndex] = {
      ...mockAdmins[adminIndex],
      username,
      role: role || mockAdmins[adminIndex].role,
      updated_at: new Date().toISOString()
    };
    
    const updatedAdmin = mockAdmins[adminIndex];
    
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
    
    // Find admin
    const adminIndex = mockAdmins.findIndex(a => a.id === adminId);
    
    if (adminIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Prevent deleting the last admin
    if (mockAdmins.length <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete the last admin' 
      });
    }
    
    const deletedAdmin = mockAdmins[adminIndex];
    
    // Delete admin
    mockAdmins.splice(adminIndex, 1);
    
    console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
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