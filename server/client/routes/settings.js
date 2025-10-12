const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { Settings } = require('../models/postgresql');

const router = express.Router();

// Get all settings
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Settings.findAll();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get settings by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const settings = await Settings.find({ category: req.params.category });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update setting
router.put('/:key', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { value, description } = req.body;
    
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { value, description },
      { new: true, upsert: true }
    );

    res.json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk update settings
router.put('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { settings } = req.body;
    const results = [];

    for (const settingData of settings) {
      const setting = await Settings.findOneAndUpdate(
        { key: settingData.key },
        { 
          value: settingData.value, 
          description: settingData.description,
          category: settingData.category 
        },
        { new: true, upsert: true }
      );
      results.push(setting);
    }

    res.json({ message: 'Settings updated successfully', settings: results });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;