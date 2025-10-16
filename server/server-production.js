const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

console.log('🎯 PRODUCTION MODE: Using PostgreSQL Database Connection');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database models (PRODUCTION POSTGRESQL WITH FALLBACK)
const { getPool, isDatabaseConnected, executeQuery, initializeDatabase, getStatus } = require('./models/database-production-fallback');

// Debug environment variables
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('   RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT ? 'SET' : 'NOT SET');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware - More permissive CSP for Railway
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "data:", "blob:"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:", "*"],
      fontSrc: ["'self'", "data:", "https:", "*"],
      mediaSrc: ["'self'", "data:", "blob:", "*"],
      frameSrc: ["'self'", "*"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
    reportOnly: false
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 for dev, 100 for prod
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/' || req.path === '/health';
  }
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5001',
      'https://kingchat.up.railway.app',
      'https://kingchat-production.up.railway.app', // Railway preview deployments
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

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Production database connection
const connectDatabase = async () => {
  console.log('🔌 Connecting to Railway PostgreSQL database...');
  console.log('📍 Database: postgresql://postgres:***@postgres-kbtt.railway.internal:5432/railway');
  
  try {
    await initializeDatabase();
    console.log('✅ Production PostgreSQL database ready for use');
  } catch (error) {
    console.error('❌ CRITICAL: Production database connection failed:', error.message);
    console.error('   Please check Railway PostgreSQL database status');
  }
};

// Start database connection (non-blocking)
connectDatabase();

// Import routes with production database connection
let authRoutes, adminAuthRoutes, adminRoutes, lineAccountRoutes, rolesRoutes;

console.log('🎯 Loading PRODUCTION database routes...');

// Load auth routes with production database connection
try {
  authRoutes = require('./routes/auth-production');
  console.log('✅ Auth routes loaded from auth-production.js (POSTGRESQL DATABASE)');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load auth-production routes:', error.message);
  process.exit(1); // Exit if production routes fail
}

// Load admin authentication routes
try {
  adminAuthRoutes = require('./routes/admin-auth');
  console.log('✅ Admin auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load admin auth routes:', error.message);
  adminAuthRoutes = require('express').Router();
  adminAuthRoutes.all('*', (req, res) => {
    res.status(503).json({ error: 'Admin auth not available' });
  });
}

// Load admin routes with production database connection
try {
  adminRoutes = require('./routes/admin-production');
  console.log('✅ Admin routes loaded from admin-production.js (POSTGRESQL DATABASE)');
} catch (error) {
  console.error('❌ CRITICAL: Failed to load admin-production routes:', error.message);
  process.exit(1); // Exit if production routes fail
}

try {
  lineAccountRoutes = require('./routes/lineAccounts');
  rolesRoutes = require('./routes/roles');
  console.log('✅ Additional routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading additional routes:', error.message);
  console.log('⚠️  Server will start with limited functionality');
  
  // Create fallback routes
  lineAccountRoutes = require('express').Router();
  rolesRoutes = require('express').Router();
  
  // Add error responses
  [lineAccountRoutes, rolesRoutes].forEach(router => {
    router.all('*', (req, res) => {
      res.status(503).json({ error: 'Route not available' });
    });
  });
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'KingChat Server - Production Mode',
    timestamp: new Date().toISOString(),
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: isDatabaseConnected(),
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint
app.get('/api/status', (req, res) => {
  const dbStatus = getStatus();
  res.json({
    status: 'running',
    mode: 'production',
    database: isDatabaseConnected() ? 'postgresql' : 'fallback',
    timestamp: new Date().toISOString(),
    ...dbStatus
  });
});

// API Routes
console.log('🔗 Mounting API routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted at /api/auth');

app.use('/api/admin-auth', adminAuthRoutes);
console.log('✅ Admin auth routes mounted at /api/admin-auth');

app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes mounted at /api/admin');

app.use('/api/line-accounts', lineAccountRoutes);
console.log('✅ LINE account routes mounted at /api/line-accounts');

app.use('/api/roles', rolesRoutes);
console.log('✅ Roles routes mounted at /api/roles');

// Serve static files from client directory
console.log('🌐 Serving static files from client directory');
app.use(express.static(path.join(__dirname, '../client')));

// Catch-all route for SPA
app.get('*', (req, res) => {
  // Check if login.html exists, otherwise serve a simple response
  const loginPath = path.join(__dirname, '../client/login.html');
  const fs = require('fs');
  
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KingChat - Loading...</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>KingChat Production Server</h1>
        <p>Server is running successfully!</p>
        <p><a href="/login.html">Go to Login</a></p>
      </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`📢 User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('send-message', (data) => {
    socket.to(data.room).emit('receive-message', data);
    console.log('💬 Message sent to room:', data.room);
  });
});

// Server startup
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log('🔧 Using PORT:', PORT);
  console.log('🚀 KingChat Server running on port', PORT);
  console.log('📱 Environment:', process.env.NODE_ENV || 'development');
  console.log('🌐 CORS Origin:', process.env.CORS_ORIGIN || 'http://localhost:5001');
  
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚂 Running on Railway - Production Mode');
    console.log('🔗 Available at: https://kingchat.up.railway.app');
  } else {
    console.log('💻 Running locally');
    console.log('🔗 Available at: http://localhost:' + PORT);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = { app, server, io };