// Mock Database for Admin Management Testing
let mockAdmins = [
  {
    id: 1,
    username: 'BOSS BABY',
    role: 'super',
    status: 'active',
    created_at: new Date('2024-01-01'),
    last_login: new Date()
  },
  {
    id: 2,
    username: 'admin1',
    role: 'admin',
    status: 'active',
    created_at: new Date('2024-02-01'),
    last_login: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 3,
    username: 'operator1',
    role: 'operator',
    status: 'active',
    created_at: new Date('2024-03-01'),
    last_login: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  }
];

let nextId = 4;

// Mock Database Functions
const mockDB = {
  // Get all admins
  async getAdmins() {
    return mockAdmins;
  },

  // Create new admin
  async createAdmin(username, hashedPassword, role) {
    const newAdmin = {
      id: nextId++,
      username,
      password: hashedPassword,
      role,
      status: 'active',
      created_at: new Date(),
      last_login: null
    };
    mockAdmins.push(newAdmin);
    
    // Return without password
    const { password, ...adminWithoutPassword } = newAdmin;
    return adminWithoutPassword;
  },

  // Update admin
  async updateAdmin(id, username, hashedPassword, role, status) {
    const adminIndex = mockAdmins.findIndex(a => a.id == id);
    if (adminIndex === -1) {
      throw new Error('Admin not found');
    }

    mockAdmins[adminIndex] = {
      ...mockAdmins[adminIndex],
      username,
      role,
      status: status || 'active'
    };

    if (hashedPassword) {
      mockAdmins[adminIndex].password = hashedPassword;
    }

    // Return without password
    const { password, ...adminWithoutPassword } = mockAdmins[adminIndex];
    return adminWithoutPassword;
  },

  // Delete admin
  async deleteAdmin(id) {
    const adminIndex = mockAdmins.findIndex(a => a.id == id);
    if (adminIndex === -1) {
      throw new Error('Admin not found');
    }

    const deletedAdmin = mockAdmins.splice(adminIndex, 1)[0];
    return { id: deletedAdmin.id, username: deletedAdmin.username };
  },

  // Check if username exists
  async usernameExists(username, excludeId = null) {
    return mockAdmins.some(a => a.username === username && a.id !== excludeId);
  },

  // Get admin count
  async getActiveAdminCount() {
    return mockAdmins.filter(a => a.status === 'active').length;
  }
};

module.exports = mockDB;