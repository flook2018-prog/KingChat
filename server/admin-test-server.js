const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Mock Database
const mockDB = require('./mockDatabase');

console.log('🚀 Starting KingChat Admin Test Server...');

// Admin Management API Endpoints
app.get('/api/admins', async (req, res) => {
  try {
    console.log('📊 Fetching admins from mock database...');
    const admins = await mockDB.getAdmins();
    res.json({ success: true, admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch admins' });
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log(`➕ Creating new admin: ${username} with role: ${role}`);

    // Check if username already exists
    if (await mockDB.usernameExists(username)) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await mockDB.createAdmin(username, hashedPassword, role);
    
    res.json({ success: true, admin, message: 'Admin created successfully' });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, error: 'Failed to create admin' });
  }
});

app.put('/api/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, status } = req.body;
    
    if (!username || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log(`✏️ Updating admin ID: ${id} with username: ${username}`);

    // Check if username exists for other users
    if (await mockDB.usernameExists(username, parseInt(id))) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    let hashedPassword = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const admin = await mockDB.updateAdmin(id, username, hashedPassword, role, status);
    
    res.json({ success: true, admin, message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error);
    if (error.message === 'Admin not found') {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to update admin' });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting admin ID: ${id}`);

    // Don't allow deleting the last admin
    const adminCount = await mockDB.getActiveAdminCount();
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the last admin' });
    }
    
    const result = await mockDB.deleteAdmin(id);
    
    res.json({ success: true, message: `Admin ${result.username} deleted successfully` });
  } catch (error) {
    console.error('Error deleting admin:', error);
    if (error.message === 'Admin not found') {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to delete admin' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'KingChat Admin Test Server is running' });
});

// Serve admin page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'admin-working.html'));
});

app.listen(PORT, () => {
  console.log(`✅ KingChat Admin Test Server running on http://localhost:${PORT}`);
  console.log(`🔗 Admin page: http://localhost:${PORT}/admin-working.html`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/admins`);
});

module.exports = app;