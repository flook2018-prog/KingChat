const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

console.log('📁 Admin Hybrid: Loading with database and fallback support');

// Try to import database connection
let isDatabaseConnected, testQuery;
try {
  const db = require('../models/database-direct');
  isDatabaseConnected = db.isDatabaseConnected;
  testQuery = db.testQuery;
  console.log('📊 Database module loaded for admin');
} catch (error) {
  console.log('⚠️ Database module not available, using fallback mode');
  isDatabaseConnected = () => false;
  testQuery = () => { throw new Error('Database not available'); };
}

// Fallback admin data (will be synchronized with auth system)
const FALLBACK_ADMINS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@kingchat.com',
    role: 'super-admin',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    updated_at: '2025-10-15T10:56:57.125Z',
    last_login: '2025-10-15T10:56:57.125Z'
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@kingchat.com',
    role: 'admin',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    updated_at: '2025-10-15T10:56:57.125Z',
    last_login: null
  },
  {
    id: 3,
    username: 'operator',
    email: 'operator@kingchat.com',
    role: 'operator',
    status: 'active',
    created_at: '2025-10-15T10:56:57.125Z',
    updated_at: '2025-10-15T10:56:57.125Z',
    last_login: null
  }
];

// Dynamic admin storage for fallback mode
let dynamicAdmins = [...FALLBACK_ADMINS];

