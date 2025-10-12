// KingChat Menu System
// ระบบเมนูสำหรับทุกหน้าของ KingChat

class KingChatMenu {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    getCurrentUser() {
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    checkAuth() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token || !this.currentUser) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    init() {
        if (!this.checkAuth()) return;
        this.createTopNavbar();
        this.createSidebar();
        this.updateUserInfo();
    }

    createTopNavbar() {
        // ลบ navbar เก่าถ้ามี
        const existingNav = document.querySelector('.top-nav');
        if (existingNav) existingNav.remove();

        const navbar = document.createElement('div');
        navbar.className = 'top-nav';
        navbar.innerHTML = `
            <div class="nav-brand">
                <span class="brand-logo">👑</span>
                <span>KingChat</span>
            </div>
            
            <div class="nav-user">
                <div class="user-info">
                    <span class="user-name">สวัสดี, <span id="userName">${this.currentUser?.username || 'Loading...'}</span></span>
                    <div class="user-status">
                        <div class="status-dot"></div>
                        ออนไลน์
                    </div>
                </div>
                <button class="btn-logout" onclick="KingChatMenuInstance.logout()">
                    <span>🚪</span>
                    ออกจากระบบ
                </button>
            </div>
        `;

        document.body.insertBefore(navbar, document.body.firstChild);
    }

    createSidebar() {
        // ลบ sidebar เก่าถ้ามี
        const existingSidebar = document.querySelector('.sidebar');
        if (existingSidebar) existingSidebar.remove();

        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        
        const currentPage = this.getCurrentPage();
        
        sidebar.innerHTML = `
            <a href="chat.html" class="menu-item ${currentPage === 'chat' ? 'active' : ''}">
                <i>💬</i>
                <span>แชท</span>
            </a>
            <a href="accounts-working.html" class="menu-item ${currentPage === 'accounts' ? 'active' : ''}">
                <i>📱</i>
                <span>จัดการบัญชี</span>
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
        if (path.includes('quick-messages')) return 'quick-messages';
        if (path.includes('settings')) return 'settings';
        if (path.includes('admin')) return 'admin';
        return 'chat'; // default
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.username;
        }
    }

    logout() {
        if (confirm('ต้องการออกจากระบบหรือไม่?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }

    // ฟังก์ชันสำหรับเพิ่ม CSS styles
    addStyles() {
        if (document.getElementById('kingchat-menu-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'kingchat-menu-styles';
        styles.textContent = `
            /* KingChat Menu Styles */
            .top-nav {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding: 15px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            .nav-brand {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 700;
                font-size: 24px;
                color: #2d3748;
            }

            .brand-logo {
                font-size: 28px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .nav-user {
                display: flex;
                align-items: center;
                gap: 20px;
            }

            .user-info {
                text-align: right;
            }

            .user-name {
                font-weight: 600;
                color: #2d3748;
                font-size: 16px;
            }

            .user-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #28a745;
                margin-top: 4px;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                background: #28a745;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
                100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
            }

            .btn-logout {
                background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-logout:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
            }

            .sidebar {
                position: fixed;
                top: 80px;
                left: 0;
                width: 260px;
                height: calc(100vh - 80px);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-right: 1px solid rgba(255, 255, 255, 0.2);
                padding: 30px 0;
                box-shadow: 8px 0 32px rgba(0, 0, 0, 0.1);
                overflow-y: auto;
                z-index: 999;
            }

            .menu-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 30px;
                color: #4a5568;
                text-decoration: none;
                transition: all 0.3s ease;
                border-left: 4px solid transparent;
                font-weight: 500;
            }

            .menu-item:hover {
                background: rgba(102, 126, 234, 0.1);
                border-left-color: #667eea;
                color: #667eea;
            }

            .menu-item.active {
                background: rgba(102, 126, 234, 0.15);
                border-left-color: #667eea;
                color: #667eea;
                font-weight: 600;
            }

            .menu-item i {
                font-size: 20px;
                width: 24px;
                text-align: center;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                }

                .sidebar.open {
                    transform: translateX(0);
                }
            }

            /* Main content offset */
            .main-content, .chat-container {
                margin-left: 260px;
                margin-top: 80px;
                min-height: calc(100vh - 80px);
            }

            @media (max-width: 768px) {
                .main-content, .chat-container {
                    margin-left: 0;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Auto initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // เพิ่ม styles ก่อน
    const menu = new KingChatMenu();
    menu.addStyles();
    
    // เก็บ instance ไว้ใช้งาน
    window.KingChatMenuInstance = menu;
});

// Export for use in other scripts
window.KingChatMenu = KingChatMenu;