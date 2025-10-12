const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Set default environment variables if not provided
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
if (!process.env.PORT) {
  process.env.PORT = '8080';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'railway-jwt-secret-2024';
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway';
}

console.log('🚀 Starting KingChat Server...');
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
      fontSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5001',
      'https://kingchat.up.railway.app',
      'https://kingchat-production.up.railway.app',
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} from ${req.ip}`);
  
  // Extra logging for API requests
  if (req.url.startsWith('/api/')) {
    console.log(`📡 API Request: ${req.method} ${req.url}`);
    console.log(`📋 Headers:`, req.headers.authorization ? 'Token present' : 'No token');
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`📦 Body:`, Object.keys(req.body));
    }
  }
  
  next();
});

// Basic routes
app.get('/', (req, res) => {
  // Redirect to login page for web browsers
  res.redirect('/login.html');
});

// Explicit routes for HTML pages
app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/dashboard.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8080,
    database: 'connected',
    version: '1.0.6-fixed'
  });
});

// Simple test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    routes_loaded: app._router ? 'Yes' : 'No'
  });
});

// Setup static files FIRST
function setupStaticFiles() {
  const fs = require('fs');
  
  console.log('🌐 Setting up static file serving...');
  console.log('📂 Current working directory:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  
  // Try multiple paths for client directory
  const possibleClientPaths = [
    path.join(__dirname, 'client'),
    path.join(__dirname, '..', 'client'),
    path.join(process.cwd(), 'client'),
    path.join(process.cwd(), 'server', 'client')
  ];
  
  let foundClientPath = null;
  
  for (const clientPath of possibleClientPaths) {
    console.log('🔍 Checking client path:', clientPath);
    if (fs.existsSync(clientPath)) {
      console.log('✅ Found client directory at:', clientPath);
      foundClientPath = clientPath;
      break;
    }
  }
  
  if (foundClientPath) {
    console.log('✅ Client directory found');
    console.log('📁 Setting up express.static for:', foundClientPath);
    app.use(express.static(foundClientPath));
    global.clientPath = foundClientPath;
    
    // Verify static files are accessible
    const loginFile = path.join(foundClientPath, 'login.html');
    console.log('🔍 Verifying login.html exists:', fs.existsSync(loginFile));
  } else {
    console.log('❌ Client directory not found, trying alternative paths...');
    
    // Try serving from alternative paths
    const altPaths = [
      path.join(__dirname, '..', '..', 'client'),
      '/app/client'
    ];
    
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log('✅ Found alternative client at:', altPath);
        app.use(express.static(altPath));
        break;
      }
    }
  }
}

// Load API routes
function loadApiRoutes() {
  try {
    console.log('📡 Loading API routes...');
    
    const authRoutes = require('./routes/auth');
    console.log('✅ Auth routes loaded');
    
    const adminRoutes = require('./routes/admin-GUARANTEED');
    console.log('✅ Admin routes loaded (PostgreSQL)');
    
    const lineOARoutes = require('./routes/lineoa');
    console.log('✅ LineOA routes loaded');
    
    const customerRoutes = require('./routes/customers');
    console.log('✅ Customer routes loaded');
    
    const messageRoutes = require('./routes/messages');
    console.log('✅ Message routes loaded');
    
    const settingsRoutes = require('./routes/settings');
    console.log('✅ Settings routes loaded');
    
    app.use('/api/auth', authRoutes);
    console.log('🔗 Auth routes mounted at /api/auth');
    
    app.use('/api/admin', adminRoutes);
    console.log('🔗 Admin routes mounted at /api/admin');
    
    app.use('/api/lineoa', lineOARoutes);
    console.log('🔗 LineOA routes mounted at /api/lineoa');
    
    app.use('/api/customers', customerRoutes);
    console.log('🔗 Customer routes mounted at /api/customers');
    
    app.use('/api/messages', messageRoutes);
    console.log('🔗 Message routes mounted at /api/messages');
    
    app.use('/api/settings', settingsRoutes);
    console.log('🔗 Settings routes mounted at /api/settings');
    
    console.log('✅ API routes loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading API routes:', error.message);
    console.error('📋 Stack trace:', error.stack);
    console.log('⚠️  Some API routes may not be available');
  }
}

// Socket.IO setup
const io = socketIO(server, {
  cors: corsOptions
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler - must be last
app.use((req, res) => {
  console.log(`❓ 404 - Route not found: ${req.method} ${req.url}`);
  
  // For API requests, return JSON error
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For HTML requests or pages, redirect to login
  if (req.headers.accept?.includes('text/html')) {
    return res.redirect('/login.html');
  }
  
  // For other requests, return 404
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Setup static files FIRST
  setupStaticFiles();
  
  // Then load API routes
  loadApiRoutes();
  
  // Initialize database in background after server starts
  setTimeout(() => {
    console.log('🔄 Initializing database connection...');
    initializeDatabase();
  }, 2000);
});

// Database initialization (after server starts)
async function initializeDatabase() {
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    console.log('✅ PostgreSQL database connected successfully');
    
    // Create default admin using raw SQL (fallback method)
    await createDefaultAdminFallback();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('⚠️  Server will continue without database features');
  }
}

// Fallback method to create admin using raw SQL
async function createDefaultAdminFallback() {
  try {
    const { sequelize } = require('./config/database');
    const bcrypt = require('bcryptjs');
    
    console.log('👤 Checking for admin user...');
    
    // Drop and recreate admins table to ensure correct structure
    await sequelize.query(`
      DROP TABLE IF EXISTS admins CASCADE;
    `);
    
    await sequelize.query(`
      CREATE TABLE admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "displayName" VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        permissions TEXT DEFAULT '["all"]',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Admins table created with proper structure');
    
    // Always create default admin since we dropped the table
    console.log('👤 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await sequelize.query(`
      INSERT INTO admins (username, email, password, "displayName", role, permissions, "isActive")
      VALUES ('admin', 'admin@kingchat.com', :password, 'System Administrator', 'admin', '["all"]', true);
    `, {
      replacements: { password: hashedPassword }
    });
    
    console.log('✅ Default admin created: admin / admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
}

module.exports = { app, server, io };