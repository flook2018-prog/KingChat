const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

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
      searchCondition = `WHERE username ILIKE :search OR email ILIKE :search OR "displayName" ILIKE :search`;
      replacements.search = `%${search}%`;
    }
    
    // Get admins with pagination
    const [admins] = await sequelize.query(`
      SELECT id, username, email, "displayName", role, "isActive", "createdAt"
      FROM admins
      ${searchCondition}
      ORDER BY "createdAt" DESC
      LIMIT :limit OFFSET :offset;
    `, {
      replacements
    });
    
    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as count FROM admins ${searchCondition};
    `, {
      replacements: search ? { search: `%${search}%` } : {}
    });
    
    const total = parseInt(countResult[0].count);
    
    console.log(`📊 Found ${total} admins, returning ${admins.length} for page ${page}`);
    
    res.json({
      admins,
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
    const { username, email, password, displayName, role = 'admin' } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const [existingUser] = await sequelize.query(`
      SELECT id FROM admins WHERE username = :username OR email = :email;
    `, {
      replacements: { username, email }
    });

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const [result] = await sequelize.query(`
      INSERT INTO admins (username, email, password, "displayName", role, permissions, "isActive")
      VALUES (:username, :email, :password, :displayName, :role, '["all"]', true)
      RETURNING id, username, email, "displayName", role, "isActive", "createdAt";
    `, {
      replacements: {
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
        role
      }
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: result[0]
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin - using raw SQL
router.put('/admin-users/:id', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { id } = req.params;
    const { username, email, displayName, role, isActive } = req.body;

    // Check if admin exists
    const [existingAdmin] = await sequelize.query(`
      SELECT id FROM admins WHERE id = :id;
    `, {
      replacements: { id }
    });

    if (existingAdmin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if username/email already exists (excluding current admin)
    if (username || email) {
      const [duplicateCheck] = await sequelize.query(`
        SELECT id FROM admins WHERE (username = :username OR email = :email) AND id != :id;
      `, {
        replacements: { username, email, id }
      });

      if (duplicateCheck.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
    }

    // Update admin
    const [result] = await sequelize.query(`
      UPDATE admins 
      SET username = COALESCE(:username, username),
          email = COALESCE(:email, email),
          "displayName" = COALESCE(:displayName, "displayName"),
          role = COALESCE(:role, role),
          "isActive" = COALESCE(:isActive, "isActive"),
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

    // Check if admin exists
    const [existingAdmin] = await sequelize.query(`
      SELECT id, username, role FROM admins WHERE id = :id;
    `, {
      replacements: { id }
    });

    if (existingAdmin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check if this is the last admin
    const [adminCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM admins WHERE role = 'admin' AND "isActive" = true;
    `);

    if (adminCount[0].count <= 1 && existingAdmin[0].role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    // Delete admin
    await sequelize.query(`
      DELETE FROM admins WHERE id = :id;
    `, {
      replacements: { id }
    });

    res.json({
      message: 'Admin deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change admin password - using raw SQL
router.put('/admin-users/:id/password', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { id } = req.params;
    const { newPassword, currentPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Check if admin exists
    const [admin] = await sequelize.query(`
      SELECT id, password FROM admins WHERE id = :id;
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
      UPDATE admins 
      SET password = :password, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = :id;
    `, {
      replacements: { password: hashedPassword, id }
    });

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error' });
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

module.exports = router;