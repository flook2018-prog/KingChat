// Simple Admin Management JavaScript - Fixed for Railway deployment
class AdminManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentSearch = '';
        this.currentRole = '';
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Admin Manager...');
        
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No token found, redirecting to login');
            window.location.href = '../login.html';
            return;
        }

        // Get current user info
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
                console.log('✅ Current user loaded:', this.currentUser);
                document.getElementById('userDisplay').textContent = this.currentUser.displayName || this.currentUser.username;
                
                // Check if user has admin permissions
                if (!['admin'].includes(this.currentUser.role)) {
                    this.showAlert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
                    setTimeout(() => window.location.href = '../dashboard.html', 2000);
                    return;
                }
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            console.error('❌ Auth error:', error);
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            return;
        }

        // Initialize event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadAdmins();
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
            });
        }

        // Role filter
        const roleFilter = document.getElementById('roleFilter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.currentRole = e.target.value;
            });
        }

        // Admin form
        const adminForm = document.getElementById('adminForm');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminSubmit();
            });
        }

        // Password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closePasswordModal();
            }
        });
    }

    async loadAdmins() {
        console.log('📥 Loading admins from server...');
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                search: this.currentSearch,
                role: this.currentRole
            });

            console.log('🌐 Fetching:', `/api/admin/admins?${params}`);
            
            const response = await fetch(`/api/admin/admins?${params}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Admins loaded:', data);
            
            this.renderAdmins(data.admins);
            this.renderPagination(data.pagination);
        } catch (error) {
            console.error('❌ Load admins error:', error);
            this.showAlert('ไม่สามารถโหลดข้อมูลแอดมินได้: ' + error.message, 'error');
        }
    }

    renderAdmins(admins) {
        console.log('🎨 Rendering admins:', admins);
        
        const tbody = document.getElementById('adminTableBody');
        if (!tbody) {
            console.error('❌ adminTableBody not found');
            return;
        }

        tbody.innerHTML = '';

        if (!admins || admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">ไม่พบข้อมูลแอดมิน</td></tr>';
            return;
        }

        admins.forEach(admin => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${admin.id}</td>
                <td>${admin.username}</td>
                <td>${admin.email}</td>
                <td>${admin.displayName || '-'}</td>
                <td><span class="role-badge role-${admin.role}">${this.getRoleDisplayName(admin.role)}</span></td>
                <td><span class="status-badge status-${admin.isActive ? 'active' : 'inactive'}">${admin.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span></td>
                <td>${new Date(admin.createdAt).toLocaleDateString('th-TH')}</td>
                <td>
                    <div class="action-buttons">
                        ${this.canManage(admin.role) ? `
                            <button class="btn btn-primary" onclick="adminManager.editAdmin(${admin.id})" title="แก้ไข">
                                ✏️
                            </button>
                            <button class="btn btn-warning" onclick="adminManager.resetPassword(${admin.id})" title="รีเซ็ตรหัสผ่าน">
                                🔑
                            </button>
                            ${admin.id !== this.currentUser.id ? `
                                <button class="btn btn-danger" onclick="adminManager.deleteAdmin(${admin.id}, '${admin.username}')" title="ลบ">
                                    🗑️
                                </button>
                            ` : ''}
                        ` : `
                            <span style="color: #999;">ไม่มีสิทธิ์</span>
                        `}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPagination(pagination) {
        if (!pagination) return;
        
        const container = document.getElementById('paginationContainer');
        if (!container) return;
        
        container.innerHTML = '';

        if (pagination.totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← ก่อนหน้า';
        prevBtn.disabled = pagination.currentPage === 1;
        prevBtn.onclick = () => this.goToPage(pagination.currentPage - 1);
        container.appendChild(prevBtn);

        // Page numbers
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i === pagination.currentPage || 
                i === 1 || 
                i === pagination.totalPages || 
                (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
                
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
                pageBtn.className = i === pagination.currentPage ? 'current-page' : '';
                pageBtn.onclick = () => this.goToPage(i);
                container.appendChild(pageBtn);
            } else if (i === pagination.currentPage - 2 || i === pagination.currentPage + 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '8px';
                container.appendChild(ellipsis);
            }
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'ถัดไป →';
        nextBtn.disabled = pagination.currentPage === pagination.totalPages;
        nextBtn.onclick = () => this.goToPage(pagination.currentPage + 1);
        container.appendChild(nextBtn);

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.style.marginLeft = '20px';
        pageInfo.textContent = `หน้า ${pagination.currentPage} จาก ${pagination.totalPages} (รวม ${pagination.totalItems} รายการ)`;
        container.appendChild(pageInfo);
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadAdmins();
    }

    openCreateModal() {
        if (!this.canCreateAdmin()) {
            this.showAlert('คุณไม่มีสิทธิ์สร้างแอดมินใหม่', 'error');
            return;
        }

        document.getElementById('modalTitle').textContent = 'เพิ่มแอดมินใหม่';
        document.getElementById('adminForm').reset();
        document.getElementById('adminId').value = '';
        
        const passwordGroup = document.getElementById('passwordGroup');
        if (passwordGroup) {
            passwordGroup.style.display = 'block';
        }
        
        const passwordField = document.getElementById('password');
        if (passwordField) {
            passwordField.required = true;
        }
        
        const isActiveField = document.getElementById('isActive');
        if (isActiveField) {
            isActiveField.checked = true;
        }
        
        // Filter roles based on current user permissions
        this.updateRoleOptions();
        
        document.getElementById('adminModal').style.display = 'block';
    }

    async editAdmin(id) {
        try {
            const response = await fetch(`/api/admin/admins/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch admin details');
            }

            const admin = await response.json();

            if (!this.canManage(admin.role)) {
                this.showAlert('คุณไม่มีสิทธิ์แก้ไขแอดมินนี้', 'error');
                return;
            }

            document.getElementById('modalTitle').textContent = 'แก้ไขข้อมูลแอดมิน';
            document.getElementById('adminId').value = admin.id;
            document.getElementById('username').value = admin.username;
            document.getElementById('email').value = admin.email;
            document.getElementById('displayName').value = admin.displayName || '';
            document.getElementById('role').value = admin.role;
            document.getElementById('isActive').checked = admin.isActive;
            
            // Hide password field for editing
            const passwordGroup = document.getElementById('passwordGroup');
            if (passwordGroup) {
                passwordGroup.style.display = 'none';
            }
            
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.required = false;
            }
            
            // Update role options
            this.updateRoleOptions(admin.role);
            
            document.getElementById('adminModal').style.display = 'block';
        } catch (error) {
            console.error('Edit admin error:', error);
            this.showAlert('ไม่สามารถโหลดข้อมูลแอดมินได้', 'error');
        }
    }

    async handleAdminSubmit() {
        const adminId = document.getElementById('adminId').value;
        const isEdit = Boolean(adminId);

        // Validate passwords for new admins
        if (!isEdit) {
            const password = document.getElementById('password').value;
            if (password.length < 6) {
                this.showAlert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
                return;
            }
        }

        const data = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            displayName: document.getElementById('displayName').value,
            role: document.getElementById('role').value,
            isActive: document.getElementById('isActive').checked
        };

        if (!isEdit) {
            data.password = document.getElementById('password').value;
        }

        try {
            const url = isEdit ? `/api/admin/admins/${adminId}` : '/api/admin/admins';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'เกิดข้อผิดพลาด');
            }

            const result = await response.json();
            this.showAlert(result.message, 'success');
            this.closeModal();
            this.loadAdmins();
        } catch (error) {
            console.error('Submit admin error:', error);
            this.showAlert(error.message, 'error');
        }
    }

    resetPassword(id) {
        document.getElementById('resetAdminId').value = id;
        document.getElementById('passwordForm').reset();
        document.getElementById('passwordModal').style.display = 'block';
    }

    async handlePasswordReset() {
        const adminId = document.getElementById('resetAdminId').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            this.showAlert('รหัสผ่านไม่ตรงกัน', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showAlert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/admins/${adminId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'เกิดข้อผิดพลาด');
            }

            const result = await response.json();
            this.showAlert(result.message, 'success');
            this.closePasswordModal();
        } catch (error) {
            console.error('Reset password error:', error);
            this.showAlert(error.message, 'error');
        }
    }

    async deleteAdmin(id, username) {
        if (id === this.currentUser.id) {
            this.showAlert('ไม่สามารถลบบัญชีของตนเองได้', 'error');
            return;
        }

        if (!confirm(`คุณต้องการลบแอดมิน "${username}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/admins/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'เกิดข้อผิดพลาด');
            }

            const result = await response.json();
            this.showAlert(result.message, 'success');
            this.loadAdmins();
        } catch (error) {
            console.error('Delete admin error:', error);
            this.showAlert(error.message, 'error');
        }
    }

    updateRoleOptions(currentRole = null) {
        const roleSelect = document.getElementById('role');
        if (!roleSelect) return;
        
        const options = roleSelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === '') return; // Keep empty option
            
            const targetRole = option.value;
            const canAssign = this.canAssignRole(targetRole);
            
            option.disabled = !canAssign;
            if (!canAssign && targetRole !== currentRole) {
                option.style.display = 'none';
            } else {
                option.style.display = 'block';
            }
        });
    }

    canCreateAdmin() {
        return ['admin'].includes(this.currentUser?.role);
    }

    canManage(targetRole) {
        if (!this.currentUser) return false;
        
        const levels = {
            'admin': 5,
            'manager': 4,
            'agent': 3,
            'supervisor': 2,
            'viewer': 1
        };
        
        return levels[this.currentUser.role] > levels[targetRole];
    }

    canAssignRole(targetRole) {
        return this.canManage(targetRole);
    }

    getRoleDisplayName(role) {
        const names = {
            'admin': 'Admin', 
            'manager': 'Manager',
            'agent': 'Agent',
            'supervisor': 'Supervisor',
            'viewer': 'Viewer'
        };
        return names[role] || role;
    }

    closeModal() {
        document.getElementById('adminModal').style.display = 'none';
    }

    closePasswordModal() {
        document.getElementById('passwordModal').style.display = 'none';
    }

    showAlert(message, type = 'info') {
        console.log(`🔔 Alert (${type}): ${message}`);
        
        const container = document.getElementById('alertContainer');
        if (!container) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        container.innerHTML = '';
        container.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Global functions for inline event handlers
function openCreateModal() {
    if (window.adminManager) {
        adminManager.openCreateModal();
    }
}

function loadAdmins() {
    if (window.adminManager) {
        adminManager.loadAdmins();
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '../login.html';
}

// Initialize admin manager when DOM is ready
let adminManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM Content Loaded - Initializing AdminManager');
    adminManager = new AdminManager();
    window.adminManager = adminManager; // Make it globally accessible
});