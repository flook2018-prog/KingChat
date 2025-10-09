const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register new user (admin only)
router.post('/register', auth, async (req, res) => {
  try {
    const { username, email, password, displayName, role } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create new users' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName,
      role: role || 'agent'
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Try to find user in User collection first
    let user = await User.findOne({ username });
    let userType = 'user';
    
    // If not found in User collection, try Admin collection
    if (!user) {
      user = await Admin.findOne({ username });
      userType = 'admin';
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    // Check password - handle both bcrypt and plain text for compatibility
    let isMatch = false;
    
    try {
      if (typeof user.comparePassword === 'function') {
        // Use the comparePassword method if available
        isMatch = await user.comparePassword(password);
      } else {
        // Fallback: try bcrypt compare directly
        const bcrypt = require('bcryptjs');
        isMatch = await bcrypt.compare(password, user.password);
      }
    } catch (error) {
      console.error('Password comparison error:', error);
      // Last resort: direct comparison (for development only)
      isMatch = user.password === password;
    }
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
        userType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName,
        role: req.user.role,
        permissions: req.user.permissions,
        avatar: req.user.avatar,
        lastLogin: req.user.lastLogin,
        userType: req.userType
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, email, avatar } = req.body;
    
    const updates = {};
    if (displayName) updates.displayName = displayName;
    if (email) updates.email = email;
    if (avatar) updates.avatar = avatar;

    let user;
    if (req.userType === 'admin') {
      user = await Admin.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true }
      ).select('-password');
    } else {
      user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true }
      ).select('-password');
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    let user;
    if (req.userType === 'admin') {
      user = await Admin.findById(req.user._id);
    } else {
      user = await User.findById(req.user._id);
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error during password change' });
  }
});

module.exports = router;