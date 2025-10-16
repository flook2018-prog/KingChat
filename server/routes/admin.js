const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Use direct database connection with Railway PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway',
  ssl: false, // Railway internal connection doesn't need SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000,
  query_timeout: 10000
});

console.log('✅ Admin routes loading with PostgreSQL database connection only');

// Initialize database schema
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database schema...');
    
    // Test connection first
    await pool.query('SELECT 1');
    console.log('✅ Database connection test successful');
    
    // Create admins table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status)');
    
    // Check if admin exists, if not create default admin
    const adminExists = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
    
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(
        'INSERT INTO admins (username, password, full_name, role, status) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hashedPassword, 'ผู้ดูแลระบบหลัก', 'super-admin', 'active']
      );
      console.log('✅ Created default admin account (admin/admin123)');
    } else {
      console.log('✅ Default admin account already exists');
    }
    
    console.log('✅ Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    console.error('❌ Database URL:', 'postgresql://postgres:***@postgres-kbtt.railway.internal:5432/railway');
    return false;
  }
}

// Initialize database on startup
initializeDatabase();

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

// GET /api/admin - Get all admins  
router.get('/', async (req, res) => {
  try {
    console.log('📁 Fetching admins from PostgreSQL database');
    
    const result = await pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC');
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('❌ Error fetching admins from database:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
    });
  }
});

// GET /api/admin/admins - Alternative endpoint for frontend compatibility
router.get('/admins', async (req, res) => {
  try {
    console.log('📁 Fetching admins from PostgreSQL database via /admins endpoint');
    console.log('🔗 Using connection string: postgresql://postgres:***@postgres-kbtt.railway.internal:5432/railway');
    
    // Test database connection first
    console.log('🧪 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection test successful');
    
    const result = await pool.query('SELECT id, username, full_name, role, status, created_at, last_login FROM admins ORDER BY created_at DESC');
    
    console.log(`✅ Retrieved ${result.rows.length} admins from database`);
    res.json({ success: true, admins: result.rows });
  } catch (error) {
    console.error('❌ Error fetching admins from database:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message,
      code: error.code
    });
  }
});

// GET /api/admin/:id - Get specific admin
router.get('/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    console.log(`📁 Fetching admin ID ${adminId} from PostgreSQL database`);
    
    const result = await pool.query(
      'SELECT id, username, full_name, role, status, created_at, last_login FROM admins WHERE id = $1',
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
    console.error('❌ Error fetching admin:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection error',
      details: error.message
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
        error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
      });
    }
    
    console.log(`📝 Creating new admin: ${username}`);
    
    // Check if username already exists
    const existingUser = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new admin
    const result = await pool.query(
      'INSERT INTO admins (username, password, full_name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, full_name, role, status, created_at',
      [username, hashedPassword, full_name || username, role || 'admin', status || 'active']
    );
    
    const newAdmin = result.rows[0];
    console.log(`✅ Created new admin: ${username}`);
    res.status(201).json({ 
      success: true, 
      message: 'เพิ่มผู้ดูแลระบบเรียบร้อยแล้ว',
      admin: newAdmin 
    });
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ',
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
    const { username, password, full_name, role, status } = req.body;
    
    console.log(`📝 Updating admin ID: ${id}`);
    
    if (!username || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }
    
    // Check if admin exists
    const adminExists = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการอัปเดต' 
      });
    }
    
    // Check for duplicate username (excluding current admin)
    const duplicateCheck = await pool.query('SELECT id FROM admins WHERE username = $1 AND id != $2', [username, id]);
    
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
    
    const result = await pool.query(updateQuery, updateValues);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin: ${updatedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว', 
      admin: updatedAdmin 
    });
    
  } catch (error) {
    console.error('❌ Error updating admin:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ดูแลระบบ',
      details: error.message
    });
  }
});

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
    
    // Check if admin exists
    const adminExists = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการอัปเดต' 
      });
    }
    
    // Check for duplicate username (excluding current admin)
    const duplicateCheck = await pool.query('SELECT id FROM admins WHERE username = $1 AND id != $2', [username, id]);
    
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
    
    const result = await pool.query(updateQuery, updateValues);
    const updatedAdmin = result.rows[0];
    
    console.log(`✅ Updated admin: ${updatedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว', 
      admin: updatedAdmin 
    });
    
  } catch (error) {
    console.error('❌ Error updating admin:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ดูแลระบบ',
      details: error.message
    });
  }
});

// DELETE /api/admin/:id - Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting admin ID: ${id}`);
    
    // Check if admin exists
    const adminExists = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการลบ' 
      });
    }
    
    // Check if this is the last admin
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins WHERE status = $1', ['active']);
    
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้' 
      });
    }
    
    const deletedAdmin = adminExists.rows[0];
    
    // Delete admin
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    
    console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ',
      details: error.message
    });
  }
});

// DELETE /api/admin/admins/:id - Delete admin (alternative endpoint)
router.delete('/admins/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`🗑️ Deleting admin ID: ${id}`);
    
    // Check if admin exists
    const adminExists = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    
    if (adminExists.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ดูแลระบบที่ต้องการลบ' 
      });
    }
    
    // Check if this is the last admin
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins WHERE status = $1', ['active']);
    
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้' 
      });
    }
    
    const deletedAdmin = adminExists.rows[0];
    
    // Delete admin
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);
    
    console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
    res.json({ 
      success: true, 
      message: 'ลบผู้ดูแลระบบเรียบร้อยแล้ว' 
    });
    
  } catch (error) {
    console.error('❌ Error deleting admin:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ',
      details: error.message
    });
  }
});

module.exports = router;