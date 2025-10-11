const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Debug route to check if admin API is working
router.get('/debug', (req, res) => {
  res.json({
    message: 'Admin API is working',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /admin-users',
      'POST /admin-users', 
      'PUT /admin-users/:id',
      'DELETE /admin-users/:id',
      'PUT /admin-users/:id/password',
      'GET /debug/users - Check all users in database'
    ]
  });
});

// Debug route to check users in database
router.get('/debug/users', async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    
    const [users] = await sequelize.query(`
      SELECT id, username, email, role, status, created_at
      FROM users 
      ORDER BY created_at DESC;
    `);
    
    res.json({
      message: 'Users in database',
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update last login when user accesses admin panel
router.post('/update-activity', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const userId = req.user.id;
    
    await sequelize.query(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = :userId;
    `, {
      replacements: { userId }
    });
    
    res.json({ message: 'Activity updated' });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin details with password (for super admin only)
router.get('/admin-users/:id/details', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { id } = req.params;
    
    // Check if current user is super admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    
    const [admin] = await sequelize.query(`
      SELECT id, username, email, role, status, last_login, created_at, password_hash
      FROM users 
      WHERE id = :id;
    `, {
      replacements: { id }
    });
    
    if (admin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json({
      admin: {
        ...admin[0],
        password_hash: admin[0].password_hash // Include password hash for super admin
      }
    });
  } catch (error) {
    console.error('Get admin details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Permission levels
const PERMISSIONS = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  MANAGER: 'manager',
  AGENT: 'agent',
  VIEWER: 'viewer'
};

// Permission hierarchy (higher can manage lower)
const PERMISSION_LEVELS = {
  'admin': 5,
  'manager': 4,
  'agent': 3,
  'supervisor': 2,
  'viewer': 1
};

// Check if user can manage target role
function canManageRole(userRole, targetRole) {
  return PERMISSION_LEVELS[userRole] > PERMISSION_LEVELS[targetRole];
}

// Get all admins with pagination and search - using raw SQL
router.get('/admin-users', auth, async (req, res) => {
  try {
    console.log('🔍 GET /admin-users called by user:', req.user?.username);
    const { sequelize } = require('../config/database');
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let searchCondition = '';
    let replacements = { limit: parseInt(limit), offset: parseInt(offset) };
    
    if (search) {
      searchCondition = `WHERE username ILIKE :search OR email ILIKE :search`;
      replacements.search = `%${search}%`;
    }
    
    // Get admins with pagination
    const [admins] = await sequelize.query(`
      SELECT 
        id, username, email, role, status as "isActive", 
        last_login as "last_activity", created_at as "createdAt"
      FROM users
      ${searchCondition}
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset;
    `, {
      replacements
    });
    
    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users ${searchCondition};
    `, {
      replacements: search ? { search: `%${search}%` } : {}
    });
    
    const total = parseInt(countResult[0].count);
    
    console.log(`📊 Found ${total} admins total, returning ${admins.length} for page ${page}`);
    console.log('📝 Admins data:', JSON.stringify(admins, null, 2));
    
    res.json({
      admins: admins.map(admin => ({
        ...admin,
        isActive: admin.isActive === 'active',
        displayName: admin.username // Use username as displayName
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Get admins error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Create new admin - using raw SQL
router.post('/admin-users', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { username, email, password, displayName, role = 'admin', isActive = true } = req.body;

    console.log('📝 Creating new admin:', { username, email, role });

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const [existingUser] = await sequelize.query(`
      SELECT id FROM users WHERE username = :username OR email = :email;
    `, {
      replacements: { username, email: email || '' }
    });

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const [result] = await sequelize.query(`
      INSERT INTO users (username, email, password_hash, role, status, created_at)
      VALUES (:username, :email, :password, :role, :status, CURRENT_TIMESTAMP)
      RETURNING id, username, email, role, status, created_at;
    `, {
      replacements: {
        username,
        email: email || null,
        password: hashedPassword,
        role,
        status: isActive ? 'active' : 'inactive'
      }
    });

    console.log('✅ Admin created successfully:', result[0]);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        ...result[0],
        isActive: result[0].status === 'active',
        displayName: result[0].username
      }
    });
  } catch (error) {
    console.error('❌ Create admin error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update admin - using raw SQL
router.put('/admin-users/:id', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;

    console.log('📝 Updating admin:', id, { username, email, role, isActive });

    // Check if admin exists
    const [existingAdmin] = await sequelize.query(`
      SELECT id FROM users WHERE id = :id;
    `, {
      replacements: { id }
    });

    if (existingAdmin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if username/email already exists (excluding current admin)
    if (username || email) {
      const [duplicateCheck] = await sequelize.query(`
        SELECT id FROM users WHERE (username = :username OR email = :email) AND id != :id;
      `, {
        replacements: { username: username || '', email: email || '', id }
      });

      if (duplicateCheck.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
    }

    // Update admin
    const [result] = await sequelize.query(`
      UPDATE users 
      SET username = COALESCE(:username, username),
          email = COALESCE(:email, email),
          role = COALESCE(:role, role),
          status = COALESCE(:status, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :id
      RETURNING id, username, email, role, status, updated_at;
    `, {
      replacements: {
        id,
        username,
        email,
        role,
        status: isActive ? 'active' : 'inactive'
      }
    });

    console.log('✅ Admin updated successfully:', result[0]);

    res.json({
      message: 'Admin updated successfully',
      admin: {
        ...result[0],
        isActive: result[0].status === 'active',
        displayName: result[0].username
      }
    });
  } catch (error) {
    console.error('❌ Update admin error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = :id
      RETURNING id, username, email, "displayName", role, "isActive", "updatedAt";
    `, {
      replacements: {
        id,
        username,
        email,
        displayName,
        role,
        isActive
      }
    });

    res.json({
      message: 'Admin updated successfully',
      admin: result[0]
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete admin - using raw SQL
router.delete('/admin-users/:id', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { id } = req.params;

    console.log('🗑️ Deleting admin:', id);

    // Check if admin exists
    const [existingAdmin] = await sequelize.query(`
      SELECT id, username, role FROM users WHERE id = :id;
    `, {
      replacements: { id }
    });

    if (existingAdmin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if this is the last admin
    const [adminCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'active';
    `);

    if (adminCount[0].count <= 1 && existingAdmin[0].role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    // Delete admin
    await sequelize.query(`
      DELETE FROM users WHERE id = :id;
    `, {
      replacements: { id }
    });

    console.log('✅ Admin deleted successfully:', existingAdmin[0].username);

    res.json({
      message: 'Admin deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('❌ Delete admin error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Change admin password - using raw SQL
router.put('/admin-users/:id/password', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log('🔑 Changing password for admin:', id);

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Check if admin exists
    const [admin] = await sequelize.query(`
      SELECT id, password_hash FROM users WHERE id = :id;
    `, {
      replacements: { id }
    });

    if (admin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await sequelize.query(`
      UPDATE users 
      SET password_hash = :password, updated_at = CURRENT_TIMESTAMP
      WHERE id = :id;
    `, {
      replacements: { password: hashedPassword, id }
    });

    console.log('✅ Password updated successfully for admin:', id);

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('❌ Update password error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Health check for admin routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Admin API',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route for debugging
router.all('*', (req, res) => {
  console.log(`❓ Unknown admin route: ${req.method} ${req.path}`);
  console.log('📋 Available routes:');
  console.log('  GET /debug');
  console.log('  GET /admin-users');
  console.log('  POST /admin-users');
  console.log('  PUT /admin-users/:id');
  console.log('  DELETE /admin-users/:id');
  console.log('  PUT /admin-users/:id/password');
  console.log('  GET /health');
  
  res.status(404).json({ 
    error: 'Admin API endpoint not found',
    method: req.method,
    path: req.path,
    availableRoutes: [
      'GET /api/admin/debug',
      'GET /api/admin/admin-users',
      'POST /api/admin/admin-users',
      'PUT /api/admin/admin-users/:id',
      'DELETE /api/admin/admin-users/:id',
      'PUT /api/admin/admin-users/:id/password',
      'GET /api/admin/health'
    ]
  });
});

module.exports = router;