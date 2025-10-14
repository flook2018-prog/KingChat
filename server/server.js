const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database models
const { pool, testConnection } = require('./models/database');

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

// Database connection status
let isDatabaseConnected = false;

// Database connection
const connectDatabase = async () => {
  try {
    await testConnection();
    console.log('✅ PostgreSQL database connected successfully');
    
    // Test Admin model
    try {
      const Admin = require('./models/postgresql/Admin');
      console.log('✅ Admin model loaded successfully');
    } catch (error) {
      console.log('⚠️ Admin model load failed:', error.message);
    }
    
    // Check if admin table exists, create if needed
    try {
      await pool.query('SELECT 1 FROM admins LIMIT 1');
      console.log('✅ Admin table verified');
    } catch (error) {
      console.log('⚠️ Admin table check failed, may need to create table');
    }
    
    console.log('✅ Database connection verified');
    isDatabaseConnected = true;
    
    // Create admin users on Railway
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('🏗️ Railway environment detected, setting up admin users...');
      try {
        const { createAdminsOnRailway } = require('./createAdminsRailway');
        await createAdminsOnRailway();
        console.log('✅ Admin users setup completed on Railway');
      } catch (error) {
        console.error('❌ Admin users setup failed:', error.message);
      }
    }
    
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    console.error('   Will retry connection in background...');
    console.error('   Server will continue to run but database features may not work');
    isDatabaseConnected = false;
    
    // Retry connection after 10 seconds
    setTimeout(() => {
      console.log('🔄 Retrying database connection...');
      connectDatabase();
    }, 10000);
  }
};

// Start database connection (non-blocking)
connectDatabase();

// Import routes with error handling
let authRoutes, adminAuthRoutes, adminRoutes, lineAccountRoutes, rolesRoutes;

try {
  authRoutes = require('./routes/auth-simple');
  console.log('✅ Auth routes loaded from auth-simple.js');
} catch (error) {
  console.error('❌ Failed to load auth-simple.js:', error.message);
  console.error('❌ Stack trace:', error.stack);
  
  // Try fallback to old auth.js
  try {
    authRoutes = require('./routes/auth');
    console.log('⚠️ Using fallback auth.js');
  } catch (fallbackError) {
    console.error('❌ Fallback auth.js also failed:', fallbackError.message);
    authRoutes = require('express').Router();
    authRoutes.all('*', (req, res) => {
      res.status(503).json({ error: 'Auth routes not available', details: error.message });
    });
  }
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
  
  // Try admin route files for Railway deployment
  try {
    adminRoutes = require('./routes/admin');
    console.log('✅ Using admin routes (PostgreSQL)');
  } catch {
    try {
      adminRoutes = require('./routes/admin-backup');
      console.log('✅ Using admin-backup routes');
    } catch {
      // Create fallback admin routes
      adminRoutes = require('express').Router();
      adminRoutes.all('*', (req, res) => {
        res.status(503).json({ error: 'Admin routes not available' });
      });
      console.log('⚠️ Using fallback admin routes');
    }
  }
  
  lineAccountRoutes = require('./routes/lineAccounts');
  rolesRoutes = require('./routes/roles');
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.log('⚠️  Server will start with limited functionality');
  
  // Create fallback routes
  authRoutes = require('express').Router();
  adminAuthRoutes = require('express').Router();
  adminRoutes = require('express').Router();
  lineAccountRoutes = require('express').Router();
  
  // Add error responses
  [authRoutes, adminAuthRoutes, adminRoutes, lineAccountRoutes, rolesRoutes].forEach(router => {
    router.all('*', (req, res) => {
      res.status(503).json({ error: 'Database not available' });
    });
  });
}

// API routes
console.log('🔗 Mounting API routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted at /api/auth');
app.use('/api/admin-auth', adminAuthRoutes);  // Admin authentication
app.use('/api/admin', adminRoutes);           // Admin CRUD operations
app.use('/api/line', lineAccountRoutes);
app.use('/api/roles', rolesRoutes);

// Customers API endpoint
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch customers',
      data: []
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working', 
    timestamp: new Date().toISOString(),
    auth_routes_loaded: !!authRoutes
  });
});

