// User Display Management
(function() {
    'use strict';

    // Function to get current user data
    function getCurrentUser() {
        try {
            // Try getting from auth object first
            if (window.auth && window.auth.user) {
                return window.auth.user;
            }
            
            // Fallback to localStorage
            const userData = localStorage.getItem('userData') || localStorage.getItem('currentUser');
            if (userData) {
                return JSON.parse(userData);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Function to update user display across all pages
    function updateUserDisplay() {
        const user = getCurrentUser();
        
        if (!user) {
            console.warn('No user data available for display');
            return;
        }

        const displayName = user.displayName || user.username || 'ผู้ใช้';
        const role = user.role || 'ผู้ใช้';

        console.log('🔄 Updating user display:', { 
            displayName, 
            role, 
            username: user.username 
        });

        // Update all possible user display elements
        const updates = [
            // Main user display element
            { selector: '#userDisplayName', text: displayName },
            { selector: '#navUserName', text: displayName },
            { selector: '.user-name', text: displayName },
            
            // User info sections
            { selector: '.user-info .name', text: displayName },
            { selector: '.user-info .username', text: user.username },
            { selector: '.user-info .role', text: role },
            
            // Navbar user elements
            { selector: '.navbar .user-name', text: displayName },
            { selector: '.navbar .user span:not(#userAvatar)', text: displayName, checkContent: true },
            
            // Profile elements
            { selector: '.profile-name', text: displayName },
            { selector: '.current-user', text: displayName }
        ];

        // Apply updates
        updates.forEach(update => {
            const elements = document.querySelectorAll(update.selector);
            elements.forEach(el => {
                if (update.checkContent) {
                    // Only update if it contains "System Administrator" or is empty
                    if (el.textContent && 
                        (el.textContent.trim() === 'System Administrator' || 
                         el.textContent.trim() === '' || 
                         el.textContent.trim() === 'Loading...')) {
                        el.textContent = update.text;
                        console.log('✅ Updated:', update.selector, '→', update.text);
                    }
                } else {
                    el.textContent = update.text;
                    console.log('✅ Updated:', update.selector, '→', update.text);
                }
            });
        });

        // Special handling for spans containing "System Administrator"
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach(span => {
            if (span.textContent && 
                (span.textContent.trim() === 'System Administrator' || 
                 span.textContent.trim() === 'Loading...')) {
                span.textContent = displayName;
                console.log('✅ Updated hardcoded span:', span, '→', displayName);
            }
        });

        // Update user avatar/initial
        updateUserAvatar(user, displayName);
        
        // Update page title if contains user info
        updatePageTitle(displayName);
    }

    // Function to update user avatar
    function updateUserAvatar(user, displayName) {
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (user.avatar) {
                userAvatar.textContent = user.avatar;
            } else {
                // Generate initials from display name
                const words = displayName.split(' ');
                const initials = words.length > 1 
                    ? words[0].charAt(0) + words[1].charAt(0)
                    : displayName.charAt(0) + (displayName.charAt(1) || '');
                userAvatar.textContent = initials.toUpperCase();
            }
            console.log('✅ Updated user avatar:', userAvatar.textContent);
        }
    }

    // Function to update page title with user info
    function updatePageTitle(displayName) {
        const title = document.title;
        if (title && !title.includes(displayName) && title.includes('KingChat')) {
            document.title = `${title} - ${displayName}`;
            console.log('✅ Updated page title:', document.title);
        }
    }

    // Function to wait for dependencies and update display
    function initializeUserDisplay() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        const checkAndUpdate = () => {
            attempts++;
            const user = getCurrentUser();
            
            if (user) {
                console.log('🎯 User data found, updating display...');
                updateUserDisplay();
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkAndUpdate, 100);
            } else {
                console.warn('⚠️ Could not find user data after 5 seconds');
            }
        };
        
        checkAndUpdate();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeUserDisplay, 100);
        });
    } else {
        setTimeout(initializeUserDisplay, 100);
    }

    // Expose globally for manual calls
    window.updateUserDisplay = updateUserDisplay;
    window.getCurrentUser = getCurrentUser;

    // Auto-refresh user display every 3 seconds
    setInterval(() => {
        const user = getCurrentUser();
        if (user) {
            updateUserDisplay();
        }
    }, 3000);

    console.log('👤 User display manager loaded');
})();