const express = require('express');
const { auth } = require('../middleware/auth');
const { Message } = require('../models/postgresql');

const router = express.Router();

// Get messages for a customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ customer: req.params.customerId })
      .populate('sender', 'displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, messageType, content } = req.body;

    const message = new Message({
      customer: customerId,
      sender: req.user._id,
      messageType,
      content,
      direction: 'outgoing'
    });

    await message.save();
    await message.populate('sender', 'displayName');

    res.status(201).json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
router.put('/mark-read/:customerId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        customer: req.params.customerId,
        direction: 'incoming',
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;