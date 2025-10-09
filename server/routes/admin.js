const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { User, Admin } = require('../models/postgresql');
const bcrypt = require('bcrypt');

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
  [PERMISSIONS.SUPER_ADMIN]: 5,
  [PERMISSIONS.ADMIN]: 4,
  [PERMISSIONS.MANAGER]: 3,
  [PERMISSIONS.AGENT]: 2,
  [PERMISSIONS.VIEWER]: 1
};

// Check if user can manage target role
function canManageRole(userRole, targetRole) {
  return PERMISSION_LEVELS[userRole] > PERMISSION_LEVELS[targetRole];
}

// Get all admins with pagination and search
router.get('/admins', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
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
router.post('/admins', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
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
router.put('/admins/:id', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
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
router.delete('/admins/:id', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
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
router.post('/admins/:id/reset-password', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
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
router.get('/admins/:id', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
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
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/users/:id', auth, async (req, res) => {
  try {
    // Users can view their own profile, admins can view any profile
    if (req.params.id !== req.user.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', auth, async (req, res) => {
  try {
    // Users can update their own profile, admins can update any profile
    if (req.params.id !== req.user.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { 
      displayName, 
      email, 
      phone, 
      bio, 
      department, 
      position,
      currentPassword, 
      newPassword,
      role, 
      isActive, 
      permissions 
    } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    // Update basic profile fields (all users can update these)
    if (displayName !== undefined) user.displayName = displayName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;

    // Update admin-only fields
    if (req.user.role === 'admin') {
      if (role !== undefined) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;
      if (permissions !== undefined) user.permissions = permissions;
    }

    const updatedUser = await user.save();
    const responseUser = updatedUser.toObject();
    delete responseUser.password;

    res.json({ message: 'User updated successfully', user: responseUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    if (req.params.id === req.user.userId.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin management endpoints (for client-side admin manager)
// Get admin users from PostgreSQL
router.get('/admin-users', async (req, res) => {
  try {
    console.log('📋 Loading admin users from PostgreSQL...');
    
    // Get all admins from database
    const admins = await Admin.findAll({
      attributes: { exclude: ['password'] }
    });
    
    console.log(`✅ Found ${admins.length} admins in database`);
    
    // Transform to frontend format
    const adminUsers = admins.map(admin => ({
      id: admin._id.toString(),
      username: admin.username,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      status: admin.status,
      lastLogin: admin.lastLogin,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    }));
    
    res.json({ 
      users: adminUsers, 
      timestamp: new Date().toISOString(),
      source: 'mongodb',
      count: adminUsers.length
    });
    
  } catch (error) {
    console.error('❌ Error loading admin users from MongoDB:', error);
    res.status(500).json({ error: 'Server error loading admin users' });
  }
});

// Save admin users to MongoDB
router.post('/admin-users', async (req, res) => {
  try {
    const { users, timestamp } = req.body;
    
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Users must be an array' });
    }
    
    console.log(`💾 Saving ${users.length} admin users to MongoDB...`);
    
    // Clear existing admins and insert new ones
    await Admin.deleteMany({});
    console.log('🧹 Cleared existing admin data');
    
    // Insert new admin data
    const adminDocs = users.map(user => ({
      username: user.username,
      displayName: user.displayName,
      password: user.password, // In production, hash this!
      email: user.email || `${user.username}@kingchat.com`,
      role: user.role,
      permissions: user.permissions || [],
      status: user.status || 'offline',
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
      isActive: user.isActive !== false,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    const savedAdmins = await Admin.insertMany(adminDocs);
    console.log(`✅ Successfully saved ${savedAdmins.length} admins to MongoDB`);
    
    res.json({ 
      message: 'Admin users saved successfully to MongoDB', 
      count: savedAdmins.length,
      timestamp: new Date().toISOString(),
      source: 'mongodb'
    });
    
  } catch (error) {
    console.error('❌ Error saving admin users to MongoDB:', error);
    res.status(500).json({ 
      error: 'Server error saving admin users',
      details: error.message 
    });
  }
});

// Create single admin user
router.post('/admin-users/create', async (req, res) => {
  try {
    const { username, displayName, password, role, permissions } = req.body;
    
    // Validate input
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    
    if (!displayName || displayName.trim().length < 1) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { username: username.trim() } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this username already exists' });
    }
    
    // Create new admin
    const newAdmin = await Admin.create({
      username: username.trim(),
      displayName: displayName.trim(),
      password: password, // Will be hashed by pre-save hook
      email: `${username.trim()}@kingchat.com`,
      role: role || 'user',
      permissions: permissions || [],
      status: 'offline',
      isActive: true
    });
    
    console.log(`✅ Created new admin: ${newAdmin.username}`);
    
    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.id.toString(),
        username: newAdmin.username,
        displayName: newAdmin.displayName,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        createdAt: newAdmin.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    
    // Handle validation errors more specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Admin with this username already exists' });
    }
    
    res.status(500).json({ error: 'Server error creating admin' });
  }
});

// Delete admin user
router.delete('/admin-users/:id', async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Find and delete admin
    const deletedAdmin = await Admin.findByPk(adminId);
    
    if (!deletedAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    await deletedAdmin.destroy();
    
    console.log(`✅ Deleted admin: ${deletedAdmin.username}`);
    
    res.json({
      message: 'Admin deleted successfully',
      deletedAdmin: {
        id: deletedAdmin._id.toString(),
        username: deletedAdmin.username,
        displayName: deletedAdmin.displayName
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    res.status(500).json({ error: 'Server error deleting admin' });
  }
});

module.exports = router;