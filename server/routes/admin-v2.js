const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Initialize database
router.get('/init', async (req, res) => {
  try {
    console.log('🔧 Initializing database...');

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
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await pool.query(`
        INSERT INTO admins (username, email, password, "displayName", role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', 'admin@kingchat.com', hashedPassword, 'System Administrator', 'admin']);
      
      console.log('✅ Default admin created');
    }

    res.json({ 
      success: true, 
      message: 'Database initialized',
      adminCount: result.rows[0].count
    });

  } catch (error) {
    console.error('❌ Init error:', error);
    res.status(500).json({ 
      error: 'Database initialization failed',
      details: error.message 
    });
  }
});

// Get all admins
router.get('/admin-users', async (req, res) => {
  try {
    console.log('📋 Getting all admins...');
    
    const result = await pool.query(`
      SELECT id, username, email, "displayName", role, "isActive", 
             "createdAt", "updatedAt"
      FROM admins 
      ORDER BY "createdAt" DESC
    `);

    console.log('✅ Found admins:', result.rows.length);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Get admins error:', error);
    res.status(500).json({ 
      error: 'Failed to get admins',
      details: error.message 
    });
  }
});

// Create new admin
router.post('/admin-users', async (req, res) => {
  try {
    console.log('➕ Creating new admin request body:', JSON.stringify(req.body, null, 2));
    
    const { username, password, displayName, role } = req.body;

    // Debug logging
    console.log('Received fields:', {
      username: username,
      password: password ? '***' : 'missing',
      displayName: displayName,
      role: role
    });

    if (!username || !password) {
      console.log('❌ Missing required fields:', {
        username: !!username,
        password: !!password
      });
      return res.status(400).json({ 
        error: 'Username and password are required',
        missing: {
          username: !username,
          password: !password
        }
      });
    }

    // Auto-generate email from username
    const email = `${username}@kingchat.com`;

    // Check if user exists (only check username since email is auto-generated)
    const exists = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new admin
    const result = await pool.query(`
      INSERT INTO admins (username, email, password, "displayName", role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, "displayName", role, "isActive", "createdAt"
    `, [username, email, hashedPassword, displayName || username, role || 'admin']);

    console.log('✅ Admin created with ID:', result.rows[0].id);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Admin created successfully'
    });

  } catch (error) {
    console.error('❌ Create admin error:', error);
    res.status(500).json({ 
      error: 'Failed to create admin',
      details: error.message 
    });
  }
});

// Update admin
router.put('/admin-users/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    console.log('✏️ Updating admin ID:', adminId);
    
    const { username, displayName, role, isActive, password } = req.body;

    // Auto-generate email from username
    const email = `${username}@kingchat.com`;

    let updateQuery = `
      UPDATE admins 
      SET username = $1, email = $2, "displayName" = $3, role = $4, 
          "isActive" = $5, "updatedAt" = CURRENT_TIMESTAMP
    `;
    let values = [username, email, displayName, role, isActive];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += `, password = $6`;
      values.push(hashedPassword);
    }

    updateQuery += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(adminId);

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const { password: _, ...adminData } = result.rows[0];

    console.log('✅ Admin updated:', adminData.username);

    res.json({
      success: true,
      data: adminData,
      message: 'Admin updated successfully'
    });

  } catch (error) {
    console.error('❌ Update admin error:', error);
    res.status(500).json({ 
      error: 'Failed to update admin',
      details: error.message 
    });
  }
});

// Delete admin
router.delete('/admin-users/:id', async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    console.log('🗑️ Deleting admin ID:', adminId);

    // Check if this is the last admin
    const countResult = await pool.query('SELECT COUNT(*) FROM admins WHERE "isActive" = true');
    if (countResult.rows[0].count === '1') {
      return res.status(400).json({ 
        error: 'Cannot delete the last active admin' 
      });
    }

    const result = await pool.query(
      'DELETE FROM admins WHERE id = $1 RETURNING username',
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    console.log('✅ Admin deleted:', result.rows[0].username);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete admin error:', error);
    res.status(500).json({ 
      error: 'Failed to delete admin',
      details: error.message 
    });
  }
});

module.exports = router;