// Function to sync admin with auth system
async function syncWithAuth(adminData) {
  try {
    const response = await fetch('http://localhost:5001/api/auth/sync-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });
    
    if (response.ok) {
      console.log(`✅ Admin synced with auth system: ${adminData.username}`);
    } else {
      console.log(`⚠️ Auth sync failed for: ${adminData.username}`);
    }
  } catch (error) {
    console.log(`⚠️ Auth sync error: ${error.message}`);
  }
}

// GET /api/admin - Get all admins
router.get('/', async (req, res) => {
  try {
    let admins = [];
    let usingDatabase = false;
    
    // Try database first
    if (isDatabaseConnected()) {
      try {
        console.log('📁 Fetching admins from PostgreSQL database');
        const result = await testQuery(
          'SELECT id, username, email, role, status, created_at, updated_at, last_login FROM admins ORDER BY created_at DESC'
        );
        
        admins = result.rows;
        usingDatabase = true;
        console.log(`✅ Retrieved ${admins.length} admins from database`);
      } catch (dbError) {
        console.log(`⚠️ Database fetch failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data if database failed
    if (!usingDatabase) {
      console.log('📋 Using fallback admin data');
      admins = dynamicAdmins;
    }
    
    res.json({ 
      success: true, 
      admins: admins,
      database: usingDatabase,
      fallback: !usingDatabase,
      count: admins.length,
      message: usingDatabase ? 'Data loaded from PostgreSQL database' : 'Using fallback data due to database connection issues'
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
    const { id } = req.params;
    let admin = null;
    let usingDatabase = false;
    
    // Try database first
    if (isDatabaseConnected()) {
      try {
        console.log(`📁 Fetching admin ID ${id} from database`);
        const result = await testQuery(
          'SELECT id, username, email, role, status, created_at, updated_at, last_login FROM admins WHERE id = $1',
          [id]
        );
        
        if (result.rows.length > 0) {
          admin = result.rows[0];
          usingDatabase = true;
        }
      } catch (dbError) {
        console.log(`⚠️ Database fetch failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data if database failed
    if (!admin) {
      console.log(`📋 Searching fallback data for admin ID ${id}`);
      admin = dynamicAdmins.find(a => a.id === parseInt(id));
    }
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Found admin: ${admin.username} (${usingDatabase ? 'database' : 'fallback'})`);
    res.json({ 
      success: true, 
      admin: admin,
      database: usingDatabase
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

// POST /api/admin - Create new admin
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
    
    let newAdmin = null;
    let usingDatabase = false;
    
    // Try database first
    if (isDatabaseConnected()) {
      try {
        // Check if username already exists in database
        const existingUser = await testQuery(
          'SELECT id FROM admins WHERE username = $1',
          [username]
        );
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists in database' 
          });
        }
        
        // Hash password and insert
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const result = await testQuery(
          'INSERT INTO admins (username, password, email, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, email, role, status, created_at',
          [username, hashedPassword, email || `${username}@kingchat.com`, role || 'admin', 'active']
        );
        
        newAdmin = result.rows[0];
        usingDatabase = true;
        console.log(`✅ Created admin in database: ${username} (ID: ${newAdmin.id})`);
      } catch (dbError) {
        console.log(`⚠️ Database creation failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data if database failed
    if (!newAdmin) {
      console.log('📋 Creating admin in fallback data');
      
      // Check if username already exists in fallback
      const existingAdmin = dynamicAdmins.find(admin => admin.username === username);
      if (existingAdmin) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already exists in fallback data' 
        });
      }
      
      // Create new admin in fallback
      const newId = Math.max(...dynamicAdmins.map(a => a.id)) + 1;
      newAdmin = {
        id: newId,
        username: username,
        email: email || `${username}@kingchat.com`,
        role: role || 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null
      };
      
      dynamicAdmins.push(newAdmin);
      console.log(`✅ Created admin in fallback: ${username} (ID: ${newId})`);
      
      // Sync with auth system
      await syncWithAuth({ username, password, role, email });
    }
    
    res.status(201).json({ 
      success: true, 
      admin: newAdmin,
      database: usingDatabase,
      fallback: !usingDatabase,
      message: usingDatabase ? 
        'Admin created successfully in PostgreSQL database' : 
        'Admin created in fallback system and synced with authentication'
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
    const { id } = req.params;
    const { username, password, role, status, email } = req.body;
    
    console.log(`📝 Updating admin ID ${id}`);
    
    let updatedAdmin = null;
    let usingDatabase = false;
    
    // Try database first
    if (isDatabaseConnected()) {
      try {
        // Check if admin exists
        const adminExists = await testQuery(
          'SELECT id FROM admins WHERE id = $1',
          [id]
        );
        
        if (adminExists.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Admin not found in database' 
          });
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
        updateValues.push(id);
        
        const updateQuery = `
          UPDATE admins 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramCount}
          RETURNING id, username, email, role, status, created_at, updated_at
        `;
        
        const result = await testQuery(updateQuery, updateValues);
        updatedAdmin = result.rows[0];
        usingDatabase = true;
        console.log(`✅ Updated admin in database: ${updatedAdmin.username} (ID: ${id})`);
      } catch (dbError) {
        console.log(`⚠️ Database update failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data if database failed
    if (!updatedAdmin) {
      console.log(`📋 Updating admin in fallback data: ID ${id}`);
      
      const adminIndex = dynamicAdmins.findIndex(a => a.id === parseInt(id));
      if (adminIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Admin not found in fallback data' 
        });
      }
      
      // Update admin in fallback
      const admin = dynamicAdmins[adminIndex];
      if (username) admin.username = username;
      if (email !== undefined) admin.email = email;
      if (role) admin.role = role;
      if (status) admin.status = status;
      admin.updated_at = new Date().toISOString();
      
      updatedAdmin = admin;
      console.log(`✅ Updated admin in fallback: ${admin.username} (ID: ${id})`);
    }
    
    res.json({ 
      success: true, 
      admin: updatedAdmin,
      database: usingDatabase,
      message: usingDatabase ? 
        'Admin updated successfully in PostgreSQL database' : 
        'Admin updated in fallback system'
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
    const { id } = req.params;
    console.log(`🗑️ Deleting admin ID ${id}`);
    
    let deletedAdmin = null;
    let usingDatabase = false;
    
    // Try database first
    if (isDatabaseConnected()) {
      try {
        // Check if admin exists
        const adminExists = await testQuery(
          'SELECT id, username FROM admins WHERE id = $1',
          [id]
        );
        
        if (adminExists.rows.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Admin not found in database' 
          });
        }
        
        // Check if this is the last admin
        const adminCount = await testQuery('SELECT COUNT(*) FROM admins WHERE status = $1', ['active']);
        
        if (parseInt(adminCount.rows[0].count) <= 1) {
          return res.status(400).json({ 
            success: false, 
            error: 'Cannot delete the last admin' 
          });
        }
        
        deletedAdmin = adminExists.rows[0];
        
        // Delete admin
        await testQuery('DELETE FROM admins WHERE id = $1', [id]);
        usingDatabase = true;
        console.log(`✅ Deleted admin from database: ${deletedAdmin.username} (ID: ${id})`);
      } catch (dbError) {
        console.log(`⚠️ Database deletion failed: ${dbError.message}`);
      }
    }
    
    // Fallback to mock data if database failed
    if (!deletedAdmin) {
      console.log(`📋 Deleting admin from fallback data: ID ${id}`);
      
      const adminIndex = dynamicAdmins.findIndex(a => a.id === parseInt(id));
      if (adminIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Admin not found in fallback data' 
        });
      }
      
      // Check if this is the last admin
      const activeAdmins = dynamicAdmins.filter(a => a.status === 'active');
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete the last admin' 
        });
      }
      
      deletedAdmin = dynamicAdmins[adminIndex];
      dynamicAdmins.splice(adminIndex, 1);
      console.log(`✅ Deleted admin from fallback: ${deletedAdmin.username} (ID: ${id})`);
    }
    
    res.json({ 
      success: true, 
      message: usingDatabase ? 
        'Admin deleted successfully from PostgreSQL database' : 
        'Admin deleted from fallback system',
      database: usingDatabase,
      deleted_admin: deletedAdmin.username
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