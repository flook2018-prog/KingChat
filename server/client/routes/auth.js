const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { pool } = require('../models/database');
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('🔐 Login attempt for:', username);

    // Find user in users table
    const result = await pool.query(`
      SELECT id, username, email, password_hash, role, status
      FROM users 
      WHERE username = $1 OR email = $1
      LIMIT 1;
    `, [username]);

    if (result.rows.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ User account inactive:', username);
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      console.log('❌ Invalid password for:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for:', username);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'railway-jwt-secret-2024',
      { expiresIn: '7d' }
    );

    // Update last login
    await pool.query(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1;
    `, [user.id]);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    
    // Get fresh user data
    const [users] = await sequelize.query(`
      SELECT id, username, email, "displayName", role, "isActive"
      FROM admins 
      WHERE id = :id
      LIMIT 1;
    `, {
      replacements: { id: req.user.id }
    });

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user
    const [users] = await sequelize.query(`
      SELECT id, password FROM admins WHERE id = :id LIMIT 1;
    `, {
      replacements: { id: req.user.id }
    });

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await sequelize.query(`
      UPDATE admins 
      SET password = :password, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE id = :id;
    `, {
      replacements: { 
        password: hashedNewPassword, 
        id: req.user.id 
      }
    });

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    
    const [users] = await sequelize.query(`
      SELECT id, username, email, "displayName", role, "isActive", "createdAt"
      FROM admins 
      WHERE id = :id
      LIMIT 1;
    `, {
      replacements: { id: req.user.id }
    });

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { displayName, email } = req.body;

    // Check if email already exists (excluding current user)
    if (email) {
      const [existingUsers] = await sequelize.query(`
        SELECT id FROM admins WHERE email = :email AND id != :id LIMIT 1;
      `, {
        replacements: { email, id: req.user.id }
      });

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update profile
    const [result] = await sequelize.query(`
      UPDATE admins 
      SET email = COALESCE(:email, email),
          "displayName" = COALESCE(:displayName, "displayName"),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = :id
      RETURNING id, username, email, "displayName", role;
    `, {
      replacements: { 
        email,
        displayName,
        id: req.user.id 
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: result[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Auth API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;