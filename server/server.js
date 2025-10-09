const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const ngrok = require('ngrok');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug environment variables
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
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

// Connect to Database (MongoDB or PostgreSQL)
const connectDatabase = async () => {
  // For Railway, prioritize DATABASE_URL or MONGODB_URI
  const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
  
  if (!dbUrl) {
    console.log('⚠️  No database URL provided, using default MongoDB');
    try {
      await mongoose.connect('mongodb://localhost:27017/kingchat');
      console.log('✅ Connected to local MongoDB');
    } catch (err) {
      console.error('❌ Local MongoDB connection error:', err.message);
      console.log('💡 Make sure MongoDB is running or set DATABASE_URL/MONGODB_URI');
    }
    return;
  }

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    console.log('🐘 PostgreSQL detected - Converting to MongoDB Atlas for compatibility...');
    // For now, we'll need MongoDB. In production, you should use MongoDB Atlas
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== process.env.DATABASE_URL) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
      } catch (err) {
        console.error('❌ MongoDB Atlas connection error:', err.message);
      }
    } else {
      console.log('❌ PostgreSQL not yet supported. Please set MONGODB_URI to MongoDB Atlas connection string');
    }
  } else {
    // MongoDB connection string
    console.log('🍃 Connecting to MongoDB...');
    try {
      await mongoose.connect(dbUrl);
      console.log('✅ Connected to MongoDB');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
    }
  }
};

connectDatabase();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const lineOARoutes = require('./routes/lineoa');
const customerRoutes = require('./routes/customers');
const messageRoutes = require('./routes/messages');
const settingsRoutes = require('./routes/settings');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lineoa', lineOARoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files from client directory (for Railway deployment)
if (process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT) {
  console.log('🌐 Serving static files from client directory');
  app.use(express.static(path.join(__dirname, '../client')));
  
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
  
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dashboard.html'));
  });
  
  // Default route serves login page
  app.get('/', (req, res) => {
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

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: '👑 KingChat API Server',
    version: '1.0.0',
    status: 'Running'
  });
});

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
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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