// Serve static files from client directory (for Railway deployment)
if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT) {
  console.log('🌐 Serving static files from client directory');
  
  // Primary static files - serve both directories for maximum compatibility
  app.use(express.static(path.join(__dirname, 'client'), {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  
  app.use(express.static(path.join(__dirname, '../client'), {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  
  // Serve CSS and JS specifically
  app.get('/css/*', (req, res) => {
    const filePath = path.join(__dirname, 'client', req.path);
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(filePath, (err) => {
      if (err) {
        const fallbackPath = path.join(__dirname, '../client', req.path);
        res.sendFile(fallbackPath, (err2) => {
          if (err2) {
            res.status(404).send('CSS file not found');
          }
        });
      }
    });
  });
  
  app.get('/js/*', (req, res) => {
    const filePath = path.join(__dirname, 'client', req.path);
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(filePath, (err) => {
      if (err) {
        const fallbackPath = path.join(__dirname, '../client', req.path);
        res.sendFile(fallbackPath, (err2) => {
          if (err2) {
            res.status(404).send('JS file not found');
          }
        });
      }
    });
  });
  
  // Serve client pages
  app.get('/pages/*', (req, res) => {
    const filePath = path.join(__dirname, '../client', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: 'Page not found' });
      }
    });
  });
  
  // Serve main pages
  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
  });
  
  app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
  });
  
  app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/chat.html'));
  });
  
  app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/chat.html'));
  });
  
  app.get('/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/accounts-working.html'));
  });
  
  app.get('/line-connect', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/line-connect.html'));
  });
  
  app.get('/line-connect.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/line-connect.html'));
  });
  
  app.get('/customers', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/customers-working.html'));
  });
  
  app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/settings-working.html'));
  });
  
  app.get('/quick-messages', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/quick-messages-working.html'));
  });
  
  app.get('/quick-messages-working.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/quick-messages-working.html'));
  });
  
  // Alternative route for client folder
  app.get('/quick-messages-alt.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/quick-messages-working.html'));
  });
  
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/admin-working.html'));
  });
  
  app.get('/admin-management', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/admin-working.html'));
  });
  
  app.get('/admin-working', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/admin-working.html'));
  });

  // Default route serves login page
  app.get('/', (req, res) => {
    console.log('🏠 Root route accessed, redirecting to login');
    res.sendFile(path.join(__dirname, '../client/login.html'));
  });
} else {
  // Development - API only mode
  app.get('/', (req, res) => {
    res.json({ 
      message: '👑 KingChat API Server',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      docs: '/api/docs',
      health: '/health',
      frontend: 'http://localhost:3000'
    });
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join customer room
  socket.on('join_customer', (customerId) => {
    socket.join(`customer_${customerId}`);
    console.log(`👤 User ${socket.id} joined customer room: ${customerId}`);
  });

  // Handle new message
  socket.on('new_message', async (data) => {
    try {
      const Message = require('./models/Message');
      const Customer = require('./models/Customer');

      // Save message to database
      const newMessage = new Message({
        customer: data.customerId,
        lineOA: data.lineOA,
        sender: data.sender || null,
        messageType: data.messageType || 'text',
        content: data.content,
        direction: data.direction || 'outgoing',
        status: 'sent',
        isRead: false
      });

      const savedMessage = await newMessage.save();
      await savedMessage.populate(['customer', 'sender', 'lineOA']);

      // Update customer's last message time
      await Customer.findByIdAndUpdate(data.customerId, {
        lastMessageAt: new Date(),
        hasUnreadMessages: data.direction === 'incoming'
      });

      // Emit to customer room
      io.to(`customer_${data.customerId}`).emit('message_received', {
        ...savedMessage.toObject(),
        timestamp: savedMessage.createdAt
      });

    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`customer_${data.customerId}`).emit('user_typing', data);
  });

  // Handle message read status
  socket.on('mark_read', async (data) => {
    try {
      const Message = require('./models/Message');
      await Message.updateMany(
        { customer: data.customerId, isRead: false, direction: 'incoming' },
        { isRead: true, readAt: new Date() }
      );
      
      io.to(`customer_${data.customerId}`).emit('messages_read', data);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: isDatabaseConnected ? 'connected' : 'disconnected'
  });
});

// Warning for missing environment variables
if (!process.env.JWT_SECRET) {
  console.log('⚠️  WARNING: JWT_SECRET not set. Using default (change in production!)');
}

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  console.log('⚠️  WARNING: No database URL set. Add MONGODB_URI environment variable');
}

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 KingChat Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  
  // Only start ngrok in local development
  if (process.env.NODE_ENV === 'development' && process.env.NGROK_AUTH_TOKEN && !process.env.RAILWAY_ENVIRONMENT) {
    try {
      // Connect with ngrok v5 API
      const url = await ngrok.connect({
        port: PORT,
        authtoken: process.env.NGROK_AUTH_TOKEN,
        region: 'ap',
        onStatusChange: status => console.log(`📡 Ngrok status: ${status}`),
        onLogEvent: data => console.log(`📋 Ngrok log: ${data}`)
      });
      
      console.log(`🌐 Ngrok tunnel: ${url}`);
      console.log(`📱 Use this URL for LINE webhook: ${url}/api/line/webhook`);
      console.log(`🔗 Public URL: ${url}`);
    } catch (error) {
      console.log('⚠️  Ngrok tunnel failed:', error.message);
      console.log('💡 Possible solutions:');
      console.log('   - Check if ngrok auth token is valid');
      console.log('   - Make sure ngrok is installed: npm install ngrok@latest');
      console.log('   - Verify internet connection');
      console.log('🚀 Server continues running without ngrok');
    }
  } else if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚂 Running on Railway - Ngrok disabled');
  } else if (process.env.NODE_ENV === 'development') {
    console.log('💡 Ngrok disabled: Set NGROK_AUTH_TOKEN in .env to enable tunnel');
  }
});

module.exports = { app, io };