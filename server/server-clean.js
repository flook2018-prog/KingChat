const express = require('express');
const path = require('path');
const cors = require('cors');
const { initializeDatabase } = require('./setupDatabase');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting KingChat Server...');
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', PORT);
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Set global client path for file serving
global.clientPath = path.join(__dirname, 'client');
console.log('🌐 Setting up early static files for:', global.clientPath);

// CORS Configuration for Railway
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS Origin check:', origin);
    
    // Allow requests with no origin (mobile apps, desktop apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS: Same-origin request allowed');
      return callback(null, true);
    }
    
    // Allow Railway domains and localhost
    const allowedOrigins = [
      /^https:\/\/.*\.railway\.app$/,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' wss: ws:; " +
    "frame-src 'self';"
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log('🌐', req.method, req.path, 'from', req.ip);
  next();
});

// Root redirect
app.get('/', (req, res) => {
  console.log('🏠 Root accessed, redirecting to login');
  res.redirect('/login.html');
});

// Static file serving with specific routes
app.get('/login.html', (req, res) => {
  const loginPath = path.join(global.clientPath, 'login.html');
  res.sendFile(loginPath);
});

app.get('/admin-working.html', (req, res) => {
  const adminPath = path.join(global.clientPath, 'admin-working.html');
  res.sendFile(adminPath);
});

// Load API routes synchronously
console.log('🎯 Loading API routes synchronously...');

// Health routes first
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);
console.log('✅ Health routes loaded');

// Auth routes 
console.log('✅ Using bcrypt package');
console.log('🔧 Loading auth-simple.js routes...');
const authRoutes = require('./routes/auth-simple');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes loaded and mounted at /api/auth');

// Mock Admin endpoints - bypassing PostgreSQL for now
console.log('🔧 Setting up mock admin endpoints...');

const bcrypt = require('bcrypt');
let mockAdmins = [
  {
    id: 1,
    username: 'admin',
    role: 'super-admin',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: 2,
    username: 'manager',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: null
  }
];

// GET /api/admin - Get all admins
app.get('/api/admin', (req, res) => {
  console.log('📁 Fetching admins from mock data');
  res.json({ success: true, admins: mockAdmins });
});

// GET /api/admin/:id - Get specific admin
app.get('/api/admin/:id', (req, res) => {
  const adminId = parseInt(req.params.id);
  const admin = mockAdmins.find(a => a.id === adminId);
  
  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin not found' });
  }
  
  res.json({ success: true, admin });
});

// POST /api/admin - Create new admin
app.post('/api/admin', async (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    // Check if username exists
    if (mockAdmins.find(a => a.username === username)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    const newAdmin = {
      id: Date.now(),
      username,
      role,
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: null
    };
    
    mockAdmins.push(newAdmin);
    
    res.status(201).json({ 
      success: true, 
      admin: newAdmin,
      message: 'Admin created successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create admin',
      details: error.message 
    });
  }
});

// PUT /api/admin/:id - Update admin
app.put('/api/admin/:id', (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { username, role, status } = req.body;
    
    const adminIndex = mockAdmins.findIndex(a => a.id === adminId);
    
    if (adminIndex === -1) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    
    // Check username uniqueness
    if (username && mockAdmins.find(a => a.username === username && a.id !== adminId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    // Update admin
    if (username) mockAdmins[adminIndex].username = username;
    if (role) mockAdmins[adminIndex].role = role;
    if (status) mockAdmins[adminIndex].status = status;
    
    res.json({ 
      success: true, 
      admin: mockAdmins[adminIndex],
      message: 'Admin updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update admin',
      details: error.message 
    });
  }
});

// DELETE /api/admin/:id - Delete admin
app.delete('/api/admin/:id', (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const adminIndex = mockAdmins.findIndex(a => a.id === adminId);
    
    if (adminIndex === -1) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    
    // Prevent deleting last admin
    if (mockAdmins.length <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete the last admin' 
      });
    }
    
    mockAdmins.splice(adminIndex, 1);
    
    res.json({ 
      success: true, 
      message: 'Admin deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete admin',
      details: error.message 
    });
  }
});

console.log('✅ Mock admin endpoints loaded');

// Mock LINE OA endpoints
console.log('🔧 Setting up mock LINE OA endpoints...');

let mockLineOAAccounts = [
  {
    id: 1,
    name: 'KingChat Demo',
    channelId: '@kingchat_demo',
    channelSecret: 'demo_secret',
    accessToken: 'demo_access_token',
    webhookUrl: 'https://kingchat.up.railway.app/api/webhook',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Test LINE OA',
    channelId: '@test_lineoa',
    channelSecret: 'test_secret',
    accessToken: 'test_access_token',
    webhookUrl: 'https://kingchat.up.railway.app/api/webhook',
    status: 'inactive',
    created_at: new Date().toISOString()
  }
];

