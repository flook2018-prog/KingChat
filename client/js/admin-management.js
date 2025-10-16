// Admin Management JavaScript - UTF-8 Encoded
console.log('🚀 Loading Admin Management System...');

// Configuration
const API_BASE_URL = 'https://kingchat.up.railway.app/api';
let admins = [];
let selectedAdminId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM Content Loaded');
    initializeAdminPage();
});

async function initializeAdminPage() {
    try {
        console.log('🔄 Initializing Admin Page...');
        
        // Load admins from database
        await loadAdmins();
        
        // Setup form submission
        const adminForm = document.getElementById('adminForm');
        if (adminForm) {
            adminForm.addEventListener('submit', handleFormSubmit);
        }
        
        console.log('✅ Admin page initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing admin page:', error);
        showError('เกิดข้อผิดพลาดในการเริ่มต้นระบบ: ' + error.message);
    }
}

// Load admins from API
async function loadAdmins() {
    try {
        console.log('🔄 Loading admins from API...');
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        // Handle different response formats
        if (result.success && result.users) {
            admins = result.users;
        } else if (result.success && result.admins) {
            admins = result.admins;
        } else if (Array.isArray(result)) {
            admins = result;
        } else {
            console.warn('⚠️ Unexpected API response format:', result);
            admins = [];
        }
        
        console.log('📊 Loaded admins:', admins.length);
        displayAdmins(admins);
        showLoading(false);
        
    } catch (error) {
        console.error('❌ Error loading admins:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูลแอดมิน: ' + error.message);
        showLoading(false);
        
        // Show error in admin list
        const container = document.getElementById('adminsList');
        if (container) {
            container.innerHTML = `
                <div class="admin-item">
                    <div class="admin-avatar" style="background: #dc3545;">❌</div>
                    <div class="admin-info">
                        <div class="admin-name">เกิดข้อผิดพลาด</div>
                        <div class="admin-details">
                            <span style="color: #dc3545;">${error.message}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Display admins in sidebar
function displayAdmins(adminList) {
    const container = document.getElementById('adminsList');
    
    if (!container) {
        console.error('❌ adminsList container not found');
        return;
    }
    
    if (!adminList || !Array.isArray(adminList) || adminList.length === 0) {
        container.innerHTML = `
            <div class="admin-item">
                <div class="admin-avatar">👥</div>
                <div class="admin-info">
                    <div class="admin-name">ไม่พบข้อมูลแอดมิน</div>
                    <div class="admin-details">
                        <span>กดปุ่มเพิ่มแอดมินใหม่เพื่อเริ่มต้น</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    console.log('🖥️ Displaying', adminList.length, 'admins');
    container.innerHTML = '';
    
    adminList.forEach(admin => {
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        adminItem.onclick = () => selectAdmin(admin.id);
        
        const roleClass = admin.role === 'super_admin' ? 'super-admin' : '';
        const roleText = admin.role === 'super_admin' ? 'Super Admin' : 'Admin';
        const initial = admin.fullName ? admin.fullName.charAt(0).toUpperCase() : admin.username.charAt(0).toUpperCase();
        
        adminItem.innerHTML = `
            <div class="admin-avatar ${roleClass}">${initial}</div>
            <div class="admin-info">
                <div class="admin-name">${admin.fullName || admin.username}</div>
                <div class="admin-details">
                    <span class="admin-role ${roleClass}">${roleText}</span>
                    <span>@${admin.username}</span>
                </div>
            </div>
            <div class="admin-status"></div>
        `;
        
        container.appendChild(adminItem);
    });
}

// Select admin for editing
function selectAdmin(adminId) {
    selectedAdminId = adminId;
    const admin = admins.find(a => a.id === adminId);
    
    if (admin) {
        populateForm(admin);
        highlightSelectedAdmin(adminId);
    }
}

// Populate form with admin data
function populateForm(admin) {
    const form = document.getElementById('adminForm');
    if (!form) return;
    
    const elements = form.elements;
    if (elements.username) elements.username.value = admin.username || '';
    if (elements.email) elements.email.value = admin.email || '';
    if (elements.role) elements.role.value = admin.role || 'admin';
    if (elements.fullName) elements.fullName.value = admin.fullName || '';
    
    // Clear password field when editing
    if (elements.password) elements.password.value = '';
    if (elements.confirmPassword) elements.confirmPassword.value = '';
}

// Highlight selected admin
function highlightSelectedAdmin(adminId) {
    const items = document.querySelectorAll('.admin-item');
    items.forEach(item => item.classList.remove('selected'));
    
    const selectedItem = document.querySelector(`[onclick*="${adminId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const adminData = {
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role'),
        fullName: formData.get('fullName')
    };
    
    // Add password only for new admins or when password is provided
    const password = formData.get('password');
    if (password && password.trim()) {
        adminData.password = password;
    }
    
    try {
        showLoading(true);
        
        let response;
        if (selectedAdminId) {
            // Update existing admin
            response = await fetch(`${API_BASE_URL}/admin/users/${selectedAdminId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminData)
            });
        } else {
            // Create new admin
            if (!password) {
                throw new Error('กรุณาระบุรหัสผ่านสำหรับแอดมินใหม่');
            }
            
            response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'เกิดข้อผิดพลาด');
        }
        
        const result = await response.json();
        console.log('✅ Save successful:', result);
        
        showSuccess(selectedAdminId ? 'อัปเดตแอดมินสำเร็จ' : 'สร้างแอดมินใหม่สำเร็จ');
        
        // Reset form and reload data
        event.target.reset();
        selectedAdminId = null;
        await loadAdmins();
        
    } catch (error) {
        console.error('❌ Error saving admin:', error);
        showError('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Delete admin
async function deleteAdmin(adminId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบแอดมินนี้?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/admin/users/${adminId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'เกิดข้อผิดพลาด');
        }
        
        showSuccess('ลบแอดมินสำเร็จ');
        
        // Reset selection and reload
        selectedAdminId = null;
        document.getElementById('adminForm').reset();
        await loadAdmins();
        
    } catch (error) {
        console.error('❌ Error deleting admin:', error);
        showError('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

// Show success message
function showSuccess(message) {
    console.log('✅', message);
    // You can implement a toast notification here
    alert(message);
}

// Show error message
function showError(message) {
    console.error('❌', message);
    // You can implement a toast notification here
    alert(message);
}

// Add new admin button handler
function addNewAdmin() {
    selectedAdminId = null;
    document.getElementById('adminForm').reset();
    
    // Clear selection highlight
    const items = document.querySelectorAll('.admin-item');
    items.forEach(item => item.classList.remove('selected'));
}

console.log('📝 Admin management script loaded successfully');