// API Client for KingChat
const API_BASE_URL = 'http://localhost:5001/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth header if available
    try {
      const authHeader = window.auth ? window.auth.getAuthHeader() : null;
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }
    } catch (error) {
      console.warn('Could not get auth header:', error);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          // Unauthorized - redirect to login
          auth.logout();
          window.location.href = window.location.pathname.includes('pages/') ? '../login.html' : 'login.html';
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }

  // Authentication endpoints
  async login(username, password) {
    try {
      return await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    } catch (error) {
      console.error('API login failed, trying fallback method...', error);
      
      console.log('=== LOGIN FALLBACK DEBUG ===');
      console.log('Attempting to login:', username);
      
      // Check if AdminManager has users (from localStorage or in-memory)
      let adminUsers = [];
      
      // Try to get users from localStorage
      try {
        const storedUsers = localStorage.getItem('kingchat_admin_users');
        console.log('Raw localStorage data:', storedUsers);
        if (storedUsers) {
          adminUsers = JSON.parse(storedUsers);
          console.log('Found stored admin users:', adminUsers.length);
          console.log('Stored users:', adminUsers);
        }
      } catch (e) {
        console.log('No stored admin users found:', e);
      }
      
      // Try to get users from global AdminManager
      if (window.adminManager && window.adminManager.admins) {
        console.log('Found AdminManager with', window.adminManager.admins.length, 'users');
        adminUsers = [...adminUsers, ...window.adminManager.admins];
        console.log('Added AdminManager users, total:', adminUsers.length);
      } else {
        console.log('No global AdminManager found');
      }
      
      console.log('Total admin users to check:', adminUsers);
      
      // Check against stored/created users first
      const foundUser = adminUsers.find(user => {
        console.log(`Checking user: ${user.username} vs ${username}, password match: ${user.password === password}`);
        return user.username === username && user.password === password;
      });
      
      if (foundUser) {
        console.log('✅ Login successful with created user:', foundUser.username);
        return {
          token: 'user-token-' + Date.now(),
          user: {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email || `${foundUser.username}@kingchat.com`,
            displayName: foundUser.displayName,
            role: foundUser.role,
            permissions: this.getRolePermissions(foundUser.role)
          }
        };
      } else {
        console.log('❌ User not found in stored users');
      }
      
      // Fallback: Default accounts
      if (username === 'admin' && password === 'admin123') {
        console.log('Using default admin account');
        return {
          token: 'demo-token-' + Date.now(),
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@kingchat.com',
            displayName: 'System Administrator',
            role: 'super_admin',
            permissions: this.getRolePermissions('super_admin')
          }
        };
      } else if (username === 'demo' && password === 'demo123') {
        console.log('Using demo account');
        return {
          token: 'demo-token-' + Date.now(),
          user: {
            id: 2,
            username: 'demo',
            email: 'demo@kingchat.com',
            displayName: 'Demo User',
            role: 'moderator',
            permissions: this.getRolePermissions('moderator')
          }
        };
      }
      
      throw new Error('Invalid credentials');
    }
  }

  // Role-based permissions helper
  getRolePermissions(role) {
    const permissions = {
      super_admin: {
        canManageUsers: true,
        canManageLineOA: true,
        canViewAllChats: true,
        canManageSettings: true,
        canDeleteData: true
      },
      admin: {
        canManageUsers: true,
        canManageLineOA: true,
        canViewAllChats: true,
        canManageSettings: true,
        canDeleteData: false
      },
      moderator: {
        canManageUsers: false,
        canManageLineOA: false,
        canViewAllChats: true,
        canManageSettings: false,
        canDeleteData: false
      },
      user: {
        canManageUsers: false,
        canManageLineOA: false,
        canViewAllChats: false,
        canManageSettings: false,
        canDeleteData: false
      }
    };
    
    return permissions[role] || permissions.user;
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Admin endpoints
  async getUsers() {
    return this.request('/admin/users');
  }

  async getUserById(userId) {
    return this.request(`/admin/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // LINE OA endpoints
  async getLineOAs() {
    return this.request('/lineoa');
  }

  async createLineOA(data) {
    return this.request('/lineoa', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateLineOA(id, data) {
    return this.request(`/lineoa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteLineOA(id) {
    return this.request(`/lineoa/${id}`, {
      method: 'DELETE'
    });
  }

  // Customer endpoints
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers?${queryString}`);
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE'
    });
  }

  // Message endpoints
  async getMessages(customerId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/messages/customer/${customerId}?${queryString}`);
  }

  async sendMessage(data) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async markMessagesAsRead(customerId) {
    return this.request(`/messages/mark-read/${customerId}`, {
      method: 'PUT'
    });
  }

  // Settings endpoints
  async getSettings() {
    return this.request('/settings');
  }

  async getSettingsByCategory(category) {
    return this.request(`/settings/category/${category}`);
  }

  async updateSetting(key, data) {
    return this.request(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateSettingsBulk(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  }
}

// Global API client instance
const api = new APIClient();
