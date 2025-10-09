const jwt = require('jsonwebtoken');
const { User, Admin } = require('../models/postgresql');

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

    const jwtSecret = process.env.JWT_SECRET || 'railway-default-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Try to find user in appropriate collection based on userType
    let user;
    if (decoded.userType === 'admin') {
      user = await Admin.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
    } else {
      user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated.' });
    }

    // Add permission level to user object
    user.permissionLevel = PERMISSION_LEVELS[user.role] || 0;

    req.user = user;
    req.userType = decoded.userType || 'user';
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Token is not valid.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// New middleware for permission level checking
const requirePermissionLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userLevel = PERMISSION_LEVELS[req.user.role] || 0;
    if (userLevel < minLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permission level.',
        required: minLevel,
        current: userLevel
      });
    }

    next();
  };
};

// Check if user can manage target role
const canManageRole = (userRole, targetRole) => {
  const userLevel = PERMISSION_LEVELS[userRole] || 0;
  const targetLevel = PERMISSION_LEVELS[targetRole] || 0;
  return userLevel > targetLevel;
};

module.exports = { 
  auth, 
  requireRole, 
  requirePermissionLevel, 
  canManageRole,
  PERMISSION_LEVELS 
};