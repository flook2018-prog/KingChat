const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

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

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: '👑 KingChat API Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001,
    database: 'initializing'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Serving static files from client directory');
  
  // Debug: Log current directory and check if client exists
  console.log('📂 Current working directory:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  
  const clientPath = path.join(__dirname, 'client');
  console.log('🗂️  Client path:', clientPath);
  
  // Check if client directory exists
  const fs = require('fs');
  if (fs.existsSync(clientPath)) {
    console.log('✅ Client directory found');
    app.use(express.static(clientPath));
  } else {
    console.log('❌ Client directory not found, trying alternative paths...');
    const altPaths = [
      path.join(process.cwd(), 'client'),
      path.join(__dirname, '..', 'client'),
      '/app/client'
    ];
    
    for (const altPath of altPaths) {
      console.log(`🔍 Checking: ${altPath}`);
      if (fs.existsSync(altPath)) {
        console.log(`✅ Found client at: ${altPath}`);
        app.use(express.static(altPath));
        global.clientPath = altPath;
        break;
      }
    }
  }
  
  app.get('/login', (req, res) => {
    const filePath = global.clientPath ? 
      path.join(global.clientPath, 'login.html') : 
      path.join(clientPath, 'login.html');
    
    console.log('📁 Trying to serve login.html from:', filePath);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error('❌ login.html not found at:', filePath);
      res.status(404).json({ error: 'Login page not found' });
    }
  });
  
  app.get('/dashboard', (req, res) => {
    const filePath = global.clientPath ? 
      path.join(global.clientPath, 'dashboard.html') : 
      path.join(clientPath, 'dashboard.html');
    
    console.log('📁 Trying to serve dashboard.html from:', filePath);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error('❌ dashboard.html not found at:', filePath);
      res.status(404).json({ error: 'Dashboard page not found' });
    }
  });
}

// Socket.IO setup
const io = socketIO(server, {
  cors: corsOptions
});

// Start server
const PORT = process.env.PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database in background after server starts
  setTimeout(() => {
    console.log('🔄 Initializing database connection...');
    initializeDatabase();
  }, 1000);
});

// Database initialization (after server starts)
async function initializeDatabase() {
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    console.log('✅ PostgreSQL database connected successfully');
    
    // Initialize database tables
    const { Admin, User, Customer, Message, Settings, LineOA } = require('./models/postgresql');
    console.log('📝 Synchronizing database tables...');
    
    await Admin.sync({ alter: process.env.NODE_ENV === 'development' });
    await User.sync({ alter: process.env.NODE_ENV === 'development' });
    await LineOA.sync({ alter: process.env.NODE_ENV === 'development' });
    await Customer.sync({ alter: process.env.NODE_ENV === 'development' });
    await Message.sync({ alter: process.env.NODE_ENV === 'development' });
    await Settings.sync({ alter: process.env.NODE_ENV === 'development' });
    
    console.log('✅ Database tables synchronized');
    
    // Now load the API routes
    loadApiRoutes();
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.log('⚠️  Server will continue without database features');
    
    // Retry after 30 seconds
    setTimeout(initializeDatabase, 30000);
  }
}

// Load API routes after database is ready
function loadApiRoutes() {
  try {
    console.log('📡 Loading API routes...');
    
    const authRoutes = require('./routes/auth');
    const adminRoutes = require('./routes/admin');
    const lineOARoutes = require('./routes/lineoa');
    const customerRoutes = require('./routes/customers');
    const messageRoutes = require('./routes/messages');
    const settingsRoutes = require('./routes/settings');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/lineoa', lineOARoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/settings', settingsRoutes);
    
    console.log('✅ API routes loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading API routes:', error.message);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = { app, server, io };