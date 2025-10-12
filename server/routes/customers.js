const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Mock customer data for demo
const mockCustomers = [
  {
    id: '1',
    display_name: 'ลูกค้า A',
    line_user_id: 'U1234567890',
    phone: '081-234-5678',
    status: 'online',
    lastMessageAt: new Date('2024-01-15T10:30:00Z'),
    notes: 'ลูกค้าสำคัญ'
  },
  {
    id: '2', 
    display_name: 'ลูกค้า B',
    line_user_id: 'U0987654321',
    phone: '082-345-6789',
    status: 'offline',
    lastMessageAt: new Date('2024-01-14T15:45:00Z'),
    notes: 'ติดต่อยาก'
  }
];

// Get all customers
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 GET /api/customers - Fetching all customers');
    res.json({ 
      success: true, 
      data: mockCustomers,
      total: mockCustomers.length
    });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' 
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👤 GET /api/customers/:id - Fetching customer:', id);
    
    const customer = mockCustomers.find(c => c.id === id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' 
    });
  }
});

// Search customers  
router.get('/search', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    console.log('🔍 GET /api/customers/search - Search params:', { search, status, page, limit });
    
    let filteredCustomers = [...mockCustomers];
    
    if (search) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.display_name.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search)
      );
    }
    
    if (status) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.status === status
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error searching customers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการค้นหาลูกค้า' 
    });
  }
});

// Create new customer
router.post('/', auth, async (req, res) => {
  try {
    const { display_name, line_user_id, phone, notes } = req.body;
    console.log('➕ POST /api/customers - Creating customer:', { display_name, phone });
    
    if (!display_name) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อลูกค้า'
      });
    }
    
    const newCustomer = {
      id: (mockCustomers.length + 1).toString(),
      display_name,
      line_user_id: line_user_id || `U${Date.now()}`,
      phone: phone || '',
      status: 'offline',
      lastMessageAt: new Date(),
      notes: notes || ''
    };
    
    mockCustomers.push(newCustomer);
    
    res.status(201).json({ 
      success: true, 
      data: newCustomer,
      message: 'เพิ่มลูกค้าเรียบร้อยแล้ว' 
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเพิ่มลูกค้า' 
    });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('✏️ PUT /api/customers/:id - Updating customer:', id, updateData);
    
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    mockCustomers[customerIndex] = { ...mockCustomers[customerIndex], ...updateData };
    
    res.json({ 
      success: true, 
      data: mockCustomers[customerIndex],
      message: 'อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการอัปเดตลูกค้า' 
    });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ DELETE /api/customers/:id - Deleting customer:', id);
    
    const customerIndex = mockCustomers.findIndex(c => c.id === id);
    
    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    const deletedCustomer = mockCustomers.splice(customerIndex, 1)[0];
    
    res.json({ 
      success: true, 
      data: deletedCustomer,
      message: 'ลบลูกค้าเรียบร้อยแล้ว' 
    });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการลบลูกค้า' 
    });
  }
});

// Get customer messages (mock)
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    console.log('💬 GET /api/customers/:id/messages - Fetching messages for customer:', id);
    
    const customer = mockCustomers.find(c => c.id === id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }
    
    // Mock messages
    const mockMessages = [
      {
        id: '1',
        customer: id,
        message: 'สวัสดีครับ',
        type: 'text',
        direction: 'incoming',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        status: 'read'
      },
      {
        id: '2',
        customer: id,
        message: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ',
        type: 'text',
        direction: 'outgoing',
        timestamp: new Date('2024-01-15T10:31:00Z'),
        status: 'sent'
      }
    ];
    
    res.json({
      success: true,
      data: mockMessages,
      pagination: {
        total: mockMessages.length,
        totalPages: Math.ceil(mockMessages.length / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching customer messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อความ' 
    });
  }
});

module.exports = router;