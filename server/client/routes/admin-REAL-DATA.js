const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// File to store persistent data
const DATA_FILE = path.join(__dirname, '../data/admin-users.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users data with real activity tracking
let ADMIN_USERS = [];

// Load data from file or initialize with default users
function loadUsersData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      ADMIN_USERS = JSON.parse(data);
      console.log(`📂 Loaded ${ADMIN_USERS.length} admin users from file`);
    } else {
      // Initialize with default users
      ADMIN_USERS = [
        { 
          id: 1, 
          username: 'SSSs', 
          email: 'SSSs@kingchat.com', 
          role: 'super_admin', 
          status: 'active', 
          password_hash: '$2b$10$abcdefghijklmnopqrstuv',
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          login_count: 15,
          last_login: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
        },
        { 
          id: 2, 
          username: 'Xinon', 
          email: 'Xinon@kingchat.com', 
          role: 'super_admin', 
          status: 'active', 
          password_hash: '$2b$10$abcdefghijklmnopqrstuv',
          created_at: new Date().toISOString(),
          last_activity: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
          login_count: 8,
          last_login: new Date(Date.now() - 1000 * 60 * 10).toISOString()
        },
        { 
          id: 4, 
          username: 'System Administrator', 
          email: 'admin@kingchat.com', 
          role: 'super_admin', 
          status: 'active', 
          password_hash: '$2b$10$abcdefghijklmnopqrstuv',
          created_at: new Date().toISOString(),
          last_activity: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          login_count: 23,
          last_login: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        { 
          id: 5, 
          username: 'aaa', 
          email: 'aaa@kingchat.com', 
          role: 'admin', 
          status: 'active', 
          password_hash: '$2b$10$abcdefghijklmnopqrstuv',
          created_at: new Date().toISOString(),
          last_activity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          login_count: 5,
          last_login: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ];
      saveUsersData();
      console.log(`🔧 Initialized ${ADMIN_USERS.length} default admin users`);
    }
  } catch (error) {
    console.error('❌ Error loading users data:', error);
    ADMIN_USERS = [];
  }
}

// Save data to file
function saveUsersData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(ADMIN_USERS, null, 2));
    console.log(`💾 Saved ${ADMIN_USERS.length} admin users to file`);
  } catch (error) {
    console.error('❌ Error saving users data:', error);
  }
}

// Update user activity
function updateUserActivity(userId) {
  const user = ADMIN_USERS.find(u => u.id == userId);
  if (user) {
    user.last_activity = new Date().toISOString();
    user.login_count = (user.login_count || 0) + 1;
    saveUsersData();
    console.log(`📈 Updated activity for user: ${user.username}`);
  }
}

// Check if user is online (active within last 5 minutes)
function isUserOnline(lastActivity) {
  if (!lastActivity) return false;
  const now = new Date();
  const activityTime = new Date(lastActivity);
  const diffMinutes = (now - activityTime) / (1000 * 60);
  return diffMinutes < 5;
}

// Load initial data
loadUsersData();

// 🔧 ROUTES WITH REAL DATA 🔧

// 1. Debug route
router.get('/debug', (req, res) => {
  console.log('✅ /api/admin/debug called');
  res.json({
    message: 'Admin API is WORKING with REAL DATA!',
    timestamp: new Date().toISOString(),
    availableRoutes: {
      'GET /debug': 'Working ✅',
      'POST /update-activity': 'Working ✅', 
      'GET /admin-users': 'Working ✅', 
      'GET /admin-users/:id/details': 'Working ✅',
      'PUT /admin-users/:id/password': 'Working ✅',
      'DELETE /admin-users/:id': 'Working ✅',
      'GET /debug/users': 'Working ✅',
      'GET /health': 'Working ✅'
    },
    realUsersCount: ADMIN_USERS.length,
    dataFile: DATA_FILE
  });
});

// 2. Update activity - REAL
router.post('/update-activity', (req, res) => {
  console.log('✅ /api/admin/update-activity called');
  
  // Get user from token or default
  const userId = req.user?.id || 1;
  updateUserActivity(userId);
  
  res.json({
    success: true,
    message: 'Activity updated successfully',
    timestamp: new Date().toISOString(),
    userId: userId
  });
});

