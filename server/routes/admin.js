const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Use direct database connection with new Railway database
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway',
  ssl: process.env.RAILWAY_ENVIRONMENT ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 5000,        // ลดจาก 30000
  connectionTimeoutMillis: 2000,  // ลดจาก 10000
  statement_timeout: 2000,        // เพิ่ม query timeout
  query_timeout: 2000             // เพิ่ม query timeout
});

console.log('✅ Admin routes loading with PostgreSQL database connection');

// Middleware to log all admin requests
router.use((req, res, next) => {
  console.log(`🌐 Admin API ${req.method} ${req.path} - Headers:`, {
    auth: req.headers.authorization ? 'Present' : 'Missing',
    contentType: req.headers['content-type']
  });
  next();
});

// Authentication middleware for admin routes
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  let token = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }
  
  try {
    console.log('🔐 Verifying admin token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('✅ Token verified for user:', decoded.username);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Apply authentication to all admin routes
router.use(authenticateToken);

// Timeout wrapper for database queries
const withTimeout = (promise, timeoutMs = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    )
  ]);
};

// Fallback mock data for when database fails
const mockAdmins = [
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

// Mock admin management with in-memory operations
let nextMockId = 4;

// GET /api/admin - Get all admins  
router.get('/', async (req, res) => {
  try {
    console.log('📁 Fetching admins from PostgreSQL database');
    
    const result = await withTimeout(
      pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC')
    );
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('❌ Error fetching admins from database:', error.message);
    console.log('🔄 Falling back to mock data due to database connection issues');
    
    // Fallback to mock data when database fails
    res.json({ 
      success: true, 
      admins: mockAdmins,
      fallback: true,
      message: 'Using fallback data due to database connection issues'
    });
  }
});

// GET /api/admin/admins - Alternative endpoint for frontend compatibility
router.get('/admins', async (req, res) => {
  try {
    console.log('📁 Fetching admins from PostgreSQL database via /admins endpoint');
    
    const result = await withTimeout(
      pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC')
    );
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('❌ Error fetching admins from database:', error.message);
    console.log('🔄 Falling back to mock data due to database connection issues');
    
    // Fallback to mock data when database fails
    res.json({ 
      success: true, 
      admins: mockAdmins,
      fallback: true,
      message: 'Using fallback data due to database connection issues'
    });
  }
});

// GET /api/admin/:id - Get specific admin
router.get('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    console.log(`📁 Fetching admin ID ${adminId} from PostgreSQL database`);
    
    const result = await pool.query(
      'SELECT id, username, role, status, created_at, last_login FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    console.log(`✅ Retrieved admin: ${result.rows[0].username}`);
    res.json({ success: true, admin: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching admin from database:', error);
    console.log('🔄 Falling back to mock data due to database connection issues');
    
    // Fallback to mock data
    const adminId = parseInt(req.params.id);
    const admin = mockAdmins.find(a => a.id === adminId);
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        error: 'Admin not found' 
      });
    }
    
    res.json({ 
      success: true, 
      admin: admin,
      fallback: true,
      message: 'Using fallback data due to database connection issues'
    });
  }
});

// POST /api/admin - Create new admin
router.post('/', async (req, res) => {
  try {
    const { username, password, full_name, role, status } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
      });
    }
    
    console.log(`📝 Creating new admin: ${username}`);
    
    try {
      // Check if username already exists
      const existingUser = await withTimeout(
        pool.query('SELECT id FROM admins WHERE username = $1', [username])
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
        });
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert new admin
      const result = await withTimeout(
        pool.query(
          'INSERT INTO admins (username, password, full_name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, full_name, role, status, created_at',
          [username, hashedPassword, full_name || '', role || 'admin', status || 'active']
        )
      );
      
      const newAdmin = result.rows[0];
      console.log(`✅ Created new admin: ${username}`);
      res.status(201).json({ success: true, admin: newAdmin });
      
    } catch (dbError) {
      console.error('❌ Database error creating admin:', dbError);
      // Fallback to mock data operations
      console.log('🔄 Database unavailable, using mock data for admin creation');
      
      // Check if username exists in mock data
      const existingMockUser = mockAdmins.find(a => a.username === username);
      if (existingMockUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
        });
      }
      
      // Create new mock admin
      const newMockAdmin = {
        id: nextMockId++,
        username,
        full_name: full_name || '',
        role: role || 'admin',
        status: status || 'active',
        created_at: new Date().toISOString(),
        last_login: null
      };
      
      mockAdmins.push(newMockAdmin);
      console.log(`✅ Created new mock admin: ${username}`);
      res.status(201).json({ 
        success: true, 
        admin: newMockAdmin,
        fallback: true,
        message: 'Admin created using fallback data - changes will not persist'
      });
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสร้างแอดมิน',
      details: error.message 
    });
  }
});

// POST /api/admin/admins - Alternative endpoint for frontend compatibility
router.post('/admins', async (req, res) => {
  // Redirect to main POST handler
  req.url = '/';
  router.handle(req, res);
});

