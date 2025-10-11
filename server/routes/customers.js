const express = require('express');const express = require('express');

const { Customer, ChatMessage } = require('../models/database');const { auth } = require('../middleware/auth');

const router = express.Router();const { Customer, ChatMessage } = require('../models/database');



// Get all customersconst router = express.Router();

router.get('/', async (req, res) => {

  try {// Get all customers

    const customers = await Customer.getAll();router.get('/', async (req, res) => {

    res.json({ success: true, data: customers });  try {

  } catch (error) {    const customers = await Customer.getAll();

    console.error('Error fetching customers:', error);    res.json({ success: true, data: customers });

    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });  } catch (error) {

  }    console.error('Error fetching customers:', error);

});    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });

  }

// Get customer by ID});

router.get('/:id', async (req, res) => {    

  try {    let query = {};

    const { id } = req.params;    

    const customer = await Customer.getById(id);    if (lineOA) {

          query.lineOA = lineOA;

    if (!customer) {    }

      return res.status(404).json({     

        success: false,     if (search) {

        message: 'ไม่พบข้อมูลลูกค้า'       query.$text = { $search: search };

      });    }

    }

    const customers = await Customer.find(query)

    res.json({ success: true, data: customer });      .populate('lineOA', 'name')

  } catch (error) {      .sort({ lastMessageAt: -1 })

    console.error('Error fetching customer:', error);      .limit(limit * 1)

    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });      .skip((page - 1) * limit);

  }

});    const total = await Customer.countDocuments(query);



// Update customer    res.json({

router.put('/:id', async (req, res) => {      customers,

  try {      totalPages: Math.ceil(total / limit),

    const { id } = req.params;      currentPage: page,

    const { display_name, phone_number, notes } = req.body;      total

    });

    if (!display_name) {  } catch (error) {

      return res.status(400).json({     res.status(500).json({ error: 'Server error' });

        success: false,   }

        message: 'กรุณากรอกชื่อลูกค้า' });

      });

    }// Get customer by ID

router.get('/:id', auth, async (req, res) => {

    const updatedCustomer = await Customer.update(id, {  try {

      display_name,    const customer = await Customer.findById(req.params.id)

      phone_number: phone_number || null,      .populate('lineOA', 'name');

      notes: notes || null

    });    if (!customer) {

      return res.status(404).json({ error: 'Customer not found' });

    if (!updatedCustomer) {    }

      return res.status(404).json({ 

        success: false,     res.json(customer);

        message: 'ไม่พบลูกค้าที่ต้องการแก้ไข'   } catch (error) {

      });    res.status(500).json({ error: 'Server error' });

    }  }

});

    res.json({ 

      success: true, // Update customer

      message: 'แก้ไขข้อมูลลูกค้าสำเร็จ', router.put('/:id', auth, async (req, res) => {

      data: updatedCustomer   try {

    });    const { phone, email, notes, tags, priority } = req.body;

  } catch (error) {    

    console.error('Error updating customer:', error);    const customer = await Customer.findByIdAndUpdate(

    res.status(500).json({       req.params.id,

      success: false,       { phone, email, notes, tags, priority },

      message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลลูกค้า'       { new: true }

    });    ).populate('lineOA', 'name');

  }

});    if (!customer) {

      return res.status(404).json({ error: 'Customer not found' });

// Delete customer    }

router.delete('/:id', async (req, res) => {

  try {    res.json({ message: 'Customer updated successfully', customer });

    const { id } = req.params;  } catch (error) {

    res.status(500).json({ error: 'Server error' });

    const deletedCustomer = await Customer.delete(id);  }

});

    if (!deletedCustomer) {

      return res.status(404).json({ // Delete customer

        success: false, router.delete('/:id', auth, async (req, res) => {

        message: 'ไม่พบลูกค้าที่ต้องการลบ'   try {

      });    const customer = await Customer.findByIdAndDelete(req.params.id);

    }

    if (!customer) {

    res.json({       return res.status(404).json({ error: 'Customer not found' });

      success: true,     }

      message: 'ลบข้อมูลลูกค้าสำเร็จ', 

      data: deletedCustomer     res.json({ message: 'Customer deleted successfully' });

    });  } catch (error) {

  } catch (error) {    res.status(500).json({ error: 'Server error' });

    console.error('Error deleting customer:', error);  }

    res.status(500).json({ });

      success: false, 

      message: 'เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า' module.exports = router;
    });
  }
});

// Get customer chat messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const messages = await ChatMessage.getByCustomerId(id, parseInt(limit));
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching customer messages:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อความ' });
  }
});

// Mark customer messages as read
router.post('/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;

    await ChatMessage.markAsRead(id);
    await Customer.updateLastActivity(id);
    
    res.json({ 
      success: true, 
      message: 'อัพเดทสถานะการอ่านแล้ว' 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' });
  }
});

module.exports = router;