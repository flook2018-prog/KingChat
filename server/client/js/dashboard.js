// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Wait for auth to be available
  if (!window.auth) {
    console.error('Auth manager not available');
    window.location.href = '/login.html';
    return;
  }

  // Require authentication
  if (!window.auth.requireAuth()) {
    return;
  }

  console.log('Dashboard loaded for user:', window.auth.user);

  // Initialize dashboard
  initializeDashboard();
  loadDashboardData();
  setupEventListeners();

  function initializeDashboard() {
    // Update user display name
    const userDisplayName = document.getElementById('userDisplayName');
    if (userDisplayName && window.auth.user) {
      userDisplayName.textContent = window.auth.user.displayName || window.auth.user.username;
    }

    // Show admin menu if user is admin
    const adminMenu = document.querySelector('.admin-only');
    if (adminMenu && window.auth.hasRole('admin')) {
      adminMenu.style.display = 'block';
    }

    // Update user avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar && window.auth.user && window.auth.user.avatar) {
      userAvatar.textContent = window.auth.user.avatar;
    }
  }

  async function loadDashboardData() {
    try {
      // Load statistics
      await Promise.all([
        loadStats(),
        loadRecentMessages(),
        loadNewCustomers(),
        loadLineOAStatus()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async function loadStats() {
    try {
      // Ensure API is available
      if (!window.api) {
        window.api = new APIClient();
      }
      
      // Load LINE OA count
      const lineOAs = await window.api.getLineOAs();
      document.getElementById('totalLineOA').textContent = lineOAs.length;

      // Load customer count
      const customers = await api.getCustomers({ limit: 1 });
      document.getElementById('totalCustomers').textContent = customers.total || 0;

      // For now, use placeholder data for messages and online customers
      document.getElementById('totalMessages').textContent = '0';
      document.getElementById('onlineCustomers').textContent = '0';
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadRecentMessages() {
    const container = document.getElementById('recentMessages');
    try {
      // Placeholder for recent messages
      container.innerHTML = `
        <div class="message-item">
          <div class="message-avatar">👤</div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-name">ลูกค้าใหม่</span>
              <span class="message-time">ไม่มีข้อความ</span>
            </div>
            <div class="message-text">ยังไม่มีข้อความในระบบ</div>
          </div>
        </div>
      `;
    } catch (error) {
      container.innerHTML = '<div class="error">ไม่สามารถโหลดข้อความล่าสุดได้</div>';
    }
  }

  async function loadNewCustomers() {
    const container = document.getElementById('newCustomers');
    try {
      const response = await api.getCustomers({ limit: 5 });
      
      if (response.customers && response.customers.length > 0) {
        container.innerHTML = response.customers.map(customer => `
          <div class="customer-item">
            <div class="customer-avatar">${customer.avatar || '👤'}</div>
            <div class="customer-info">
              <div class="customer-name">${customer.displayName}</div>
              <div class="customer-time">${formatDate(customer.createdAt)}</div>
            </div>
          </div>
        `).join('');
      } else {
        container.innerHTML = '<div class="empty">ยังไม่มีลูกค้าในระบบ</div>';
      }
    } catch (error) {
      container.innerHTML = '<div class="error">ไม่สามารถโหลดข้อมูลลูกค้าได้</div>';
    }
  }

  async function loadLineOAStatus() {
    const container = document.getElementById('lineOAStatus');
    try {
      const lineOAs = await api.getLineOAs();
      
      if (lineOAs.length > 0) {
        container.innerHTML = lineOAs.map(account => `
          <div class="lineoa-item">
            <div class="lineoa-avatar">${account.avatar || '📱'}</div>
            <div class="lineoa-info">
              <div class="lineoa-name">${account.name}</div>
              <div class="lineoa-status ${account.connectionStatus}">
                ${getStatusText(account.connectionStatus)}
              </div>
            </div>
          </div>
        `).join('');
      } else {
        container.innerHTML = `
          <div class="empty">
            <p>ยังไม่มีบัญชี LINE OA</p>
            <a href="pages/lineoa.html" class="btn btn-primary btn-sm">เพิ่มบัญชี</a>
          </div>
        `;
      }
    } catch (error) {
      container.innerHTML = '<div class="error">ไม่สามารถโหลดสถานะ LINE OA ได้</div>';
    }
  }

  function setupEventListeners() {
    // User menu toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', function() {
        userDropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.remove('show');
        }
      });
    }

    // Auto refresh data every 30 seconds
    setInterval(loadDashboardData, 30000);
  }

  // Utility functions
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} วันที่แล้ว`;
    if (hours > 0) return `${hours} ชั่วโมงที่แล้ว`;
    if (minutes > 0) return `${minutes} นาทีที่แล้ว`;
    return 'เมื่อสักครู่';
  }

  function getStatusText(status) {
    const statusMap = {
      'connected': 'เชื่อมต่อแล้ว',
      'disconnected': 'ไม่ได้เชื่อมต่อ',
      'error': 'เกิดข้อผิดพลาด'
    };
    return statusMap[status] || 'ไม่ทราบสถานะ';
  }
});

// Global logout function
function logout() {
  auth.logout();
  window.location.href = 'login.html';
}