// PUT /api/admin/:id - Update admin
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, status } = req.body;
    
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
      RETURNING id, username, role, status, created_at, updated_at
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin: ${updatedAdmin.username}`);
    res.json({ success: true, admin: updatedAdmin });
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    console.log('🔄 Cannot update admin due to database connection issues');
    
    // Return mock response when database fails
    res.status(200).json({ 
      success: false, 
      error: 'Cannot update admin - database connection issues',
      message: 'Admin updates are not available when using fallback data. Please try again when database connection is restored.',
      fallback: true
    });
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting admin ID: ${id}`);
    
    try {
      // Try database first
      const adminExists = await withTimeout(
        pool.query('SELECT id, username FROM admins WHERE id = $1', [id])
      );
      
      if (adminExists.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Admin not found' 
        });
      }
      
      // Check if this is the last admin
      const adminCount = await withTimeout(
        pool.query('SELECT COUNT(*) FROM admins WHERE status = $1', ['active'])
      );
      
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete the last admin' 
        });
      }
      
      const deletedAdmin = adminExists.rows[0];
      
      // Delete admin
      await withTimeout(
        pool.query('DELETE FROM admins WHERE id = $1', [id])
      );
      
      console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
      res.json({ 
        success: true, 
        message: 'Admin deleted successfully' 
      });
      
    } catch (dbError) {
      // Fallback to mock data operations
      console.log('🔄 Database unavailable, using mock data for admin deletion');
      
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
      mockAdmins.splice(adminIndex, 1);
      
      console.log(`✅ Deleted mock admin: ${deletedAdmin.username}`);
      res.json({ 
        success: true, 
        message: 'Admin deleted successfully (from fallback data)',
        fallback: true
      });
    }
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete admin',
      details: error.message 
    });
  }
});

// Additional endpoints for /admins/:id path compatibility

// PUT /api/admin/admins/:id - Update admin (alternative endpoint)
router.put('/admins/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, role, status } = req.body;
  
  console.log(`📝 Updating admin ID: ${id}`);
  console.log('Update data:', { username, full_name, role, status, hasPassword: !!password });
  
  try {
    if (!username || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }
    
    // Try database first
    const adminExists = await withTimeout(
      pool.query('SELECT id, username FROM admins WHERE id = $1', [id])
    );
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการอัปเดต' 
      });
    }
    
    // Check for duplicate username (excluding current admin)
    const duplicateCheck = await withTimeout(
      pool.query('SELECT id FROM admins WHERE username = $1 AND id != $2', [username, id])
    );
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
      });
    }
    
    let updateQuery;
    let updateValues;
    
    if (password) {
      // Hash new password if provided
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery = 'UPDATE admins SET username = $1, password = $2, full_name = $3, role = $4, status = $5, updated_at = NOW() WHERE id = $6 RETURNING id, username, full_name, role, status, created_at, updated_at';
      updateValues = [username, hashedPassword, full_name || username, role, status || 'active', id];
    } else {
      // Update without changing password
      updateQuery = 'UPDATE admins SET username = $1, full_name = $2, role = $3, status = $4, updated_at = NOW() WHERE id = $5 RETURNING id, username, full_name, role, status, created_at, updated_at';
      updateValues = [username, full_name || username, role, status || 'active', id];
    }
    
    const result = await withTimeout(pool.query(updateQuery, updateValues));
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin: ${updatedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว', 
      admin: updatedAdmin 
    });
    
  } catch (dbError) {
    // Fallback to mock data operations
    console.log('🔄 Database unavailable, using mock data for admin update');
    
    const adminIndex = mockAdmins.findIndex(a => a.id == id);
    
    if (adminIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการอัปเดต' 
      });
    }
    
    // Check for duplicate username
    const duplicateAdmin = mockAdmins.find(a => a.username === username && a.id != id);
    if (duplicateAdmin) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
      });
    }
    
    // Update mock admin
    const updatedAdmin = {
      ...mockAdmins[adminIndex],
      username,
      full_name: full_name || username,
      role,
      status: status || 'active',
      updated_at: new Date().toISOString()
    };
    
    if (password) {
      updatedAdmin.password = await bcrypt.hash(password, 12);
    }
    
    mockAdmins[adminIndex] = updatedAdmin;
    
    // Remove password from response
    const { password: _, ...adminResponse } = updatedAdmin;
    
    console.log(`✅ Updated mock admin: ${updatedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว (จากข้อมูลสำรอง)', 
      admin: adminResponse,
      fallback: true 
    });
  }
});

// DELETE /api/admin/admins/:id - Delete admin (alternative endpoint)
router.delete('/admins/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`🗑️ Deleting admin ID: ${id}`);
    
    try {
      // Try database first
      const adminExists = await withTimeout(
        pool.query('SELECT id, username FROM admins WHERE id = $1', [id])
      );
      
      if (adminExists.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'ไม่พบผู้ดูแลระบบที่ต้องการลบ' 
        });
      }
      
      // Check if this is the last admin
      const adminCount = await withTimeout(
        pool.query('SELECT COUNT(*) FROM admins WHERE status = $1', ['active'])
      );
      
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้' 
        });
      }
      
      const deletedAdmin = adminExists.rows[0];
      
      // Delete admin
      await withTimeout(
        pool.query('DELETE FROM admins WHERE id = $1', [id])
      );
      
      console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
      res.json({ 
        success: true, 
        message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว' 
      });
      
    } catch (dbError) {
      // Fallback to mock data operations
      console.log('🔄 Database unavailable, using mock data for admin deletion');
      
      const adminIndex = mockAdmins.findIndex(a => a.id == id);
      
      if (adminIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'ไม่พบผู้ดูแลระบบที่ต้องการลบ' 
        });
      }
      
      // Prevent deleting the last admin
      if (mockAdmins.length <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้' 
        });
      }
      
      const deletedAdmin = mockAdmins[adminIndex];
      mockAdmins.splice(adminIndex, 1);
      
      console.log(`✅ Deleted mock admin: ${deletedAdmin.username}`);
      res.json({ 
        success: true, 
        message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว (จากข้อมูลสำรอง)',
        fallback: true
      });
    }
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ',
      details: error.message 
    });
  }
});

module.exports = router;