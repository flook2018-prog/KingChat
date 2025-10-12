// KingChat Menu System
// ระบบเมนูสำหรับทุกหน้าของ KingChat

class KingChatMenu {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    getCurrentUser() {
        // รองรับ multiple user data keys
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
        
        this.currentUser = this.getCurrentUser(); // refresh user data
        
        if (!token || !this.currentUser || (!this.currentUser.username && !this.currentUser.name)) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    init() {
        if (!this.checkAuth()) return;
        this.loadTheme();
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
                <button class="theme-toggle" onclick="KingChatMenuInstance.toggleTheme()" title="เปิด/ปิดไฟ">
                    💡 <span id="themeText">ไฟ</span>
                </button>
            </div>
            
            <div class="nav-user">
                <div class="user-info">
                    <span class="user-name">สวัสดี, <span id="userName">${this.currentUser?.username || this.currentUser?.name || 'Admin'}</span></span>
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
        return 'chat'; // default เป็น chat (ไม่มี dashboard แล้ว)
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

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        // อัพเดทข้อความบนปุ่ม
        const themeText = document.getElementById('themeText');
        if (themeText) {
            themeText.textContent = isDark ? 'มืด' : 'ไฟ';
        }
        
        // บันทึกการตั้งค่า
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            const themeText = document.getElementById('themeText');
            if (themeText) {
                themeText.textContent = 'มืด';
            }
        }
    }

    // ฟังก์ชันสำหรับเพิ่ม CSS styles
    addStyles() {
        if (document.getElementById('kingchat-menu-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'kingchat-menu-styles';
        styles.textContent = `
            /* KingChat Menu Styles */
            body {
                transition: background-color 0.3s ease, color 0.3s ease;
            }

            body.dark-mode {
                background: #1a1a1a !important;
                color: #ffffff !important;
            }

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
                transition: all 0.3s ease;
            }

            body.dark-mode .top-nav {
                background: rgba(30, 30, 30, 0.95);
                border-bottom-color: rgba(255, 255, 255, 0.1);
            }

            .nav-brand {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 700;
                font-size: 24px;
                color: #2d3748;
                transition: color 0.3s ease;
            }

            body.dark-mode .nav-brand {
                color: white;
            }

            .brand-logo {
                font-size: 28px;
            }

            .theme-toggle {
                background: #667eea;
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: 20px;
            }

            .theme-toggle:hover {
                background: #5a6fd8;
                transform: scale(1.05);
            }

            body.dark-mode .theme-toggle {
                background: #ffa500;
            }

            body.dark-mode .theme-toggle:hover {
                background: #ff8c00;
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
                transition: color 0.3s ease;
            }

            body.dark-mode .user-name {
                color: white;
            }

            .user-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #06C755;
                margin-top: 4px;
                justify-content: flex-end;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                background: #06C755;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .btn-logout {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                border: none;
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-logout:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
            }

            .sidebar {
                position: fixed;
                left: 0;
                top: 80px;
                width: 260px;
                height: calc(100vh - 80px);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-right: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 8px 0 32px rgba(0, 0, 0, 0.1);
                padding: 20px 0;
                z-index: 999;
                transition: all 0.3s ease;
            }

            body.dark-mode .sidebar {
                background: rgba(30, 30, 30, 0.95);
                border-right-color: rgba(255, 255, 255, 0.1);
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

            body.dark-mode .menu-item {
                color: #ccc;
            }

            .menu-item:hover {
                background: rgba(102, 126, 234, 0.1);
                border-left-color: #667eea;
                color: #667eea;
            }

            body.dark-mode .menu-item:hover {
                background: rgba(102, 126, 234, 0.2);
                color: #667eea;
            }

            .menu-item.active {
                background: rgba(102, 126, 234, 0.15);
                border-left-color: #667eea;
                color: #667eea;
                font-weight: 600;
            }

            body.dark-mode .menu-item.active {
                background: rgba(102, 126, 234, 0.25);
            }

            .menu-item i {
                font-size: 20px;
                font-style: normal;
            }

            /* Main content adjustment */
            .main-content, .chat-container, .admin-content {
                margin-left: 260px;
                margin-top: 80px;
                transition: all 0.3s ease;
            }

            /* Dark mode for common elements */
            body.dark-mode .page-header,
            body.dark-mode .admin-table-container,
            body.dark-mode .rank-card,
            body.dark-mode .modal-content {
                background: #2d2d2d !important;
                color: white !important;
            }

            body.dark-mode .admin-table th {
                background: #333 !important;
                color: #fff !important;
            }

            body.dark-mode .admin-table tbody tr:hover {
                background: #3a3a3a !important;
            }

            body.dark-mode .form-control {
                background: #3a3a3a !important;
                border-color: #555 !important;
                color: white !important;
            }

            @media (max-width: 768px) {
                .main-content, .chat-container, .admin-content {
                    margin-left: 0;
                }
                
                .sidebar {
                    transform: translateX(-100%);
                }
                
                .sidebar.open {
                    transform: translateX(0);
                }
            }
        `;
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