// GET /api/lineoa/accounts - Get all LINE OA accounts
app.get('/api/lineoa/accounts', (req, res) => {
  console.log('📁 Fetching LINE OA accounts from mock data');
  res.json({
    success: true,
    accounts: mockLineOAAccounts
  });
});

// GET /api/lineoa/:id - Get specific LINE OA account
app.get('/api/lineoa/:id', (req, res) => {
  const accountId = parseInt(req.params.id);
  const account = mockLineOAAccounts.find(a => a.id === accountId);
  
  if (!account) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }
  
  res.json({ success: true, account });
});

// POST /api/lineoa/accounts - Create new LINE OA account
app.post('/api/lineoa/accounts', (req, res) => {
  try {
    const { name, channelId, channelSecret, accessToken, webhookUrl } = req.body;
    
    if (!name || !channelId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and Channel ID are required' 
      });
    }
    
    // Check if channelId already exists
    if (mockLineOAAccounts.find(a => a.channelId === channelId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Channel ID already exists' 
      });
    }
    
    const newAccount = {
      id: Date.now(),
      name,
      channelId,
      channelSecret: channelSecret || '',
      accessToken: accessToken || '',
      webhookUrl: webhookUrl || 'https://kingchat.up.railway.app/api/webhook',
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    mockLineOAAccounts.push(newAccount);
    
    res.status(201).json({ 
      success: true, 
      account: newAccount,
      message: 'LINE OA account created successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create LINE OA account',
      details: error.message 
    });
  }
});

// PUT /api/lineoa/accounts/:id - Update LINE OA account
app.put('/api/lineoa/accounts/:id', (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const { name, channelId, channelSecret, accessToken, webhookUrl, status } = req.body;
    
    const accountIndex = mockLineOAAccounts.findIndex(a => a.id === accountId);
    
    if (accountIndex === -1) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    // Check channelId uniqueness
    if (channelId && mockLineOAAccounts.find(a => a.channelId === channelId && a.id !== accountId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Channel ID already exists' 
      });
    }
    
    // Update account
    if (name) mockLineOAAccounts[accountIndex].name = name;
    if (channelId) mockLineOAAccounts[accountIndex].channelId = channelId;
    if (channelSecret) mockLineOAAccounts[accountIndex].channelSecret = channelSecret;
    if (accessToken) mockLineOAAccounts[accountIndex].accessToken = accessToken;
    if (webhookUrl) mockLineOAAccounts[accountIndex].webhookUrl = webhookUrl;
    if (status) mockLineOAAccounts[accountIndex].status = status;
    
    res.json({ 
      success: true, 
      account: mockLineOAAccounts[accountIndex],
      message: 'LINE OA account updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update LINE OA account',
      details: error.message 
    });
  }
});

// DELETE /api/lineoa/accounts/:id - Delete LINE OA account
app.delete('/api/lineoa/accounts/:id', (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const accountIndex = mockLineOAAccounts.findIndex(a => a.id === accountId);
    
    if (accountIndex === -1) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    mockLineOAAccounts.splice(accountIndex, 1);
    
    res.json({ 
      success: true, 
      message: 'LINE OA account deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete LINE OA account',
      details: error.message 
    });
  }
});

console.log('✅ Mock LINE OA endpoints loaded');

// Other API routes (skip PostgreSQL dependent ones)
try {
  const customerRoutes = require('./routes/customers');
  app.use('/api/customers', customerRoutes);
  console.log('✅ Customer routes loaded');
} catch (error) {
  console.log('⚠️ Customer routes failed to load:', error.message);
}

try {
  const messageRoutes = require('./routes/messages');
  app.use('/api/messages', messageRoutes);
  console.log('✅ Message routes loaded');
} catch (error) {
  console.log('⚠️ Message routes failed to load:', error.message);
}

try {
  const settingsRoutes = require('./routes/settings');
  app.use('/api/settings', settingsRoutes);
  console.log('✅ Settings routes loaded');
} catch (error) {
  console.log('⚠️ Settings routes failed to load:', error.message);
}

console.log('✅ API routes loaded successfully');

// Static file serving
console.log('🌐 Setting up static file serving...');
console.log('📂 Current working directory:', process.cwd());
console.log('📁 __dirname:', __dirname);
console.log('🔍 Checking client path:', global.clientPath);

const fs = require('fs');
if (fs.existsSync(global.clientPath)) {
  console.log('✅ Found client directory at:', global.clientPath);
  console.log('✅ Client directory found');
  console.log('📁 Setting up express.static for:', global.clientPath);
  
  app.use(express.static(global.clientPath, {
    maxAge: '1d',
    etag: false
  }));
  
  // Check if login.html exists
  const loginPath = path.join(global.clientPath, 'login.html');
  console.log('🔍 Verifying login.html exists:', fs.existsSync(loginPath));
} else {
  console.log('❌ Client directory not found at:', global.clientPath);
}

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database in background
  console.log('🔄 Initializing database connection...');
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (dbError) {
    console.log('⚠️ Database init background error:', dbError.message);
  }
});

module.exports = app;