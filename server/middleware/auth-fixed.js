const jwt = require('jsonwebtoken');

// Permission levels for role hierarchy
const PERMISSION_LEVELS = {
  'admin': 5,
  'manager': 4,
  'agent': 3,
  'supervisor': 2,
  'viewer': 1
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'railway-jwt-secret-2024';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Find user in admins table using raw SQL
    const { sequelize } = require('../config/database');
    const [users] = await sequelize.query(`
      SELECT id, username, email, "displayName", role, "isActive"
      FROM admins 
      WHERE id = :id
      LIMIT 1;
    `, {
      replacements: { id: decoded.id }
    });
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Token is not valid.' });
    }

    const user = users[0];

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated.' });
    }

    // Add permission level to user object
    user.permissionLevel = PERMISSION_LEVELS[user.role] || 0;

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token is not valid.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    
    res.status(500).json({ error: 'Server error in authentication.' });
  }
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

// Permission level based access control
const requirePermissionLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userLevel = PERMISSION_LEVELS[req.user.role] || 0;
    if (userLevel < minLevel) {
      return res.status(403).json({ error: 'Insufficient permission level.' });
    }

    next();
  };
};

// Check if user can manage target user
const canManageUser = (req, res, next) => {
  const targetUserId = req.params.id || req.body.userId;
  const currentUserLevel = PERMISSION_LEVELS[req.user.role] || 0;
  
  // Admin can manage anyone, users can only manage themselves
  if (req.user.role === 'admin' || req.user.id === parseInt(targetUserId)) {
    return next();
  }
  
  return res.status(403).json({ error: 'Cannot manage this user.' });
};

module.exports = {
  auth,
  requireRole,
  requirePermissionLevel,
  canManageUser,
  PERMISSION_LEVELS
};