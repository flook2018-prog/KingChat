const express = require('express');
const { auth } = require('../middleware/auth');
const { Customer } = require('../models/postgresql');

const router = express.Router();

// Get all customers
router.get('/', auth, async (req, res) => {
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
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('lineOA', 'name');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const { phone, email, notes, tags, priority } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { phone, email, notes, tags, priority },
      { new: true }
    ).populate('lineOA', 'name');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;