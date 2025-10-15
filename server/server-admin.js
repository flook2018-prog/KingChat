const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();

// Fix Railway PORT issue
let PORT = process.env.PORT || 8080;
if (PORT == 5432) {
  console.log('⚠️  WARNING: Railway set PORT to PostgreSQL port (5432), changing to 8080');
  PORT = 8080;
}

console.log('🚀 Starting KingChat Admin Server...');
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('   PORT:', PORT);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('   Using DB URL:', databaseUrl);

// PostgreSQL connection setup
// Railway PostgreSQL connection
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:BGNklLjDXFDrpUQnosJWAWoBFiCjdNiR@postgres-kbtt.railway.internal:5432/railway';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: false, // Railway internal connections don't need SSL
  connectTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

let isDatabaseConnected = false;

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL Connected Successfully');
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL Connection Failed:', error.message);
    isDatabaseConnected = false;
    return false;
  }
}

// Initialize admin table
async function initializeAdminTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Admin table initialized');

    // Check if default admin exists
    const adminCheck = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO admins (username, password, email, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hashedPassword, 'admin@kingchat.com', 'System Administrator', 'admin']
      );
      console.log('✅ Default admin user created: admin / admin123');
    } else {
      console.log('✅ Default admin user already exists');
    }
  } catch (error) {
    console.log('❌ Admin table initialization failed:', error.message);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      /^https:\/\/.*\.railway\.app$/,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    callback(null, isAllowed);
  },
  credentials: true
}));

// Static files serving
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(express.static(path.join(__dirname, '..')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    database: isDatabaseConnected ? 'connected' : 'disconnected'
  });
});

// Admin API Endpoints

// GET /api/admins - Get all admins
app.get('/api/admins', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM admins ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admins',
      message: error.message
    });
  }
});

// POST /api/admins - Create new admin
app.post('/api/admins', async (req, res) => {
  try {
    const { username, password, email, full_name, role = 'admin' } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check if username already exists
    const existingAdmin = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin
    const result = await pool.query(
      'INSERT INTO admins (username, password, email, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, full_name, role, is_active, created_at',
      [username, hashedPassword, email, full_name, role]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Admin created successfully'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin',
      message: error.message
    });
  }
});

// PUT /api/admins/:id - Update admin
app.put('/api/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, is_active } = req.body;

    // Check if admin exists
    const existingAdmin = await pool.query('SELECT id FROM admins WHERE id = $1', [id]);
    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Check if username already exists for other admins
    if (username) {
      const duplicateCheck = await pool.query('SELECT id FROM admins WHERE username = $1 AND id != $2', [username, id]);
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }
    }

    // Update admin
    const result = await pool.query(
      `UPDATE admins 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           full_name = COALESCE($3, full_name),
           role = COALESCE($4, role),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, username, email, full_name, role, is_active, created_at, updated_at`,
      [username, email, full_name, role, is_active, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Admin updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin',
      message: error.message
    });
  }
});

// DELETE /api/admins/:id - Delete admin
app.delete('/api/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if admin exists
    const existingAdmin = await pool.query('SELECT id, username FROM admins WHERE id = $1', [id]);
    if (existingAdmin.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Prevent deleting the last admin
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins WHERE is_active = true');
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the last active admin'
      });
    }

    // Delete admin
    await pool.query('DELETE FROM admins WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete admin',
      message: error.message
    });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

app.get('/admin-working.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-working.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 KingChat Admin Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database in background
  console.log('🔄 Initializing database connection...');
  try {
    await testDatabaseConnection();
    if (isDatabaseConnected) {
      await initializeAdminTable();
      console.log('✅ Database and admin table initialized successfully');
    }
  } catch (dbError) {
    console.log('⚠️ Database initialization error:', dbError.message);
  }
});

module.exports = app;