/**
 * Role Manager - Frontend Role-Based Access Control
 * จัดการสิทธิ์การเข้าถึงบน Frontend ตามบทบาทผู้ใช้
 */

class RoleManager {
    constructor() {
        this.currentUser = null;
        this.permissions = [];
        this.roleLevel = 0;
        this.isInitialized = false;
    }

    // กำหนดสิทธิ์ตามบทบาท (ตรงกับ Backend)
    static ROLE_PERMISSIONS = {
        'super_admin': {
            level: 100,
            permissions: [
                'manage_users',
                'manage_system', 
                'manage_chat',
                'manage_lineoa',
                'manage_customers',
                'manage_quick_messages',
                'view_all_data',
                'system_settings',
                'admin_management'
            ]
        },
        'admin': {
            level: 80,
            permissions: [
                'manage_chat',
                'manage_lineoa',
                'manage_customers', 
                'manage_quick_messages',
                'view_customer_data'
            ]
        },
        'moderator': {
            level: 60,
            permissions: [
                'manage_chat',
                'view_customer_data'
            ]
        },
        'user': {
            level: 40,
            permissions: [
                'view_chat',
                'basic_access'
            ]
        }
    };

    // เริ่มต้นระบบสิทธิ์
    async initialize() {
        try {
            console.log('🔐 Initializing Role Manager...');
            
            // ดึงข้อมูลผู้ใช้จาก API
            await this.fetchUserRole();
            
            // ซ่อน/แสดงองค์ประกอบตามสิทธิ์
            this.applyPermissions();
            
            this.isInitialized = true;
            console.log('✅ Role Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Role Manager initialization failed:', error);
            // ใช้สิทธิ์พื้นฐานสำหรับกรณีที่เกิดข้อผิดพลาด
            this.setFallbackPermissions();
        }
    }

    // ดึงข้อมูลสิทธิ์ผู้ใช้จาก Backend
    async fetchUserRole() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/roles/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.permissions = data.user.permissions || [];
                this.roleLevel = data.user.level || 0;
                
