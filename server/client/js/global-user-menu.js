// Global User Menu Component
(function() {
    'use strict';

    // Function to create user menu popup
    function createUserMenu() {
        if (!window.auth || !window.auth.user) {
            console.warn('Auth or user data not available for user menu');
            return;
        }

        const user = window.auth.user;
        const displayName = user.displayName || user.username || 'ผู้ใช้';

        // Check if user menu already exists
        const existingMenu = document.getElementById('globalUserMenu');
        if (existingMenu) {
            console.log('User menu already exists, updating display name...');
            const nameElement = document.getElementById('globalUserName');
            if (nameElement) {
                nameElement.textContent = displayName;
            }
            return; // Already exists
        }

        console.log('Creating user menu for:', displayName);

        // Create user menu HTML
        const userMenuHTML = `
            <div class="user-menu" id="globalUserMenu">
                <div class="user-info" onclick="toggleUserDropdown()">
                    <div class="user-avatar" id="globalUserAvatar">${getInitials(displayName)}</div>
                    <span class="user-name" id="globalUserName">${displayName}</span>
                    <span class="dropdown-arrow">▼</span>
                </div>
                <div class="user-dropdown" id="globalUserDropdown" style="display: none;">
                    <a href="../pages/profile.html" class="dropdown-item">
                        <span class="dropdown-icon">👤</span>
                        โปรไฟล์
                    </a>
                    <a href="../pages/settings.html" class="dropdown-item">
                        <span class="dropdown-icon">⚙️</span>
                        ตั้งค่า
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" onclick="handleGlobalLogout()" class="dropdown-item logout">
                        <span class="dropdown-icon">🚪</span>
                        ออกจากระบบ
                    </a>
                </div>
            </div>
        `;

        // Add CSS styles
        const userMenuStyles = `
            <style id="globalUserMenuStyles">
                .user-menu {
                    position: relative;
                    display: inline-block;
                    z-index: 1000;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }

                .user-info:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #00c851, #00a644);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                .user-name {
                    color: white;
                    font-weight: 500;
                    font-size: 14px;
                    white-space: nowrap;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .dropdown-arrow {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 10px;
                    transition: transform 0.3s ease;
                }

                .user-info:hover .dropdown-arrow {
                    transform: rotate(180deg);
                }

                .user-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    min-width: 200px;
                    overflow: hidden;
                    margin-top: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    color: #333;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    border: none;
                    background: none;
                    width: 100%;
                    cursor: pointer;
                }

                .dropdown-item:hover {
                    background: #f8f9fa;
                    color: #00c851;
                }

                .dropdown-item.logout:hover {
                    background: #fff5f5;
                    color: #e53e3e;
                }

                .dropdown-icon {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                }

                .dropdown-divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 4px 0;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .user-name {
                        display: none;
                    }
                    
                    .user-dropdown {
                        right: -50px;
                        min-width: 180px;
                    }
                }
            </style>
        `;

        // Add styles to head if not exists
        if (!document.getElementById('globalUserMenuStyles')) {
            document.head.insertAdjacentHTML('beforeend', userMenuStyles);
        }

        // Find navbar or create container
        let targetContainer = findNavbarContainer();
        if (targetContainer) {
            // Remove existing user display and replace with menu
            const existingUserElements = targetContainer.querySelectorAll('.user, .user-info, span');
            existingUserElements.forEach(el => {
                if (el.textContent && (el.textContent.includes('System Administrator') || el.textContent.includes(displayName))) {
                    console.log('Removing existing user element:', el.textContent);
                    el.remove();
                }
            });

            // Add user menu
            targetContainer.insertAdjacentHTML('beforeend', userMenuHTML);
            console.log('User menu added to navbar container');
        } else {
            // Create floating user menu if no navbar found
            console.log('Creating floating user menu...');
            createFloatingUserMenu(userMenuHTML);
        }

        // Add click outside listener
        document.addEventListener('click', function(event) {
            const userMenu = document.getElementById('globalUserMenu');
            const dropdown = document.getElementById('globalUserDropdown');
            
            if (userMenu && !userMenu.contains(event.target) && dropdown) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Find appropriate navbar container
    function findNavbarContainer() {
        const selectors = [
            '.navbar .navbar-right',
            '.navbar .nav-right', 
            '.navbar .user-section',
            '.navbar .navbar-nav:last-child',
            '.navbar .ml-auto',
            '.navbar .ms-auto',
            '.navbar .user',
            '.navbar .user-info',
            '.navbar',
            '.header .user-section',
            '.header .user',
            '.header',
            '.top-bar',
            '.navigation',
            '.nav'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Found navbar container: ${selector}`);
                return element;
            }
        }
        
        // Try to find any element with "System Administrator" text
        const systemAdminElements = document.querySelectorAll('*');
        for (const element of systemAdminElements) {
            if (element.textContent && element.textContent.includes('System Administrator')) {
                console.log('Found System Administrator element, using its parent');
                return element.parentElement || element;
            }
        }
        
        console.log('No navbar container found');
        return null;
    }

    // Create floating user menu if no navbar
    function createFloatingUserMenu(userMenuHTML) {
        const floatingContainer = document.createElement('div');
        floatingContainer.innerHTML = userMenuHTML;
        floatingContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(floatingContainer);
        console.log('Floating user menu created');
    }

    // Get user initials
    function getInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // Global functions
    window.toggleUserDropdown = function() {
        const dropdown = document.getElementById('globalUserDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.handleGlobalLogout = function() {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            if (window.auth) {
                window.auth.logout();
            } else {
                // Fallback logout
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                window.location.href = '/login.html';
            }
        }
    };

    // Auto-initialize when DOM is ready
    function initUserMenu() {
        if (window.auth && window.auth.isAuthenticated()) {
            createUserMenu();
        } else {
            // Wait and try again
            setTimeout(initUserMenu, 200);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initUserMenu, 300);
        });
    } else {
        setTimeout(initUserMenu, 300);
    }

    // Expose for manual initialization
    window.initGlobalUserMenu = createUserMenu;
    window.forceCreateUserMenu = function() {
        console.log('Force creating user menu...');
        setTimeout(createUserMenu, 100);
    };

    console.log('Global user menu component loaded');
})();