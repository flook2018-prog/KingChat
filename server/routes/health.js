const express = require('express');
const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'KingChat API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;