                console.log(`👤 User: ${this.currentUser.username} (${this.currentUser.role})`);
                console.log(`🎯 Permissions:`, this.permissions);
                console.log(`📊 Level: ${this.roleLevel}`);
            } else {
                throw new Error('Failed to fetch user role data');
            }

        } catch (error) {
            console.error('❌ Error fetching user role:', error);
            throw error;
        }
    }

    // ตั้งค่าสิทธิ์พื้นฐานสำหรับกรณีฉุกเฉิน
    setFallbackPermissions() {
        console.log('⚠️ Using fallback permissions');
        this.currentUser = { 
            username: 'Guest', 
            role: 'user',
            level: 40
        };
        this.permissions = ['basic_access'];
        this.roleLevel = 40;
        this.applyPermissions();
    }

    // ตรวจสอบว่ามีสิทธิ์เฉพาะหรือไม่
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    // ตรวจสอบระดับสิทธิ์
    hasLevel(requiredLevel) {
        return this.roleLevel >= requiredLevel;
    }

    // ตรวจสอบบทบาท
    hasRole(role) {
        return this.currentUser?.role === role;
    }

    // ตรวจสอบหลายบทบาท
    hasAnyRole(roles) {
        return roles.includes(this.currentUser?.role);
    }

    // ซ่อน/แสดงองค์ประกอบตามสิทธิ์
    applyPermissions() {
        console.log('🎭 Applying role-based permissions to UI...');

        // ซ่อนองค์ประกอบตาม data-permission
        this.hideElementsByPermission();
        
        // ซ่อนองค์ประกอบตาม data-role
        this.hideElementsByRole();
        
        // ซ่อนองค์ประกอบตาม data-level
        this.hideElementsByLevel();

        // อัปเดต UI ตามสิทธิ์
        this.updateUIElements();
    }

    // ซ่อนองค์ประกอบตาม data-permission
    hideElementsByPermission() {
        const elements = document.querySelectorAll('[data-permission]');
        elements.forEach(element => {
            const requiredPermission = element.getAttribute('data-permission');
            if (!this.hasPermission(requiredPermission)) {
                element.style.display = 'none';
                console.log(`🚫 Hidden element requiring permission: ${requiredPermission}`);
            } else {
                element.style.display = '';
                console.log(`✅ Shown element with permission: ${requiredPermission}`);
            }
        });
    }

    // ซ่อนองค์ประกอบตาม data-role
    hideElementsByRole() {
        const elements = document.querySelectorAll('[data-role]');
        elements.forEach(element => {
            const requiredRoles = element.getAttribute('data-role').split(',').map(r => r.trim());
            if (!this.hasAnyRole(requiredRoles)) {
                element.style.display = 'none';
                console.log(`🚫 Hidden element requiring role: ${requiredRoles.join(', ')}`);
            } else {
                element.style.display = '';
                console.log(`✅ Shown element with role: ${requiredRoles.join(', ')}`);
            }
        });
    }

    // ซ่อนองค์ประกอบตาม data-level
    hideElementsByLevel() {
        const elements = document.querySelectorAll('[data-level]');
        elements.forEach(element => {
            const requiredLevel = parseInt(element.getAttribute('data-level'));
            if (!this.hasLevel(requiredLevel)) {
                element.style.display = 'none';
                console.log(`🚫 Hidden element requiring level: ${requiredLevel}`);
            } else {
                element.style.display = '';
                console.log(`✅ Shown element with level: ${requiredLevel}`);
            }
        });
    }

    // อัปเดต UI elements เฉพาะ
    updateUIElements() {
        // อัปเดตข้อมูลผู้ใช้ใน navbar
        this.updateUserInfo();
        
        // อัปเดตเมนู
        this.updateNavigationMenu();
        
        // อัปเดตปุ่มและฟังก์ชัน
        this.updateActionButtons();
    }

    // อัปเดตข้อมูลผู้ใช้
    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.username;
        }
        
        if (userRoleElement && this.currentUser) {
            userRoleElement.textContent = this.getRoleDisplayName(this.currentUser.role);
        }
    }

    // อัปเดตเมนูนำทาง
    updateNavigationMenu() {
        // ซ่อน/แสดงลิงก์เมนูตามสิทธิ์
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page && !this.canAccessPage(page)) {
                item.style.display = 'none';
            }
        });
    }

    // อัปเดตปุ่มการทำงาน
    updateActionButtons() {
        // เปิด/ปิดปุ่มตามสิทธิ์
        const buttons = document.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            const action = button.getAttribute('data-action');
            if (!this.canPerformAction(action)) {
                button.disabled = true;
                button.title = 'คุณไม่มีสิทธิ์ในการทำงานนี้';
            }
        });
    }

    // ตรวจสอบว่าสามารถเข้าถึงหน้าได้หรือไม่
    canAccessPage(page) {
        const pagePermissions = {
            'admin': ['admin_management'],
            'settings': ['system_settings'],
            'quick-messages': ['manage_quick_messages'],
            'customers': ['manage_customers', 'view_customer_data'],
            'chat': ['manage_chat', 'view_chat'],
            'accounts': ['manage_lineoa']
        };

        const requiredPermissions = pagePermissions[page];
        if (!requiredPermissions) return true; // หน้าที่ไม่ต้องการสิทธิ์พิเศษ

        return requiredPermissions.some(permission => this.hasPermission(permission));
    }

    // ตรวจสอบว่าสามารถทำการกระทำได้หรือไม่
    canPerformAction(action) {
        const actionPermissions = {
            'create-user': ['manage_users'],
            'delete-user': ['manage_users'],
            'edit-customer': ['manage_customers'],
            'send-message': ['manage_chat'],
            'manage-lineoa': ['manage_lineoa'],
            'system-config': ['system_settings']
        };

        const requiredPermissions = actionPermissions[action];
        if (!requiredPermissions) return true;

        return requiredPermissions.some(permission => this.hasPermission(permission));
    }

    // แปลชื่อบทบาทเป็นภาษาไทย
    getRoleDisplayName(role) {
        const roleNames = {
            'super_admin': 'ซุปเปอร์แอดมิน',
            'admin': 'แอดมิน',
            'moderator': 'โมเดอเรเตอร์',
            'user': 'ผู้ใช้'
        };
        return roleNames[role] || role;
    }

    // รีเฟรชสิทธิ์ (สำหรับกรณีที่มีการเปลี่ยนแปลง)
    async refresh() {
        console.log('🔄 Refreshing role permissions...');
        await this.initialize();
    }

    // ดีบัก - แสดงข้อมูลสิทธิ์ทั้งหมด
    debug() {
        console.log('🔍 Role Manager Debug Info:');
        console.log('Current User:', this.currentUser);
        console.log('Permissions:', this.permissions);
        console.log('Role Level:', this.roleLevel);
        console.log('Is Initialized:', this.isInitialized);
    }
}

// สร้าง instance สำหรับใช้งาน
window.roleManager = new RoleManager();

// Auto-initialize เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    // รอสักครู่แล้วค่อย initialize เพื่อให้ token ถูกตั้งค่าแล้ว
    setTimeout(() => {
        window.roleManager.initialize();
    }, 500);
});

// Export สำหรับใช้ใน modules อื่น
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleManager;
}