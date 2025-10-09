const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

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
      user = await Admin.findById(decoded.userId).select('-password');
    } else {
      user = await User.findById(decoded.userId).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated.' });
    }

    req.user = user;
    req.userType = decoded.userType || 'user';
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!req.user.permissions[permission]) {
      return res.status(403).json({ error: `Permission '${permission}' required.` });
    }

    next();
  };
};

module.exports = { auth, requireRole, requirePermission };