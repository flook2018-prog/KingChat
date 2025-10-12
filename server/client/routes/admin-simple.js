const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL connection using your exact connection string
const pool = new Pool({
  connectionString: 'postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway',
  ssl: false
});

// Simple auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'railway-jwt-secret-2024');
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Test endpoint (no auth required)
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint called');
    const result = await pool.query('SELECT COUNT(*) FROM admins');
    res.json({
      message: 'Admin API is working!',
      timestamp: new Date().toISOString(),
      adminCount: result.rows[0].count,
      database: 'PostgreSQL connected'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.json({
      message: 'Admin API working but database error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all admins
router.get('/admin-users', auth, async (req, res) => {
  try {
    console.log('📋 Getting admin users for:', req.user.username);
    const result = await pool.query(`
      SELECT id, username, email, "displayName", role, "isActive", "createdAt"
      FROM admins 
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      admins: result.rows,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: result.rows.length,
        itemsPerPage: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new admin
router.post('/admin-users', auth, async (req, res) => {
  try {
    console.log('➕ Creating new admin by:', req.user.username);
    const { username, email, password, displayName, role = 'admin' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM admins WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new admin
    const result = await pool.query(`
      INSERT INTO admins (username, email, password, "displayName", role, "isActive")
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, username, email, "displayName", role, "isActive", "createdAt"
    `, [username, email, hashedPassword, displayName || username, role]);

    res.status(201).json({
      message: 'Admin created successfully',
      admin: result.rows[0]
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update admin
router.put('/admin-users/:id', auth, async (req, res) => {
  try {
    console.log('✏️ Updating admin:', req.params.id, 'by:', req.user.username);
    const { id } = req.params;
    const { username, email, displayName, role, isActive } = req.body;

    const result = await pool.query(`
      UPDATE admins 
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          "displayName" = COALESCE($3, "displayName"),
          role = COALESCE($4, role),
          "isActive" = COALESCE($5, "isActive"),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, username, email, "displayName", role, "isActive", "updatedAt"
    `, [username, email, displayName, role, isActive, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      message: 'Admin updated successfully',
      admin: result.rows[0]
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete admin
router.delete('/admin-users/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ Deleting admin:', req.params.id, 'by:', req.user.username);
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Check if this is the last admin
    const adminCount = await pool.query('SELECT COUNT(*) FROM admins WHERE role = $1', ['admin']);
    if (adminCount.rows[0].count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }

    const result = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({
      message: 'Admin deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and create default admin
router.post('/init', async (req, res) => {
  try {
    console.log('🚀 Initializing database...');
    
    // Create admins table if not exists
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
    const existing = await pool.query('SELECT COUNT(*) FROM admins');
    
    if (existing.rows[0].count === '0') {
      // Create default admin
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await pool.query(`
        INSERT INTO admins (username, email, password, "displayName", role, "isActive")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin', 'admin@kingchat.com', hashedPassword, 'System Administrator', 'admin', true]);
      
      res.json({
        message: 'Database initialized and default admin created',
        credentials: { username: 'admin', password: 'admin123' }
      });
    } else {
      res.json({
        message: 'Database already initialized',
        adminCount: existing.rows[0].count
      });
    }
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;