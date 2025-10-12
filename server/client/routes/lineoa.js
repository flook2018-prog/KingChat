const express = require('express');
const { auth } = require('../middleware/auth');
const { LineOA } = require('../models/postgresql');

const router = express.Router();

// Get all LINE OA accounts
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await LineOA.findAll();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new LINE OA account
router.post('/', auth, async (req, res) => {
  try {
    const { name, channelId, channelSecret, accessToken, webhookUrl } = req.body;

    const account = new LineOA({
      name,
      channelId,
      channelSecret,
      accessToken,
      webhookUrl
    });

    await account.save();
    res.status(201).json({ message: 'LINE OA account created successfully', account });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update LINE OA account
router.put('/:id', auth, async (req, res) => {
  try {
    const account = await LineOA.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account updated successfully', account });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete LINE OA account
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await LineOA.findByIdAndDelete(req.params.id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;