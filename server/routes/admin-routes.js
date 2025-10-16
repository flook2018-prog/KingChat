// KingChat Admin Management API
// admin-routes.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'kingchat-admin-secret-2025';

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify admin still exists and is active
        const adminResult = await pool.query(
            'SELECT id, username, role, status FROM admins WHERE id = $1 AND status = $2',
            [decoded.adminId, 'active']
        );

        if (adminResult.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid or expired token' 
            });
        }

        req.admin = adminResult.rows[0];
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
        });
    }
};

// Middleware to check super admin permissions
const requireSuperAdmin = (req, res, next) => {
    if (req.admin.role !== 'super_admin') {
        return res.status(403).json({ 
            success: false, 
            error: 'Super admin privileges required' 
        });
    }
    next();
};

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password required' 
            });
        }

        // Find admin by username
        const adminResult = await pool.query(
            'SELECT id, username, password_hash, full_name, role, status FROM admins WHERE username = $1',
            [username]
        );

        if (adminResult.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        const admin = adminResult.rows[0];

        // Check if admin is active
        if (admin.status !== 'active') {
            return res.status(401).json({ 
                success: false, 
                error: 'Account is inactive' 
            });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid username or password' 
            });
        }

        // Update last login
        await pool.query(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [admin.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                adminId: admin.id, 
                username: admin.username, 
                role: admin.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    full_name: admin.full_name,
                    role: admin.role
                }
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Get all admins (requires authentication)
router.get('/admins', verifyAdminToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, username, full_name, role, status, 
                created_at, updated_at, last_login, created_by_name
            FROM admin_list
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch admins' 
        });
    }
});

// Get single admin by ID
router.get('/admins/:id', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                id, username, full_name, role, status, 
                created_at, updated_at, last_login, created_by_name
            FROM admin_list 
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Admin not found' 
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch admin' 
        });
    }
});

// Create new admin (requires super admin)
router.post('/admins', verifyAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const { username, password, full_name, role } = req.body;

        // Validation
        if (!username || !password || !full_name || !role) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required' 
            });
        }

        if (!['admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role. Must be admin or super_admin' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if username already exists
        const existingAdmin = await pool.query(
            'SELECT id FROM admins WHERE username = $1',
            [username]
        );

        if (existingAdmin.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username already exists' 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new admin
        const result = await pool.query(`
            INSERT INTO admins (username, password_hash, full_name, role, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, username, full_name, role, status, created_at
        `, [username, passwordHash, full_name, role, req.admin.id]);

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create admin' 
        });
    }
});

// Update admin (requires super admin or self-update for basic info)
router.put('/admins/:id', verifyAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, full_name, role, status } = req.body;

        // Check if admin exists
        const existingAdmin = await pool.query(
            'SELECT id, role FROM admins WHERE id = $1',
            [id]
        );

        if (existingAdmin.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Admin not found' 
            });
        }

        // Permission check
        const isSuperAdmin = req.admin.role === 'super_admin';
        const isSelfUpdate = req.admin.id === parseInt(id);

        if (!isSuperAdmin && !isSelfUpdate) {
            return res.status(403).json({ 
                success: false, 
                error: 'Permission denied' 
            });
        }

        // Role and status changes require super admin
        if ((role || status) && !isSuperAdmin) {
            return res.status(403).json({ 
                success: false, 
                error: 'Super admin privileges required for role/status changes' 
            });
        }

        // Build update query
        const updates = [];
        const values = [];
        let valueIndex = 1;

        if (username) {
            // Check if new username is already taken
            const usernameCheck = await pool.query(
                'SELECT id FROM admins WHERE username = $1 AND id != $2',
                [username, id]
            );
            
            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Username already exists' 
                });
            }
            
            updates.push(`username = $${valueIndex++}`);
            values.push(username);
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Password must be at least 6 characters' 
                });
            }
            
            const passwordHash = await bcrypt.hash(password, 10);
            updates.push(`password_hash = $${valueIndex++}`);
            values.push(passwordHash);
        }

        if (full_name) {
            updates.push(`full_name = $${valueIndex++}`);
            values.push(full_name);
        }

        if (role && isSuperAdmin) {
            if (!['admin', 'super_admin'].includes(role)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid role' 
                });
            }
            updates.push(`role = $${valueIndex++}`);
            values.push(role);
        }

        if (status && isSuperAdmin) {
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid status' 
                });
            }
            updates.push(`status = $${valueIndex++}`);
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No valid fields to update' 
            });
        }

        values.push(id);
        
        const query = `
            UPDATE admins 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${valueIndex}
            RETURNING id, username, full_name, role, status, updated_at
        `;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Admin updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update admin' 
        });
    }
});

// Delete admin (requires super admin)
router.delete('/admins/:id', verifyAdminToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (req.admin.id === parseInt(id)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete your own account' 
            });
        }

        // Check if admin exists
        const existingAdmin = await pool.query(
            'SELECT id, username FROM admins WHERE id = $1',
            [id]
        );

        if (existingAdmin.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Admin not found' 
            });
        }

        // Delete admin
        await pool.query('DELETE FROM admins WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Admin deleted successfully'
        });

    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete admin' 
        });
    }
});

// Verify token endpoint
router.get('/verify', verifyAdminToken, (req, res) => {
    res.json({
        success: true,
        data: {
            admin: {
                id: req.admin.id,
                username: req.admin.username,
                role: req.admin.role
            }
        }
    });
});

// Admin logout (optional - can just delete token on client side)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;