const express = require('express');
const { auth, requirePermission, requireLevel, ROLE_PERMISSIONS } = require('../middleware/auth');
const router = express.Router();

// Get current user's role and permissions
router.get('/me', auth, (req, res) => {
  try {
    const user = req.user;
    const roleData = ROLE_PERMISSIONS[user.role];
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: roleData?.permissions || [],
        level: roleData?.level || 0
      }
    });
  } catch (error) {
    console.error('Get user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all roles and their permissions (super_admin only)
router.get('/all', auth, requireLevel(100), (req, res) => {
  try {
    res.json({
      success: true,
      roles: ROLE_PERMISSIONS
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user has specific permission
router.post('/check-permission', auth, (req, res) => {
  try {
    const { permission } = req.body;
    const user = req.user;
    const roleData = ROLE_PERMISSIONS[user.role];
    
    const hasPermission = roleData?.permissions.includes(permission) || false;
    
    res.json({
      success: true,
      hasPermission,
      userRole: user.role,
      permission
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions for quick messages (admin+ required)
router.get('/quick-messages-permissions', auth, requirePermission('manage_quick_messages'), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Access granted to quick messages management',
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Quick messages permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions for customer management (admin+ required)
router.get('/customers-permissions', auth, requirePermission('manage_customers'), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Access granted to customer management',
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Customer permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions for LINE OA management (admin+ required)
router.get('/lineoa-permissions', auth, requirePermission('manage_lineoa'), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Access granted to LINE OA management',
      userRole: req.user.role
    });
  } catch (error) {
    console.error('LINE OA permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions for chat management (admin+ required)
router.get('/chat-permissions', auth, requirePermission('manage_chat'), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Access granted to chat management',
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Chat permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get permissions for system management (super_admin only)
router.get('/system-permissions', auth, requireLevel(100), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Access granted to system management',
      userRole: req.user.role
    });
  } catch (error) {
    console.error('System permission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;