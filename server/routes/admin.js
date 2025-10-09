const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { User, Admin } = require('../models/postgresql');
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

// Get all admins with pagination and search
router.get('/admins', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { username: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { displayName: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) {
      whereClause.role = role;
    }

    const { count, rows: admins } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      admins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new admin
router.post('/admins', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, displayName, role = 'agent', permissions = [] } = req.body;

    // Check if current user can create this role
    if (!canManageRole(req.user.role, role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create this role' });
    }

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by model hook
      displayName: displayName || username,
      role,
      permissions: JSON.stringify(permissions),
      isActive: true,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin
router.put('/admins/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, role, permissions, isActive } = req.body;

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check permissions for role changes
    if (role && role !== targetUser.role) {
      if (!canManageRole(req.user.role, targetUser.role) || !canManageRole(req.user.role, role)) {
        return res.status(403).json({ error: 'Insufficient permissions to change this role' });
      }
    }

    // Prevent self-deactivation for super admins
    if (req.user.id === parseInt(id) && req.user.role === 'super_admin' && isActive === false) {
      return res.status(400).json({ error: 'Super admin cannot deactivate themselves' });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedBy = req.user.id;

    await targetUser.update(updateData);

    res.json({
      message: 'Admin updated successfully',
      admin: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        displayName: targetUser.displayName,
        role: targetUser.role,
        permissions: permissions || JSON.parse(targetUser.permissions || '[]'),
        isActive: targetUser.isActive,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete admin
router.delete('/admins/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check permissions
    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to delete this admin' });
    }

    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deletion of last super admin
    if (targetUser.role === 'super_admin') {
      const superAdminCount = await User.count({ where: { role: 'super_admin', isActive: true } });
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last super admin' });
      }
    }

    await targetUser.destroy();

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/admins/:id/reset-password', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Check permissions
    if (!canManageRole(req.user.role, targetUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to reset password for this admin' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await targetUser.update({ 
      password: hashedPassword,
      updatedBy: req.user.id 
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get admin details
router.get('/admins/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      ...admin.toJSON(),
      permissions: JSON.parse(admin.permissions || '[]')
    });
  } catch (error) {
    console.error('Get admin details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;