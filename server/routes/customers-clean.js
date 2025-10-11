const express = require('express');
const { Customer, ChatMessage } = require('../models/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.getAll();
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.getById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });
  }
});

// Search customers
router.get('/search', async (req, res) => {
  try {
    const { search, lineOA, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    if (lineOA) {
      query.lineOA = lineOA;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const customers = await Customer.find(query)
      .populate('lineOA', 'name')
      .sort({ lastMessageAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Customer.countDocuments(query);
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { display_name, line_user_id, phone, notes, lineOA } = req.body;
    
    if (!display_name) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อลูกค้า'
      });
    }
    
    const customer = await Customer.create({
      display_name,
      line_user_id,
      phone,
      notes,
      lineOA,
      status: 'active',
      lastMessageAt: new Date()
    });
    
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างลูกค้า' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const customer = await Customer.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตลูกค้า' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndDelete(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    res.json({ success: true, message: 'ลบลูกค้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบลูกค้า' });
  }
});

// Get customer messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await ChatMessage.find({ customer: id })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await ChatMessage.countDocuments({ customer: id });
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อความ' });
  }
});

module.exports = router;