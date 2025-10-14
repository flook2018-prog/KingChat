// KingChat Menu System - Fixed Version
class KingChatMenu {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    getCurrentUser() {
        let userData = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') ||
                      localStorage.getItem('userData') || sessionStorage.getItem('userData') ||
                      localStorage.getItem('user') || sessionStorage.getItem('user');
        
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                console.error('Error parsing user data:', e);
                return null;
            }
        }
        return null;
    }

    checkAuth() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 
                     localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        this.currentUser = this.getCurrentUser();
        
        if (!token || !this.currentUser || (!this.currentUser.username && !this.currentUser.name)) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    init() {
        if (!this.checkAuth()) return;
        this.loadStyles();
        this.createTopNavbar();
        this.createSidebar();
        this.updateUserInfo();
    }

    loadStyles() {
        const css = `
            .top-nav {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 80px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 30px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .nav-brand {
                font-size: 24px;
                font-weight: 700;
            }

            .nav-user {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .sidebar {
                position: fixed;
                left: 0;
                top: 80px;
                width: 260px;
                height: calc(100vh - 80px);
                background: white;
                border-right: 1px solid #e9ecef;
                z-index: 999;
                display: flex;
                flex-direction: column;
                box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            }

            .menu-item {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                color: #374151;
                text-decoration: none;
                border-left: 3px solid transparent;
                transition: all 0.3s ease;
                gap: 12px;
            }

            .menu-item:hover {
                background: #f8f9fa;
                color: #667eea;
            }

            .menu-item.active {
                background: rgba(102, 126, 234, 0.15);
                border-left-color: #667eea;
                color: #667eea;
            }

            .menu-item i {
                font-size: 20px;
                width: 24px;
                text-align: center;
            }

            .logout-btn {
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }

            .logout-btn:hover {
                background: #c82333;
            }
        `;

        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    createTopNavbar() {
        const existingNav = document.querySelector('.top-nav');
        if (existingNav) existingNav.remove();

        const navbar = document.createElement('nav');
        navbar.className = 'top-nav';
        navbar.innerHTML = `
            <div class="nav-brand">👑 KingChat</div>
            <div class="nav-user">
                <span id="userName">Loading...</span>
                <button class="logout-btn" onclick="kingChatMenu.logout()">ออกจากระบบ</button>
            </div>
        `;
        document.body.appendChild(navbar);
    }

    createSidebar() {
        const existingSidebar = document.querySelector('.sidebar');
        if (existingSidebar) existingSidebar.remove();

        const currentPage = this.getCurrentPage();
        const sidebar = document.createElement('nav');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <a href="chat.html" class="menu-item ${currentPage === 'chat' ? 'active' : ''}">
                <i>💬</i>
                <span>แชท</span>
            </a>
            <a href="accounts-working.html" class="menu-item ${currentPage === 'accounts' ? 'active' : ''}">
                <i>📱</i>
                <span>บัญชี LINE OA</span>
            </a>
            <a href="customers-working.html" class="menu-item ${currentPage === 'customers' ? 'active' : ''}">
                <i>👥</i>
                <span>รายชื่อลูกค้า</span>
            </a>
            <a href="quick-messages-working.html" class="menu-item ${currentPage === 'quick-messages' ? 'active' : ''}">
                <i>⚡</i>
                <span>ข้อความด่วน</span>
            </a>
            <a href="settings-working.html" class="menu-item ${currentPage === 'settings' ? 'active' : ''}">
                <i>⚙️</i>
                <span>ตั้งค่า</span>
            </a>
            <a href="admin-working.html" class="menu-item ${currentPage === 'admin' ? 'active' : ''}">
                <i>👨‍💼</i>
                <span>จัดการแอดมิน</span>
            </a>
        `;
        document.body.appendChild(sidebar);
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('chat')) return 'chat';
        if (path.includes('accounts')) return 'accounts';
        if (path.includes('customers')) return 'customers';
        if (path.includes('quick-messages')) return 'quick-messages';
        if (path.includes('settings')) return 'settings';
        if (path.includes('admin')) return 'admin';
        return 'chat';
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            const displayName = this.currentUser.displayName || this.currentUser.username || this.currentUser.name || 'Unknown User';
            userNameElement.textContent = displayName;
        }
    }

    logout() {
        if (confirm('ต้องการออกจากระบบหรือไม่?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }
}

// Global instance
let kingChatMenu;