const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 KingChat Frontend Server running on http://localhost:${PORT}`);
    console.log(`📱 Available pages:`);
    console.log(`   - Login: http://localhost:${PORT}/login.html`);
    console.log(`   - Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`🔗 Backend API: http://localhost:5001`);
});