// 3. Get admin users - REAL DATA
router.get('/admin-users', (req, res) => {
  console.log('✅ /api/admin/admin-users called');
  
  const adminsWithStatus = ADMIN_USERS.map(user => ({
    ...user,
    online_status: isUserOnline(user.last_activity) ? 'online' : 'offline'
  }));

  res.json({
    success: true,
    data: adminsWithStatus,
    count: adminsWithStatus.length,
    message: 'Admin users fetched successfully (REAL DATA)'
  });
});

// 4. Get admin details - REAL
router.get('/admin-users/:id/details', (req, res) => {
  const { id } = req.params;
  console.log(`✅ /api/admin/admin-users/${id}/details called`);
  
  const user = ADMIN_USERS.find(u => u.id == id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    admin: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      last_login: user.last_login,
      last_activity: user.last_activity,
      created_at: user.created_at,
      login_count: user.login_count,
      password_hash: user.password_hash,
      online_status: isUserOnline(user.last_activity) ? 'online' : 'offline'
    }
  });
});

// 5. Update password - REAL
router.put('/admin-users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  console.log(`✅ /api/admin/admin-users/${id}/password called`);
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  const user = ADMIN_USERS.find(u => u.id == id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password_hash = hashedPassword;
    saveUsersData();
    
    console.log(`✅ Password updated for user: ${user.username}`);
    
    res.json({
      success: true,
      message: `Password updated successfully for ${user.username}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// 6. DELETE admin user - REAL DELETE
router.delete('/admin-users/:id', (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /api/admin/admin-users/${id} called`);
  
  try {
    // Find the user to delete
    const userIndex = ADMIN_USERS.findIndex(user => user.id.toString() === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'ไม่พบผู้ใช้ที่ต้องการลบ'
      });
    }

    const userToDelete = ADMIN_USERS[userIndex];

    // Check if trying to delete themselves
    const currentUser = req.user || {};
    if (currentUser.id && currentUser.id.toString() === id) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account',
        message: 'ไม่สามารถลบบัญชีของตนเองได้'
      });
    }

    // Check if this is the last super admin
    const superAdminCount = ADMIN_USERS.filter(user => user.role === 'super_admin').length;
    if (userToDelete.role === 'super_admin' && superAdminCount <= 1) {
      return res.status(400).json({ 
        error: 'Cannot delete the last Super Admin',
        message: 'ไม่สามารถลบ Super Admin คนสุดท้ายได้'
      });
    }

    // Remove user from array
    const deletedUser = ADMIN_USERS.splice(userIndex, 1)[0];
    
    // Save to file
    saveUsersData();
    
    console.log(`✅ REALLY DELETED user: ${deletedUser.username} (ID: ${id})`);
    console.log(`📊 Users count: ${ADMIN_USERS.length + 1} → ${ADMIN_USERS.length}`);
    
    res.json({
      success: true,
      message: `ลบแอดมิน "${deletedUser.username}" สำเร็จ (ลบจริง)`,
      deletedUser: {
        id: deletedUser.id,
        username: deletedUser.username,
        email: deletedUser.email,
        role: deletedUser.role
      },
      remainingUsers: ADMIN_USERS.length
    });
    
  } catch (error) {
    console.error('❌ Delete admin error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้'
    });
  }
});

// 7. Debug users - REAL
router.get('/debug/users', (req, res) => {
  console.log('✅ /api/admin/debug/users called');
  res.json({
    success: true,
    users: ADMIN_USERS,
    count: ADMIN_USERS.length,
    message: 'Debug: All REAL users data',
    timestamp: new Date().toISOString(),
    dataFile: DATA_FILE
  });
});

// 8. Health check
router.get('/health', (req, res) => {
  console.log('✅ /api/admin/health called');
  res.json({
    status: 'healthy',
    service: 'Admin API with REAL DATA',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    usersLoaded: ADMIN_USERS.length,
    dataFile: DATA_FILE,
    realData: true
  });
});

console.log('🚀 Admin routes loaded with REAL DATA PERSISTENCE!');
console.log('📋 Available routes:');
console.log('   GET  /api/admin/debug');
console.log('   POST /api/admin/update-activity');
console.log('   GET  /api/admin/admin-users');
console.log('   GET  /api/admin/admin-users/:id/details');
console.log('   PUT  /api/admin/admin-users/:id/password');
console.log('   DELETE /api/admin/admin-users/:id');
console.log('   GET  /api/admin/debug/users');
console.log('   GET  /api/admin/health');
console.log(`💾 Data persistence: ${DATA_FILE}`);

module.exports = router;