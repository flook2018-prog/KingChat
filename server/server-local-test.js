const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

console.log('🧪 LOCAL TEST SERVER - สำหรับทดสอบการทำงานของระบบ');
console.log('📝 ใช้ in-memory database สำหรับทดสอบ');

// In-memory storage for testing
let testAdmins = [];
let testUsers = [];

// Initialize with test admin
async function initializeTestData() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    testAdmins = [
        {
            id: 1,
            username: 'admin',
            password: hashedPassword,
            email: 'admin@kingchat.com',
            role: 'admin',
            created_at: new Date().toISOString()
        }
    ];
    console.log('✅ Test admin created: admin / admin123');
}

// Admin routes
app.get('/api/admin/users', (req, res) => {
    res.json({
        success: true,
        users: testAdmins.map(admin => ({
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            created_at: admin.created_at
        }))
    });
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { username, password, email, role = 'admin' } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password และ email จำเป็นต้องระบุ'
            });
        }

        // Check if username already exists
        const existingUser = testAdmins.find(admin => admin.username === username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username นี้ถูกใช้แล้ว'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = {
            id: testAdmins.length + 1,
            username,
            password: hashedPassword,
            email,
            role,
            created_at: new Date().toISOString()
        };

        testAdmins.push(newAdmin);
        console.log(`✅ New admin created: ${username}`);

        res.json({
            success: true,
            message: 'สร้างผู้ใช้ใหม่สำเร็จ',
            user: {
                id: newAdmin.id,
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role,
                created_at: newAdmin.created_at
            }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
        });
    }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุ username และ password'
            });
        }

        // Find user in test data
        const admin = testAdmins.find(a => a.username === username);
        if (!admin) {
            console.log(`❌ Login failed: User ${username} not found`);
            return res.status(401).json({
                success: false,
                message: 'Username หรือ password ไม่ถูกต้อง'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            console.log(`❌ Login failed: Invalid password for ${username}`);
            return res.status(401).json({
                success: false,
                message: 'Username หรือ password ไม่ถูกต้อง'
            });
        }

        console.log(`✅ Login successful: ${username}`);
        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token: 'test-token-' + admin.id,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        });
    }
});

// Status route
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        mode: 'local-test',
        database: 'in-memory',
        fallback: false,
        timestamp: new Date().toISOString(),
        admins_count: testAdmins.length
    });
});

// Serve client files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Initialize and start server
initializeTestData().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Local test server running on port ${PORT}`);
        console.log(`📱 Access at: http://localhost:${PORT}`);
        console.log(`🔑 Test login: admin / admin123`);
        console.log(`📋 Current admins: ${testAdmins.length}`);
    });
});