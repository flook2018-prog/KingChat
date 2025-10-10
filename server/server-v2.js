const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Set defaults
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '8080';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'railway-jwt-secret-2024';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway';

console.log('🚀 Starting KingChat Server v2...');
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔌 Port:', process.env.PORT);
console.log('🗄️ Database:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-simple'
  });
});

// Simple test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API working!', timestamp: new Date().toISOString() });
});

// Load routes
const authRoutes = require('./routes/auth-v2');
const adminRoutes = require('./routes/admin-v2');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

console.log('✅ Routes loaded: /api/auth, /api/admin');

// Static files
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));
console.log('📁 Static files from:', clientPath);

// Redirects
app.get('/', (req, res) => res.redirect('/login.html'));
app.get('/login', (req, res) => res.redirect('/login.html'));
app.get('/dashboard', (req, res) => res.redirect('/dashboard.html'));

// Initialize database
async function initDB() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "displayName" VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin exists
    const result = await pool.query('SELECT COUNT(*) FROM admins');
    
    if (result.rows[0].count === '0') {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await pool.query(`
        INSERT INTO admins (username, email, password, "displayName", role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', 'admin@kingchat.com', hashedPassword, 'System Administrator', 'admin']);
      
      console.log('✅ Default admin created: admin / admin123');
    } else {
      console.log('ℹ️ Admin exists, count:', result.rows[0].count);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Database init error:', error.message);
  }
}

// 404 handler
app.use((req, res) => {
  console.log(`❓ 404: ${req.method} ${req.url}`);
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found', path: req.url });
  } else {
    res.redirect('/login.html');
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 URL: https://kingchat.up.railway.app`);
  
  // Initialize database after server starts
  setTimeout(initDB, 2000);
});

module.exports = { app, server };