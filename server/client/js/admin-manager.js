// Admin Management System - Prevent duplicate declarations
(function() {
    'use strict';
    
    // Check if AdminManager already exists
    if (window.AdminManager) {
        console.log('AdminManager already exists, skipping redefinition');
        return;
    }
    
    window.AdminManager = class AdminManager {
        constructor() {
            console.log('AdminManager constructor called');
            this.admins = [];
            this.filteredAdmins = [];
            console.log('📥 Loading stored admins in constructor...');
            
            // Initialize with async loading
            this.initializeAsync();
        }
    
    async initializeAsync() {
        try {
            console.log('🚀 Starting async initialization...');
            
            // Clear old localStorage data if it exists to force server reload
            const storedData = localStorage.getItem('kingchat_admin_users');
            if (storedData) {
                console.log('🧹 Clearing old localStorage to force server sync...');
                localStorage.removeItem('kingchat_admin_users');
                localStorage.removeItem('kingchat_last_sync');
                localStorage.removeItem('kingchat_server_sync');
            }
            
            await this.loadStoredAdmins(); // Now async
            console.log('After loading - Total admins:', this.admins.length);
            console.log('Current admins after loading:', this.admins.map(u => ({ 
                id: u.id, username: u.username, displayName: u.displayName, role: u.role 
            })));
            this.init();
        } catch (error) {
            console.error('Error in async initialization:', error);
            this.init(); // Continue even if loading fails
        }
    }

    // Load admins from server (primary) and localStorage (fallback)
    async loadStoredAdmins() {
        console.log('📥 Loading admins from MongoDB...');
        
        // Always try MongoDB via server first
        let serverSuccess = false;
        try {
            console.log('🌐 Loading from MongoDB via server...');
            
            const testResponse = await fetch('http://localhost:5001/api/admin/admin-users');
            console.log('MongoDB server response status:', testResponse.status);
            
            if (testResponse.ok) {
                const serverData = await testResponse.json();
                console.log('✅ MongoDB response:', serverData);
                
                if (serverData && serverData.users && Array.isArray(serverData.users)) {
                    console.log('✅ Loaded from MongoDB:', serverData.users.length, 'admins');
                    console.log('MongoDB admins:', serverData.users.map(u => ({ 
                        id: u.id, username: u.username, displayName: u.displayName, role: u.role 
                    })));
                    this.admins = serverData.users;
                    this.filteredAdmins = [...this.admins];
                    
                    // Update localStorage with MongoDB data as backup
                    localStorage.setItem('kingchat_admin_users', JSON.stringify(this.admins));
                    localStorage.setItem('kingchat_last_sync', new Date().toISOString());
                    localStorage.setItem('kingchat_data_source', 'mongodb');
                    console.log('📱 Updated localStorage backup with MongoDB data');
                    
                    serverSuccess = true;
                    this._dataLoaded = true;
                    this._dataSource = 'mongodb';
                    
                    // Force render after loading from MongoDB
                    setTimeout(() => this.renderAdmins(), 100);
                    return;
                } else {
                    console.warn('⚠️ Invalid MongoDB response structure');
                }
            } else {
                console.warn('⚠️ MongoDB server responded with status:', testResponse.status);
            }
        } catch (serverError) {
            console.warn('⚠️ MongoDB connection failed:', serverError.message);
        }
        
        // Fallback to localStorage if MongoDB fails
        if (!serverSuccess) {
            console.log('📱 MongoDB failed, falling back to localStorage...');
            try {
                const stored = localStorage.getItem('kingchat_admin_users');
                console.log('Raw localStorage data:', stored);
                
                if (stored && stored !== 'null' && stored !== 'undefined') {
                    const parsedData = JSON.parse(stored);
                    console.log('Parsed localStorage data:', parsedData);
                    console.log('Number of users in localStorage:', parsedData.length);
                    
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        // FORCE ASSIGN - don't filter or validate
                        this.admins = parsedData;
                        this.filteredAdmins = parsedData; // Same reference, no spread
                        
                        console.log('✅ FORCED assignment from localStorage:', this.admins.length, 'admins');
                        console.log('this.admins contents:', this.admins);
                        console.log('this.filteredAdmins contents:', this.filteredAdmins);
                        
                        this._dataSource = 'localStorage_fallback';
                        
                        // Force render immediately
                        setTimeout(() => {
                            console.log('🔄 Force rendering admins...');
                            this.renderAdmins();
                        }, 200);
                        
                    } else {
                        console.log('📋 No valid admin data in localStorage');
                        this.admins = [];
                        this.filteredAdmins = [];
                        this._dataSource = 'empty';
                    }
                } else {
                    console.log('📋 No localStorage backup found');
                    this.admins = [];
                    this.filteredAdmins = [];
                    this._dataSource = 'empty';
                }
            } catch (error) {
                console.error('❌ Error reading localStorage:', error);
                this.admins = [];
                this.filteredAdmins = [];
                this._dataSource = 'error';
            }
        }
        
        this._dataLoaded = true;
        console.log(`🔒 Data loaded from: ${this._dataSource}`);
        console.log(`Final admin count: ${this.admins.length}`);
    }

    // Save admins to server (primary) and localStorage (backup)
    async saveAdmins() {
        try {
            console.log('💾 Saving admins to MongoDB...');
            console.log('Admins to save:', this.admins.length);
            console.log('Data source:', this._dataSource);
            
            let serverSaveSuccess = false;
            
            // Always try to save to MongoDB first
            try {
                console.log('🌐 Saving to MongoDB...');
                const response = await fetch('http://localhost:5001/api/admin/admin-users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        users: this.admins,
                        timestamp: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Successfully saved to MongoDB:', result);
                    serverSaveSuccess = true;
                    this._dataSource = 'mongodb';
                } else {
                    console.error('❌ MongoDB save failed with status:', response.status);
                    const errorText = await response.text();
                    console.error('MongoDB error:', errorText);
                }
            } catch (serverError) {
                console.error('❌ MongoDB save error:', serverError);
            }
            
            // Always create localStorage backup
            try {
                const dataToSave = JSON.stringify(this.admins);
                localStorage.setItem('kingchat_admin_users', dataToSave);
                localStorage.setItem('kingchat_last_sync', new Date().toISOString());
                localStorage.setItem('kingchat_server_sync', serverSaveSuccess ? 'true' : 'false');
                console.log('📱 Backup saved to localStorage');
            } catch (localError) {
                console.error('❌ localStorage backup failed:', localError);
            }
            
            // Verify save
            if (serverSaveSuccess) {
                console.log('✅ Data successfully saved to MongoDB and backed up locally');
            } else {
                console.warn('⚠️ MongoDB save failed, data saved locally only');
            }
            
        } catch (error) {
            console.error('❌ Error in saveAdmins:', error);
        }
    }
    
    init() {
        console.log('AdminManager init called');
        
        // Test localStorage
        console.log('📱 localStorage Debug:');
        const rawData = localStorage.getItem('kingchat_admin_users');
        console.log('Raw localStorage data:', rawData);
        
        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                console.log('Parsed data:', parsed);
                console.log('Is array?', Array.isArray(parsed));
                console.log('Array length:', parsed.length);
            } catch (e) {
                console.error('Parse error:', e);
            }
        } else {
            console.log('No data in localStorage');
        }
        
        // IMPORTANT: Don't call loadAdmins() - it overwrites stored data!
        // Data is already loaded in constructor via loadStoredAdmins()
        console.log('Current admins from localStorage:', this.admins.length);
        
        this.bindEvents();
        this.updateStats();
        this.renderAdmins(); // Render stored data
        this.updateSyncStatus(); // Show sync status
        
        // Make globally accessible for API
        window.adminManager = this;
        console.log('AdminManager registered globally');
        
        // Debug: Show current state
        console.log('Current admin count after init:', this.admins.length);
        if (this.admins.length > 0) {
            console.log('Current admins:', this.admins.map(u => ({ username: u.username, role: u.role })));
        }
        
        // Bind global methods for inline onclick events - with safety checks
        const methodsToBind = [
            'editAdmin', 'deleteAdmin', 'viewAdminPermissions', 
            'saveEditAdmin', 'saveAdmins', 'renderAdmins'
        ];
        
        methodsToBind.forEach(methodName => {
            try {
                if (typeof this[methodName] === 'function') {
                    window.adminManager[methodName] = this[methodName].bind(this);
                    console.log(`✅ Bound ${methodName} successfully`);
                } else {
                    console.warn(`⚠️ Method ${methodName} not found on instance`);
                }
            } catch (error) {
                console.error(`❌ Error binding ${methodName}:`, error);
            }
        });
        
        console.log('✅ Global methods binding completed');
        
        // Final verification of all important methods
        const criticalMethods = ['saveAdmins', 'deleteAdmin', 'editAdmin', 'renderAdmins'];
        let allMethodsReady = true;
        
        criticalMethods.forEach(methodName => {
            const methodType = typeof window.adminManager[methodName];
            console.log(`${methodName} method type:`, methodType);
            if (methodType !== 'function') {
                console.error(`❌ ${methodName} is not available!`);
                allMethodsReady = false;
            }
        });
        
        if (allMethodsReady) {
            console.log('🎉 All critical methods are ready!');
        } else {
            console.error('⚠️ Some methods are missing - functionality may be limited');
        }
        
        // Wait for API to be ready
        this.ensureApiReady();
    }
    
    ensureApiReady() {
        if (window.api && window.auth) {
            console.log('API and Auth ready immediately');
        } else {
            console.log('Waiting for API and Auth...');
            setTimeout(() => this.ensureApiReady(), 100);
        }
    }

    bindEvents() {
        console.log('AdminManager bindEvents called');
        // Add Admin Button
        const addAdminBtn = document.getElementById('addAdminBtn');
        console.log('Found addAdminBtn:', !!addAdminBtn);
        if (addAdminBtn) {
            console.log('Adding click listener to addAdminBtn');
            addAdminBtn.addEventListener('click', () => {
                console.log('AdminManager showAddAdminModal triggered');
                this.showAddAdminModal();
            });
        }

        // Add Admin Form - DISABLED to prevent errors
        const addAdminForm = document.getElementById('addAdminForm');
        if (addAdminForm) {
            // Remove form submit to prevent conflicts
            addAdminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submit prevented - using button click instead');
                return false;
            });
        }

        // Primary: Direct button click handler
        const submitBtn = document.getElementById('submitAddAdmin');
        if (submitBtn) {
            console.log('Submit button found, adding click handler');
            
            // Remove any existing listeners to prevent duplicates
            const newSubmitBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            
            // Add new listener
            newSubmitBtn.addEventListener('click', (e) => {
                console.log('Submit button clicked directly');
                e.preventDefault();
                e.stopPropagation();
                this.handleAddAdminDirect();
            });
            
        } else {
            console.error('Submit button not found!');
            
            // Fallback: Try to find button by class or text
            setTimeout(() => {
                const allButtons = document.querySelectorAll('button');
                console.log('All buttons found:', allButtons.length);
                allButtons.forEach((btn, index) => {
                    if (btn.textContent?.includes('เพิ่มผู้ดูแลระบบ') || btn.textContent?.includes('เพิ่ม')) {
                        console.log('Found submit button by text, adding listener');
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.handleAddAdminDirect();
                        });
                    }
                });
            }, 500);
        }

        // Modal Close Buttons
        const closeModal = document.getElementById('closeAddAdminModal');
        const cancelBtn = document.getElementById('cancelAddAdmin');
        
        if (closeModal) closeModal.addEventListener('click', () => this.hideAddAdminModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideAddAdminModal());

        // Add real-time validation to form inputs
        this.setupFormValidation();

        // Search and Filter
        const searchInput = document.getElementById('searchAdmin');
        const filterSelect = document.getElementById('filterAdminRole');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterAdmins());
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterAdmins());
        }

        // Modal Background Click
        const modal = document.getElementById('addAdminModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideAddAdminModal();
            });
        }
    }

    renderAdmins() {
        console.log('🔄 Rendering admins...');
        console.log('this.admins:', this.admins);
        console.log('this.filteredAdmins:', this.filteredAdmins);
        console.log('Total admins to render:', this.admins ? this.admins.length : 'null');
        console.log('Filtered admins to render:', this.filteredAdmins ? this.filteredAdmins.length : 'null');
        
        if (this.admins && this.admins.length > 0) {
            console.log('Admin data preview:', this.admins.map(a => ({
                id: a.id,
                username: a.username,
                displayName: a.displayName,
                role: a.role
            })));
        } else {
            console.log('❌ No admin data to render');
        }
        
        const tbody = document.getElementById('adminTableBody');
        
        if (!tbody) {
            console.warn('❌ adminTableBody element not found');
            return;
        }

        console.log('✅ Found adminTableBody element');

        // Force use this.admins instead of this.filteredAdmins for debugging
        const adminsToRender = this.admins || [];
        console.log('Admins to render count:', adminsToRender.length);

        if (adminsToRender.length === 0) {
            console.log('📋 No admins to display - showing empty state');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center empty-state">
                        <div class="empty-state-icon">👨‍💼</div>
                        <div class="empty-state-title">ไม่พบแอดมิน</div>
                        <div class="empty-state-description">ลองปรับเปลี่ยนเงื่อนไขการค้นหา หรือเพิ่มแอดมินใหม่</div>
                    </td>
                </tr>
            `;
            return;
        }

        try {
            console.log('🎨 Generating HTML for', adminsToRender.length, 'admins...');
            
            const htmlRows = adminsToRender.map((admin, index) => {
                console.log(`Rendering admin ${index + 1}:`, admin);
                return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="user-avatar">
                                ${this.getAdminIcon(admin.role)}
                            </div>
                            <div>
                                <div style="font-weight: 600;">${admin.displayName || 'ไม่ระบุชื่อ'}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">@${admin.username || 'unknown'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge badge-${this.getRoleBadgeClass(admin.role)}">
                            ${this.getRoleDisplayName(admin.role)}
                        </span>
                    </td>
                    <td>
                        <span class="status-indicator ${admin.status || 'offline'}">
                            ${(admin.status === 'online') ? '● ออนไลน์' : '○ ออฟไลน์'}
                        </span>
                    </td>
                    <td>
                        <div style="font-size: 0.875rem;">
                            ${this.formatDateTime(admin.lastLogin)}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-info" onclick="window.adminManager.viewAdminPermissions(${admin.id})" title="ดูข้อมูลและสิทธิ์">
                                👁️ ดู
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="window.adminManager.editAdmin(${admin.id})" title="แก้ไขข้อมูล">
                                ✏️ แก้ไข
                            </button>
                            ${admin.role !== 'super_admin' ? `
                                <button class="btn btn-sm btn-danger" onclick="window.adminManager.deleteAdmin(${admin.id})" title="ลบผู้ใช้">
                                    🗑️ ลบ
                                </button>
                            ` : `
                                <span class="btn btn-sm" style="background: #f8f9fa; color: #6c757d; cursor: not-allowed;" title="ไม่สามารถลบ Super Admin ได้">
                                    🔒 ป้องกัน
                                </span>
                            `}
                        </div>
                    </td>
                </tr>
            `;
            });
            
            tbody.innerHTML = htmlRows.join('');
            console.log(`✅ Successfully rendered ${adminsToRender.length} admin rows`);
            
        } catch (error) {
            console.error('❌ Error rendering admins:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center error">เกิดข้อผิดพลาดในการแสดงข้อมูล: ${error.message}</td>
                </tr>
            `;
        }
    }

    getAdminIcon(role) {
        const icons = {
            super_admin: '■',
            admin: '●',
            moderator: '▲'
        };
        return icons[role] || '●';
    }

    getRoleBadgeClass(role) {
        const classes = {
            super_admin: 'danger',
            admin: 'primary',
            moderator: 'warning'
        };
        return classes[role] || 'secondary';
    }

    getRoleDisplayName(role) {
        const names = {
            super_admin: 'Super Admin',
            admin: 'Admin',
            moderator: 'Moderator'
        };
        return names[role] || role;
    }

    updateStats() {
        const totalAdmins = this.admins.length;
        const activeAdmins = this.admins.filter(admin => admin.status === 'online').length;
        const superAdmins = this.admins.filter(admin => admin.role === 'super_admin').length;
        const moderators = this.admins.filter(admin => admin.role === 'moderator').length;

        this.updateStatCard('totalAdmins', totalAdmins);
        this.updateStatCard('activeAdmins', activeAdmins);
        this.updateStatCard('superAdmins', superAdmins);
        this.updateStatCard('moderators', moderators);
    }

    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    filterAdmins() {
        const searchTerm = document.getElementById('searchAdmin')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('filterAdminRole')?.value || '';

        this.filteredAdmins = this.admins.filter(admin => {
            const matchesSearch = 
                admin.username.toLowerCase().includes(searchTerm) ||
                admin.displayName.toLowerCase().includes(searchTerm);

            const matchesRole = !roleFilter || admin.role === roleFilter;

            return matchesSearch && matchesRole;
        });

        this.renderAdmins();
    }

    showAddAdminModal() {
        console.log('showAddAdminModal called');
        const modal = document.getElementById('addAdminModal');
        console.log('Modal element found:', !!modal);
        if (modal) {
            console.log('Setting modal display to flex');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('Modal should now be visible');
        } else {
            console.error('Modal element not found!');
        }
    }

    hideAddAdminModal() {
        const modal = document.getElementById('addAdminModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.resetAddAdminForm();
            this.clearFieldValidations(); // Clear validation messages
        }
    }

    resetAddAdminForm() {
        const form = document.getElementById('addAdminForm');
        if (form) {
            form.reset();
            // Uncheck all permission checkboxes
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
        }
        
        // Clear validation feedback
        this.clearFieldValidations();
    }

    async handleAddAdminDirect() {
        console.log('➕ Adding new admin...');

        try {
            // Wait a bit to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Use FormData API directly to avoid null property access
            const formEl = document.querySelector('#addAdminForm');
            if (!formEl) {
                this.showError('ไม่พบฟอร์มแอดมิน กรุณารีเฟรชหน้า');
                return;
            }

            console.log('📝 Using FormData API...');
            const formData = new FormData(formEl);
            
            // Get values from FormData
            let username = formData.get('username') || '';
            let displayName = formData.get('displayName') || '';
            let password = formData.get('password') || '';
            let role = formData.get('role') || '';

            console.log('FormData values:');
            console.log('Username from FormData:', username);
            console.log('DisplayName from FormData:', displayName);
            console.log('Password from FormData:', password ? '[HIDDEN]' : 'EMPTY');
            console.log('Role from FormData:', role);

            // If FormData doesn't work, try direct element access with protection
            if (!username || !displayName || !password || !role) {
                console.log('🔄 Fallback to direct access...');
                
                const elements = {
                    username: document.querySelector('#newAdminUsername'),
                    displayName: document.querySelector('#newAdminDisplayName'),
                    password: document.querySelector('#newAdminPassword'),
                    role: document.querySelector('#newAdminRole')
                };

                // Use textContent for select elements or getAttribute for inputs
                try {
                    username = username || (elements.username ? (elements.username.value || elements.username.getAttribute('value') || '') : '');
                    displayName = displayName || (elements.displayName ? (elements.displayName.value || elements.displayName.getAttribute('value') || '') : '');
                    password = password || (elements.password ? (elements.password.value || elements.password.getAttribute('value') || '') : '');
                    
                    // Special handling for select element
                    if (elements.role && !role) {
                        if (elements.role.selectedOptions && elements.role.selectedOptions.length > 0) {
                            role = elements.role.selectedOptions[0].value;
                        } else if (elements.role.options && elements.role.selectedIndex >= 0) {
                            role = elements.role.options[elements.role.selectedIndex].value;
                        }
                    }
                } catch (err) {
                    console.error('Error in direct access:', err);
                }

                console.log('After fallback:');
                console.log('Username:', username);
                console.log('DisplayName:', displayName);
                console.log('Password:', password ? '[HIDDEN]' : 'EMPTY');
                console.log('Role:', role);
            }

            // Final validation
            if (!username) {
                this.showError('กรุณากรอกชื่อผู้ใช้');
                return;
            }

            // Check username length (minimum 3 characters)
            if (username.trim().length < 3) {
                this.showError('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
                return;
            }

            // Check username length (maximum 30 characters)
            if (username.trim().length > 30) {
                this.showError('ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร');
                return;
            }

            if (!displayName) {
                this.showError('กรุณากรอกชื่อแสดง');
                return;
            }

            if (!password) {
                this.showError('กรุณากรอกรหัสผ่าน');
                return;
            }

            if (!role) {
                this.showError('กรุณาเลือกระดับสิทธิ์');
                return;
            }

            if (password.length < 6) {
                this.showError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
                return;
            }

            // Check username format
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                this.showError('ชื่อผู้ใช้ควรใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น');
                return;
            }

            // Check duplicate username
            if (this.admins && this.admins.some(admin => admin.username === username)) {
                this.showError(`ชื่อผู้ใช้ "${username}" มีอยู่แล้ว`);
                return;
            }

            // Get permissions safely
            const permissions = this.getSelectedPermissions();
            console.log('Permissions:', permissions);

            console.log('👤 Creating admin user...');

            // Create admin object
            const newAdmin = {
                id: Date.now(),
                username: username.trim(),
                displayName: displayName.trim(),
                password: password.trim(),
                role: role,
                permissions: permissions,
                status: 'offline',
                lastLogin: null,
                createdAt: new Date().toISOString()
            };

            console.log('New admin created:', newAdmin);

            // Initialize admins array if needed
            if (!this.admins) {
                this.admins = [];
                console.log('Initialized empty admins array');
            }

            // Add to arrays
            this.admins.push(newAdmin);
            this.filteredAdmins = [...this.admins];
            
            console.log('Admin added to array. Total admins:', this.admins.length);

            // Save directly to MongoDB first
            const mongoSaved = await this.saveToMongoDB(newAdmin);
            
            if (mongoSaved) {
                console.log('✅ Admin saved to MongoDB successfully');
                
                // Reload from MongoDB to ensure consistency
                setTimeout(async () => {
                    await this.loadStoredAdmins();
                    this.renderAdmins();
                    this.updateStats();
                }, 500);
            } else {
                console.log('⚠️ MongoDB save failed, using localStorage backup');
                // Save to localStorage as backup
                this.saveAdmins();
            }

            // Update UI immediately
            this.renderAdmins();
            this.updateStats();
            this.hideAddAdminModal();
            
            // Show success
            this.showSuccess(`✅ เพิ่มแอดมิน "${displayName}" สำเร็จ! ${mongoSaved ? '(บันทึกใน MongoDB)' : '(บันทึกใน localStorage)'} สามารถใช้เข้าสู่ระบบได้ทันที (Total: ${this.admins.length})`);
            
            console.log('✅ Admin creation completed');
            console.log('Final admin count:', this.admins.length);

        } catch (error) {
            console.error('=== ERROR IN handleAddAdminDirect ===');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            this.showError(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    }

    // Legacy function - DISABLED
    async handleAddAdmin(event) {
        try {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            console.log('Legacy handleAddAdmin called - redirecting to handleAddAdminDirect');
            this.handleAddAdminDirect();
            return false;
        } catch (error) {
            console.error('Error in legacy handleAddAdmin:', error);
            return false;
        }
    }

    getSelectedPermissions() {
        const permissions = [];
        
        try {
            // Try multiple selectors to find checkboxes
            const selectors = [
                '#addAdminForm input[type="checkbox"]:checked',
                '.permission-item input[type="checkbox"]:checked',
                'input[id^="perm"]:checked'
            ];

            let checkboxes = [];
            for (const selector of selectors) {
                checkboxes = document.querySelectorAll(selector);
                if (checkboxes.length > 0) break;
            }

            console.log('Found checked checkboxes:', checkboxes.length);
            
            checkboxes.forEach(cb => {
                const value = cb.value || cb.getAttribute('value');
                if (value) {
                    console.log('Checkbox value:', value);
                    permissions.push(value);
                }
            });
            
            console.log('Selected permissions:', permissions);
            return permissions;
            
        } catch (error) {
            console.error('Error getting permissions:', error);
            return [];
        }
    }

    // Save single admin directly to MongoDB
    async saveToMongoDB(adminData) {
        try {
            console.log('💾 Saving single admin to MongoDB...', adminData.username);
            
            const response = await fetch('http://localhost:5001/api/admin/admin-users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: adminData.username,
                    displayName: adminData.displayName,
                    password: adminData.password,
                    role: adminData.role,
                    permissions: adminData.permissions || []
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ MongoDB save success:', result);
                this.showSuccess('สร้างแอดมินสำเร็จ!');
                return true;
            } else {
                const errorData = await response.json();
                console.error('❌ MongoDB save failed:', errorData);
                
                // Show specific error message from server
                if (errorData.error) {
                    this.showError(`เกิดข้อผิดพลาด: ${errorData.error}`);
                } else {
                    this.showError('ไม่สามารถสร้างแอดมินได้');
                }
                return false;
            }
        } catch (error) {
            console.error('❌ MongoDB save error:', error);
            this.showError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            return false;
        }
    }

    // Force reload all data from MongoDB
    async reloadFromMongoDB() {
        try {
            console.log('🔄 Force reloading from MongoDB...');
            
            // Clear local data
            this.admins = [];
            this.filteredAdmins = [];
            
            // Clear localStorage to force server reload
            localStorage.removeItem('kingchat_admin_users');
            localStorage.removeItem('kingchat_last_sync');
            
            // Load fresh from MongoDB
            await this.loadStoredAdmins();
            
            // Update UI
            this.renderAdmins();
            this.updateStats();
            
            console.log('✅ Reloaded from MongoDB:', this.admins.length, 'admins');
        } catch (error) {
            console.error('❌ Error reloading from MongoDB:', error);
        }
    }

    validateAdminData(data) {
        console.log('Validating admin data:', data);

        // Check required fields
        if (!data.username) {
            this.showError('กรุณากรอกชื่อผู้ใช้');
            return false;
        }

        // Check username length (minimum 3 characters)
        if (data.username.trim().length < 3) {
            this.showError('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
            return false;
        }

        // Check username length (maximum 30 characters)
        if (data.username.trim().length > 30) {
            this.showError('ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร');
            return false;
        }

        if (!data.displayName) {
            this.showError('กรุณากรอกชื่อแสดง');
            return false;
        }

        if (!data.password) {
            this.showError('กรุณากรอกรหัสผ่าน');
            return false;
        }

        if (!data.role) {
            this.showError('กรุณาเลือกระดับสิทธิ์');
            return false;
        }

        // Check password length
        if (data.password.length < 6) {
            this.showError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return false;
        }

        // Check username format (basic check)
        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            this.showError('ชื่อผู้ใช้ควรใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น');
            return false;
        }

        // Check if username already exists
        if (this.admins.some(admin => admin.username === data.username)) {
            this.showError(`ชื่อผู้ใช้ "${data.username}" มีอยู่แล้ว`);
            return false;
        }

        console.log('Validation passed');
        return true;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications first
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Add CSS if not exists
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 350px;
                    max-width: 500px;
                    z-index: 10000;
                    animation: slideIn 0.4s ease;
                    font-size: 16px;
                    font-weight: 500;
                }
                
                @keyframes slideIn {
                    from { 
                        transform: translateX(100%) scale(0.9); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0) scale(1); 
                        opacity: 1; 
                    }
                }
                
                .notification-success {
                    border-left: 5px solid #2ecc71;
                    background: linear-gradient(135deg, #f8fff8, #ffffff);
                }
                
                .notification-error {
                    border-left: 5px solid #e74c3c;
                    background: linear-gradient(135deg, #fff8f8, #ffffff);
                }
                
                .notification-info {
                    border-left: 5px solid #3498db;
                    background: linear-gradient(135deg, #f8feff, #ffffff);
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }
                
                .notification-icon {
                    font-size: 24px;
                }
                
                .notification-message {
                    color: #2c3e50;
                    line-height: 1.4;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #95a5a6;
                    padding: 4px;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .notification-close:hover {
                    background: #ecf0f1;
                    color: #2c3e50;
                }
            `;
            document.head.appendChild(style);
        }

        console.log(`Notification shown: ${type} - ${message}`);
    }

    setupFormValidation() {
        console.log('Setting up real-time form validation...');
        
        // Username validation
        const usernameInput = document.getElementById('newAdminUsername');
        if (usernameInput) {
            usernameInput.addEventListener('input', (e) => {
                this.validateUsernameField(e.target);
            });
            usernameInput.addEventListener('blur', (e) => {
                this.validateUsernameField(e.target);
            });
        }

        // Password validation
        const passwordInput = document.getElementById('newAdminPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.validatePasswordField(e.target);
            });
        }

        // Display name validation
        const displayNameInput = document.getElementById('newAdminDisplayName');
        if (displayNameInput) {
            displayNameInput.addEventListener('input', (e) => {
                this.validateDisplayNameField(e.target);
            });
        }
    }

    validateUsernameField(input) {
        const value = input.value.trim();
        const feedbackId = 'username-feedback';
        
        // Remove existing feedback
        this.removeFeedback(feedbackId);
        
        let message = '';
        let isValid = true;
        
        if (!value) {
            message = 'กรุณากรอกชื่อผู้ใช้';
            isValid = false;
        } else if (value.length < 3) {
            message = 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
            isValid = false;
        } else if (value.length > 30) {
            message = 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร';
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            message = 'ชื่อผู้ใช้ควรใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น';
            isValid = false;
        } else if (this.admins && this.admins.some(admin => admin.username === value)) {
            message = `ชื่อผู้ใช้ "${value}" มีอยู่แล้ว`;
            isValid = false;
        }
        
        if (message) {
            this.showFieldFeedback(input, message, isValid, feedbackId);
        }
        
        return isValid;
    }

    validatePasswordField(input) {
        const value = input.value;
        const feedbackId = 'password-feedback';
        
        // Remove existing feedback
        this.removeFeedback(feedbackId);
        
        let message = '';
        let isValid = true;
        
        if (!value) {
            message = 'กรุณากรอกรหัสผ่าน';
            isValid = false;
        } else if (value.length < 6) {
            message = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
            isValid = false;
        }
        
        if (message) {
            this.showFieldFeedback(input, message, isValid, feedbackId);
        }
        
        return isValid;
    }

    validateDisplayNameField(input) {
        const value = input.value.trim();
        const feedbackId = 'displayname-feedback';
        
        // Remove existing feedback
        this.removeFeedback(feedbackId);
        
        let message = '';
        let isValid = true;
        
        if (!value) {
            message = 'กรุณากรอกชื่อแสดง';
            isValid = false;
        }
        
        if (message) {
            this.showFieldFeedback(input, message, isValid, feedbackId);
        }
        
        return isValid;
    }

    showFieldFeedback(input, message, isValid, feedbackId) {
        // Update input style
        input.style.borderColor = isValid ? '#10b981' : '#ef4444';
        
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.id = feedbackId;
        feedback.className = `field-feedback ${isValid ? 'valid' : 'invalid'}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            font-size: 12px;
            margin-top: 4px;
            color: ${isValid ? '#10b981' : '#ef4444'};
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        
        // Add icon
        const icon = document.createElement('span');
        icon.textContent = isValid ? '✓' : '⚠';
        feedback.prepend(icon);
        
        // Insert feedback after input
        input.parentNode.insertBefore(feedback, input.nextSibling);
    }

    removeFeedback(feedbackId) {
        const existingFeedback = document.getElementById(feedbackId);
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }

    // Clear all field validations
    clearFieldValidations() {
        // Reset input styles
        const inputs = ['newAdminUsername', 'newAdminPassword', 'newAdminDisplayName'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.style.borderColor = '';
            }
        });
        
        // Remove feedback messages
        ['username-feedback', 'password-feedback', 'displayname-feedback'].forEach(feedbackId => {
            this.removeFeedback(feedbackId);
        });
    }

    formatDateTime(dateString) {
        if (!dateString) return 'ไม่เคยเข้าสู่ระบบ';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'เมื่อสักครู่';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    editAdmin(adminId) {
        const admin = this.admins.find(a => a.id === adminId);
        if (admin) {
            this.showNotification(`แก้ไขข้อมูล: ${admin.displayName}`, 'info');
            // TODO: Implement edit functionality
        }
    }

    viewAdminPermissions(adminId) {
        const admin = this.admins.find(a => a.id === adminId);
        if (admin) {
            const permissionsText = admin.permissions && admin.permissions.length > 0 
                ? admin.permissions.join(', ') 
                : 'ไม่มีสิทธิ์เฉพาะ';
            this.showNotification(`สิทธิ์ของ ${admin.displayName}: ${permissionsText}`, 'info');
        }
    }

    editAdmin(id) {
        const admin = this.admins.find(a => a.id === id);
        if (admin) {
            // Implementation for edit admin
            console.log('Edit admin:', admin);
            this.showInfo(`แก้ไขแอดมิน: ${admin.displayName}`);
        }
    }

    viewAdminPermissions(id) {
        const admin = this.admins.find(a => a.id === id);
        if (admin) {
            const permissionNames = {
                manage_users: 'จัดการผู้ใช้',
                manage_chat: 'จัดการแชท',
                manage_lineoa: 'จัดการ LINE OA',
                view_reports: 'ดูรายงาน',
                system_settings: 'ตั้งค่าระบบ'
            };

            const permissions = admin.permissions.map(p => permissionNames[p] || p).join(', ');
            this.showInfo(`สิทธิ์ของ ${admin.displayName}: ${permissions}`);
        }
    }

    deleteAdmin(id) {
        const admin = this.admins.find(a => a.id === id);
        if (admin && confirm(`คุณต้องการลบแอดมิน "${admin.displayName}" หรือไม่?`)) {
            this.admins = this.admins.filter(a => a.id !== id);
            this.filteredAdmins = [...this.admins];
            this.renderAdmins();
            this.updateStats();
            this.showSuccess('ลบแอดมินสำเร็จ');
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'ไม่เคยเข้าสู่ระบบ';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH') + ' ' + date.toLocaleTimeString('th-TH');
    }

    showSuccess(message) {
        // Implementation for success notification
        console.log('Success:', message);
        if (window.notifications) {
            window.notifications.show(message, 'success');
        }
    }

    showError(message) {
        // Implementation for error notification
        console.error('Error:', message);
        if (window.notifications) {
            window.notifications.show(message, 'error');
        }
    }

    showInfo(message) {
        // Implementation for info notification
        console.log('Info:', message);
        if (window.notifications) {
            window.notifications.show(message, 'info');
        }
    }

    // Edit admin function
    editAdmin(adminId) {
        console.log('Edit admin:', adminId);
        const admin = this.admins.find(a => a.id === adminId);
        
        if (!admin) {
            alert('ไม่พบผู้ใช้ที่ต้องการแก้ไข');
            return;
        }

        // Create edit modal content
        const editModal = this.createEditModal(admin);
        document.body.appendChild(editModal);
        editModal.style.display = 'flex';
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = editModal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Create edit modal
    createEditModal(admin) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editAdminModal';
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content modern-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <h2>✏️ แก้ไขข้อมูลผู้ดูแลระบบ</h2>
                        <p class="modal-subtitle">แก้ไขข้อมูลของ ${admin.displayName}</p>
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span>✕</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">👤</span>
                                ชื่อผู้ใช้ (Username)
                            </label>
                            <input type="text" id="editUsername" class="form-input" value="${admin.username}" readonly style="background-color: #f8f9fa;">
                            <div class="form-hint">ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้</div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">📝</span>
                                ชื่อแสดง (Display Name)
                            </label>
                            <input type="text" id="editDisplayName" class="form-input" value="${admin.displayName}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">🔐</span>
                                รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                            </label>
                            <input type="password" id="editPassword" class="form-input" placeholder="กรอกรหัสผ่านใหม่">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <span class="label-icon">⚡</span>
                                ระดับสิทธิ์ (Role)
                            </label>
                            <select id="editRole" class="form-select" required ${admin.role === 'super_admin' ? 'disabled' : ''}>
                                <option value="super_admin" ${admin.role === 'super_admin' ? 'selected' : ''}>🔴 Super Admin (สิทธิ์สูงสุด)</option>
                                <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>🟡 Admin (จัดการทั่วไป)</option>
                                <option value="moderator" ${admin.role === 'moderator' ? 'selected' : ''}>🟢 Moderator (ดูแลเนื้อหา)</option>
                            </select>
                            ${admin.role === 'super_admin' ? '<div class="form-hint">ไม่สามารถเปลี่ยนระดับสิทธิ์ Super Admin ได้</div>' : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancel" onclick="this.closest('.modal').remove()">
                        <span>❌</span>
                        ยกเลิก
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.adminManager.saveEditAdmin(${admin.id})">
                        <span>💾</span>
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            </div>
        `;
        
        return modal;
    }

    // Save edited admin
    saveEditAdmin(adminId) {
        const modal = document.getElementById('editAdminModal');
        const admin = this.admins.find(a => a.id === adminId);
        
        if (!admin) {
            alert('ไม่พบผู้ใช้ที่ต้องการแก้ไข');
            return;
        }

        // Get form values
        const displayName = modal.querySelector('#editDisplayName').value.trim();
        const password = modal.querySelector('#editPassword').value.trim();
        const role = modal.querySelector('#editRole').value;

        // Validation
        if (!displayName) {
            alert('กรุณากรอกชื่อแสดง');
            return;
        }

        if (password && password.length < 6) {
            alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }

        // Update admin data
        admin.displayName = displayName;
        if (password) {
            admin.password = password;
        }
        if (admin.role !== 'super_admin') {
            admin.role = role;
        }
        admin.updatedAt = new Date().toISOString();

        // Save to localStorage
        this.saveAdmins();
        
        // Update UI
        this.renderAdmins();
        this.updateStats();
        
        // Close modal
        modal.remove();
        
        alert('✅ แก้ไขข้อมูลสำเร็จ!');
        console.log('Admin updated:', admin);
    }

    // Delete admin function
    async deleteAdmin(adminId) {
        const admin = this.admins.find(a => a.id === adminId);
        
        if (!admin) {
            alert('ไม่พบผู้ใช้ที่ต้องการลบ');
            return;
        }

        // Prevent deleting super admin
        if (admin.role === 'super_admin') {
            alert('ไม่สามารถลบ Super Admin ได้');
            return;
        }

        // Confirm deletion
        const confirmDelete = confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${admin.displayName}"?\n\nการกระทำนี้ไม่สามารถยกเลิกได้`);
        
        if (!confirmDelete) {
            return;
        }

        try {
            console.log('🗑️ Deleting admin from server...');
            
            // Call API to delete from MongoDB
            const response = await fetch(`http://localhost:5001/api/admin/admin-users/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Server delete success:', result);
                
                // Remove from local arrays
                console.log('Before delete - Total admins:', this.admins.length);
                this.admins = this.admins.filter(a => a.id !== adminId);
                this.filteredAdmins = [...this.admins];
                console.log('After delete - Total admins:', this.admins.length);
                
                // Update UI
                this.renderAdmins();
                this.updateStats();
                
                // Reload from server to ensure consistency
                setTimeout(async () => {
                    await this.loadStoredAdmins();
                    this.renderAdmins();
                    this.updateStats();
                }, 500);
                
                this.showSuccess(`ลบผู้ใช้ "${admin.displayName}" สำเร็จ!`);
                console.log('Admin deleted:', admin);
                
            } else {
                const errorData = await response.json();
                console.error('❌ Server delete failed:', errorData);
                this.showError(`เกิดข้อผิดพลาด: ${errorData.error || 'ไม่สามารถลบผู้ใช้ได้'}`);
            }
            
        } catch (error) {
            console.error('❌ Delete error:', error);
            this.showError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    }

    // View admin permissions (optional feature)
    viewAdminPermissions(adminId) {
        const admin = this.admins.find(a => a.id === adminId);
        
        if (!admin) {
            alert('ไม่พบผู้ใช้');
            return;
        }

        const permissions = admin.permissions || [];
        const permissionNames = {
            'manage_users': '👥 จัดการผู้ใช้',
            'manage_chat': '💬 จัดการแชท',
            'manage_lineoa': '📱 จัดการ LINE OA',
            'view_reports': '📊 ดูรายงาน',
            'system_settings': '⚙️ ตั้งค่าระบบ'
        };

        let permissionList = 'ไม่มีสิทธิ์พิเศษ';
        if (permissions.length > 0) {
            permissionList = permissions.map(p => permissionNames[p] || p).join('\n• ');
            permissionList = '• ' + permissionList;
        }

        alert(`ข้อมูลผู้ใช้: ${admin.displayName}\nระดับสิทธิ์: ${this.getRoleDisplayName(admin.role)}\n\nสิทธิ์พิเศษ:\n${permissionList}`);
    }

    // Update sync status display
    updateSyncStatus() {
        const statusElement = document.getElementById('syncStatus');
        if (!statusElement) {
            // Create status element if it doesn't exist
            const headerElement = document.querySelector('.page-header');
            if (headerElement) {
                const statusDiv = document.createElement('div');
                statusDiv.id = 'syncStatus';
                statusDiv.style.cssText = 'margin-top: 10px; padding: 8px 12px; border-radius: 6px; font-size: 14px; display: flex; align-items: center; gap: 8px; justify-content: space-between;';
                
                const statusText = document.createElement('span');
                statusText.id = 'syncStatusText';
                statusDiv.appendChild(statusText);
                
                const refreshBtn = document.createElement('button');
                refreshBtn.innerHTML = '🔄 รีเฟรชจาก Server';
                refreshBtn.style.cssText = 'padding: 4px 8px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; font-size: 12px;';
                refreshBtn.onclick = () => this.forceRefreshFromServer();
                statusDiv.appendChild(refreshBtn);
                
                headerElement.appendChild(statusDiv);
            }
        }
        
        const statusEl = document.getElementById('syncStatusText');
        if (statusEl) {
            const lastSync = localStorage.getItem('kingchat_last_sync');
            
            if (this._dataSource === 'server') {
                statusEl.innerHTML = '🟢 เชื่อมต่อกับ Server แล้ว';
                statusEl.parentElement.style.backgroundColor = '#d4edda';
                statusEl.parentElement.style.color = '#155724';
                statusEl.parentElement.style.border = '1px solid #c3e6cb';
            } else if (this._dataSource === 'localStorage') {
                statusEl.innerHTML = '🟡 ใช้ข้อมูลสำรอง (Server ไม่สามารถเชื่อมต่อได้)';
                statusEl.parentElement.style.backgroundColor = '#fff3cd';
                statusEl.parentElement.style.color = '#856404';
                statusEl.parentElement.style.border = '1px solid #ffeaa7';
            } else {
                statusEl.innerHTML = '🔴 ไม่มีข้อมูล';
                statusEl.parentElement.style.backgroundColor = '#f8d7da';
                statusEl.parentElement.style.color = '#721c24';
                statusEl.parentElement.style.border = '1px solid #f5c6cb';
            }
            
            if (lastSync) {
                const syncTime = new Date(lastSync).toLocaleString('th-TH');
                statusEl.innerHTML += ` | อัพเดทล่าสุด: ${syncTime}`;
            }
        }
    }

    // Force refresh from server
    async forceRefreshFromServer() {
        console.log('🔄 Force refreshing from server...');
        
        // Clear all local data
        localStorage.removeItem('kingchat_admin_users');
        localStorage.removeItem('kingchat_last_sync');
        localStorage.removeItem('kingchat_server_sync');
        
        // Reset internal state
        this.admins = [];
        this.filteredAdmins = [];
        this._dataSource = 'loading';
        
        // Show loading state
        this.updateSyncStatus();
        
        // Reload from server
        await this.loadStoredAdmins();
        
        // Update UI
        this.renderAdmins();
        this.updateStats();
        this.updateSyncStatus();
        
        alert('🔄 รีเฟรชข้อมูลจาก Server สำเร็จ!');
    }
    
    }; // End of AdminManager class
    
})(); // End of IIFE

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('adminTableBody') && window.AdminManager) {
        if (!window.adminManager) {
            window.adminManager = new window.AdminManager();
        }
    }
});