// Simple User Display Manager// Simple Global User Display Manager// Enhanced Global User Menu Component// Global User Menu Component

console.log('Loading Simple User Display Manager...');

(function() {

function getCurrentUser() {

    try {    'use strict';(function() {(function() {

        if (window.auth && window.auth.user) {

            return window.auth.user;

        }

            function getCurrentUser() {    'use strict';    'use strict';

        const userData = localStorage.getItem('userData') || localStorage.getItem('currentUser');

        if (userData) {        try {

            return JSON.parse(userData);

        }            if (window.auth && window.auth.user) {

        

        return null;                return window.auth.user;

    } catch (error) {

        console.error('Error getting current user:', error);            }    // Function to get current user from various sources// Global User Menu Component

        return null;

    }            

}

            const userData = localStorage.getItem('userData') || localStorage.getItem('currentUser');    function getCurrentUser() {(function() {

function updateUserDisplay() {

    const user = getCurrentUser();            if (userData) {

    if (!user) {

        console.log('No user data available');                return JSON.parse(userData);        try {    'use strict';

        return;

    }            }



    const displayName = user.displayName || user.username || 'ผู้ใช้';                        // Try auth object first

    

    // Update all user display elements            return null;

    const userElements = document.querySelectorAll('#userDisplayName, .user-name, [data-user-display]');

    userElements.forEach(function(el) {        } catch (error) {            if (window.auth && window.auth.user) {    // Function to get current user from various sources

        el.textContent = displayName;

    });            console.error('Error getting current user:', error);



    console.log('Updated user display elements:', displayName);            return null;                return window.auth.user;    function getCurrentUser() {

}

        }

function initUserDisplay() {

    let attempts = 0;    }            }        try {

    const maxAttempts = 50;

    

    function tryUpdate() {

        attempts++;    function updateUserDisplay() {                        // Try auth object first

        const user = getCurrentUser();

                const user = getCurrentUser();

        if (user) {

            updateUserDisplay();        if (!user) return;            // Try localStorage            if (window.auth && window.auth.user) {

            return;

        }

        

        if (attempts < maxAttempts) {        const displayName = user.displayName || user.username || 'ผู้ใช้';            const userData = localStorage.getItem('userData') || localStorage.getItem('currentUser');                return window.auth.user;

            setTimeout(tryUpdate, 100);

        } else {        

            console.warn('Could not load user data after 5 seconds');

        }        // Update all user display elements            if (userData) {            }

    }

            const userDisplays = document.querySelectorAll('#userDisplayName, .user-name, [data-user-display]');

    tryUpdate();

}        userDisplays.forEach(el => {                return JSON.parse(userData);            



// Auto-update every 3 seconds            el.textContent = displayName;

setInterval(function() {

    const user = getCurrentUser();        });            }            // Try localStorage

    if (user) {

        updateUserDisplay();

    }

}, 3000);        console.log('Updated user display:', displayName);                        const userData = localStorage.getItem('userData') || localStorage.getItem('currentUser');



// Initialize when DOM is ready    }

if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', function() {            return null;            if (userData) {

        setTimeout(initUserDisplay, 100);

    });    function initializeUserDisplay() {

} else {

    setTimeout(initUserDisplay, 100);        let attempts = 0;        } catch (error) {                return JSON.parse(userData);

}

        const maxAttempts = 50;

// Make functions available globally

window.getCurrentUser = getCurrentUser;                    console.error('Error getting current user:', error);            }

window.updateUserDisplay = updateUserDisplay;

        const tryUpdate = () => {

console.log('Simple User Display Manager loaded successfully');
            attempts++;            return null;            

            const user = getCurrentUser();

                    }            return null;

            if (user) {

                updateUserDisplay();    }        } catch (error) {

                return;

            }            console.error('Error getting current user:', error);

            

            if (attempts < maxAttempts) {    // Function to generate initials from name            return null;

                setTimeout(tryUpdate, 100);

            } else {    function getInitials(name) {        }

                console.warn('Could not load user data after 5 seconds');

            }        if (!name) return '?';    }

        };

                const words = name.split(' ');

        tryUpdate();

    }        if (words.length >= 2) {    // Function to create user menu popup



    // Auto-update every 3 seconds            return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();    function createUserMenu() {

    setInterval(() => {

        const user = getCurrentUser();        }        const user = getCurrentUser();

        if (user) {

            updateUserDisplay();        return name.charAt(0).toUpperCase();        

        }

    }, 3000);    }        if (!user) {



    // Initialize when DOM is ready            console.warn('No user data available for user menu');

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', function() {    // Function to update user display in navbar            return;

            setTimeout(initializeUserDisplay, 100);

        });    function updateUserDisplayInNavbar() {        }

    } else {

        setTimeout(initializeUserDisplay, 100);        const user = getCurrentUser();

    }

        if (!user) return;        const displayName = user.displayName || user.username || 'ผู้ใช้';

    // Expose functions globally

    window.getCurrentUser = getCurrentUser;

    window.updateUserDisplay = updateUserDisplay;

        const displayName = user.displayName || user.username || 'ผู้ใช้';        // Check if user menu already exists

    console.log('Global User Display Manager loaded');

})();                const existingMenu = document.getElementById('globalUserMenu');

        // Update all user display elements        if (existingMenu) {

        const userDisplays = document.querySelectorAll('#userDisplayName, .user-name, [data-user-display]');            console.log('User menu already exists, updating display name...');

        userDisplays.forEach(el => {            const nameElement = document.getElementById('globalUserName');

            el.textContent = displayName;            if (nameElement) {

        });                nameElement.textContent = displayName;

            }

        // Update user avatar            return; // Already exists

        const userAvatars = document.querySelectorAll('#userAvatar, .user-avatar, [data-user-avatar]');        }

        userAvatars.forEach(el => {

            el.textContent = getInitials(displayName);        console.log('✨ Creating user menu for:', displayName);

        });

        // Create user menu HTML

        console.log('✅ Updated user display elements:', displayName);        const userMenuHTML = `

    }            <div class="user-menu" id="globalUserMenu">

                <div class="user-info" onclick="toggleUserDropdown()">

    // Function to handle logout                    <div class="user-avatar" id="globalUserAvatar">${getInitials(displayName)}</div>

    window.handleGlobalLogout = function() {                    <span class="user-name" id="globalUserName">${displayName}</span>

        if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {                    <span class="dropdown-arrow">▼</span>

            // Clear all stored data                </div>

            localStorage.clear();                <div class="user-dropdown" id="globalUserDropdown" style="display: none;">

            sessionStorage.clear();                    <div class="dropdown-header">

                                    <div class="user-details">

            // Redirect to login                            <div class="user-fullname">${displayName}</div>

            window.location.href = '/login.html';                            <div class="user-username">@${user.username || ''}</div>

        }                            <div class="user-role">${user.role || 'ผู้ใช้'}</div>

    };                        </div>

                    </div>

    // Function to toggle user dropdown                    <div class="dropdown-divider"></div>

    window.toggleUserDropdown = function() {                    <a href="pages/profile.html" class="dropdown-item">

        const dropdown = document.getElementById('globalUserDropdown');                        <span class="dropdown-icon">👤</span>

        if (dropdown) {                        โปรไฟล์

            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';                    </a>

        }                    <a href="pages/settings.html" class="dropdown-item">

    };                        <span class="dropdown-icon">⚙️</span>

                        ตั้งค่า

    // Close dropdown when clicking outside                    </a>

    document.addEventListener('click', function(e) {                    <div class="dropdown-divider"></div>

        const dropdown = document.getElementById('globalUserDropdown');                    <a href="#" onclick="handleGlobalLogout()" class="dropdown-item logout">

        const userMenu = document.getElementById('globalUserMenu');                        <span class="dropdown-icon">🚪</span>

                                ออกจากระบบ

        if (dropdown && userMenu && !userMenu.contains(e.target)) {                    </a>

            dropdown.style.display = 'none';                </div>

        }            </div>

    });        `;



    // Initialize user display        // Add CSS styles

    function initializeUserDisplay() {        const userMenuStyles = `

        let attempts = 0;            <style id="globalUserMenuStyles">

        const maxAttempts = 50;                .user-menu {

                            position: relative;

        const tryUpdate = () => {                    display: inline-block;

            attempts++;                    z-index: 1000;

            const user = getCurrentUser();                }

            

            if (user) {                .user-info {

                updateUserDisplayInNavbar();                    display: flex;

                return;                    align-items: center;

            }                    gap: 8px;

                                padding: 8px 12px;

            if (attempts < maxAttempts) {                    background: rgba(255, 255, 255, 0.1);

                setTimeout(tryUpdate, 100);                    border-radius: 25px;

            } else {                    cursor: pointer;

                console.warn('Could not load user data after 5 seconds');                    transition: all 0.3s ease;

            }                    border: 2px solid transparent;

        };                }

        

        tryUpdate();                .user-info:hover {

    }                    background: rgba(255, 255, 255, 0.2);

                    border-color: rgba(255, 255, 255, 0.3);

    // Auto-update user display every 3 seconds                    transform: translateY(-1px);

    setInterval(() => {                }

        const user = getCurrentUser();

        if (user) {                .user-avatar {

            updateUserDisplayInNavbar();                    width: 32px;

        }                    height: 32px;

    }, 3000);                    background: linear-gradient(135deg, #00c851, #00a644);

                    border-radius: 50%;

    // Initialize when DOM is ready                    display: flex;

    if (document.readyState === 'loading') {                    align-items: center;

        document.addEventListener('DOMContentLoaded', function() {                    justify-content: center;

            setTimeout(initializeUserDisplay, 100);                    font-weight: bold;

        });                    color: white;

    } else {                    font-size: 14px;

        setTimeout(initializeUserDisplay, 100);                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    }                }



    // Expose functions globally                .user-name {

    window.getCurrentUser = getCurrentUser;                    color: white;

    window.updateUserDisplayInNavbar = updateUserDisplayInNavbar;                    font-weight: 500;

                    font-size: 14px;

    console.log('👤 Enhanced Global User Menu loaded');                    white-space: nowrap;

})();                    max-width: 120px;
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