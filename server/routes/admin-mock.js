const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

console.log('⚠️  Using TEMPORARY mock data for demonstration (Production will use real PostgreSQL)');

// TEMPORARY mock data for demonstration
let mockAdmins = [
  {
    id: 1,
    username: 'admin',
    role: 'super_admin',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: null
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
    username: 'staff',
    role: 'staff',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: null
  }
];

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    console.log('📁 Fetching admins (MOCK DATA for demonstration)');
    console.log(`✅ Retrieved ${mockAdmins.length} mock admins`);
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
    const { id } = req.params;
    console.log(`🔍 Fetching admin ID: ${id} (MOCK DATA)`);
    
    const admin = mockAdmins.find(a => a.id == id);
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Found admin: ${admin.username}`);
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
    
    console.log(`📝 Creating new admin: ${username} (MOCK DATA)`);
    
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
    const { id } = req.params;
    const { username, password, role, status } = req.body;
    
    console.log(`📝 Updating admin ID: ${id} (MOCK DATA)`);
    
    // Find admin
    const adminIndex = mockAdmins.findIndex(a => a.id == id);
    
    if (adminIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    // Check if username already exists for another admin
    if (username) {
      const existingUser = mockAdmins.find(a => a.username === username && a.id != id);
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already exists' 
        });
      }
    }
    
    // Update admin
    if (username) mockAdmins[adminIndex].username = username;
    if (role) mockAdmins[adminIndex].role = role;
    if (status) mockAdmins[adminIndex].status = status;
    mockAdmins[adminIndex].updated_at = new Date().toISOString();
    
    console.log(`✅ Updated admin: ${mockAdmins[adminIndex].username}`);
    res.json({ success: true, admin: mockAdmins[adminIndex] });
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
    const { id } = req.params;
    console.log(`🗑️ Deleting admin ID: ${id} (MOCK DATA)`);
    
    // Find admin
    const adminIndex = mockAdmins.findIndex(a => a.id == id);
    
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