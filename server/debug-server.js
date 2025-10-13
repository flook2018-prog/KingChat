const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🧪 RAILWAY DEBUG SERVER STARTING...');

// Basic middleware
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  console.log('📍 Root endpoint hit');
  res.json({ 
    message: 'KingChat Debug Server is working!',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  console.log('📍 Health endpoint hit');
  res.json({ 
    status: 'ok',
    message: 'Debug health check working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin', (req, res) => {
  console.log('📍 Admin endpoint hit');
  res.json([
    { id: 1, username: 'admin', fullName: 'Admin User', role: 'admin' },
    { id: 2, username: 'test', fullName: 'Test User', role: 'user' }
  ]);
});

// Catch all
app.use('*', (req, res) => {
  console.log('❌ Unmatched route:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server listening on 0.0.0.0:${PORT}`);
  console.log('📍 Available endpoints:');
  console.log('   GET / - Root test');
  console.log('   GET /api/health - Health check');
  console.log('   GET /api/admin - Admin list');
});

module.exports = app;