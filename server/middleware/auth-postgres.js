const jwt = require('jsonwebtoken');

// Permission levels for role hierarchy
const PERMISSION_LEVELS = {
  'admin': 5,
  'user': 3,
  'manager': 4,
  'agent': 3,
  'supervisor': 2,
  'viewer': 1
};

const auth = async (req, res, next) => {
  try {
    console.log(`🔐 Auth check for ${req.method} ${req.path}`);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    console.log('🔍 Token found, verifying...');
    const jwtSecret = process.env.JWT_SECRET || 'railway-jwt-secret-2024';
    const decoded = jwt.verify(token, jwtSecret);
    
    console.log(`👤 Decoded user ID: ${decoded.id}`);
    
    // Find user in users table using PostgreSQL pool
    const { pool } = require('../models/database');
    const result = await pool.query(`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE id = $1 AND status = 'active'
    `, [decoded.id]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }
    
    const user = result.rows[0];
    
    // Add permission level to user object
    user.permissionLevel = PERMISSION_LEVELS[user.role] || 0;
    
    req.user = user;
    console.log(`✅ Auth successful for user: ${user.username} (${user.role})`);
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Invalid JWT token');
      return res.status(401).json({ error: 'Token is not valid.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      console.log('❌ JWT token expired');
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    console.log('❌ Auth error:', error.message);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      console.log(`🛡️ Role check: Required ${roles}, User has ${req.user.role}`);
      
      if (!req.user) {
        console.log('❌ No user in request');
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const userRole = req.user.role;
      const hasRequiredRole = Array.isArray(roles) 
        ? roles.includes(userRole)
        : roles === userRole;

      if (!hasRequiredRole) {
        console.log(`❌ Insufficient permissions: User ${userRole} not in ${roles}`);
        return res.status(403).json({ 
          error: `Access denied. Required role: ${Array.isArray(roles) ? roles.join(' or ') : roles}` 
        });
      }

      console.log(`✅ Role check passed for ${userRole}`);
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ error: 'Internal server error during role check.' });
    }
  };
};

// Permission level check middleware
const requirePermission = (minLevel) => {
  return (req, res, next) => {
    try {
      const userLevel = req.user.permissionLevel || 0;
      
      if (userLevel < minLevel) {
        return res.status(403).json({ 
          error: `Insufficient permissions. Required level: ${minLevel}, User level: ${userLevel}` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ error: 'Internal server error during permission check.' });
    }
  };
};

module.exports = {
  auth,
  requireRole,
  requirePermission,
  PERMISSION_LEVELS
};