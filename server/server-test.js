const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Very simple test server
app.get('/', (req, res) => {
    res.json({ 
        message: 'KingChat Test Server - Working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        message: 'API working!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/admin', (req, res) => {
    res.json([
        { id: 1, username: 'admin', display_name: 'ผู้ดูแลระบบหลัก', role: 'super_admin', points: 4500 },
        { id: 2, username: 'somchai', display_name: 'สมชาย ใจดี', role: 'admin', points: 3200 },
        { id: 3, username: 'supha', display_name: 'สุภา รักงาน', role: 'admin', points: 2300 },
        { id: 4, username: 'vichai', display_name: 'วิชัย เก่งงาน', role: 'admin', points: 1800 }
    ]);
});

app.listen(port, () => {
    console.log(`🚀 Test server running on port ${port}`);
});

module.exports = app;