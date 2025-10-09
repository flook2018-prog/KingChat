// User Display Management
(function() {
    'use strict';

    // Function to update user display across all pages
    function updateUserDisplay() {
        if (!window.auth || !window.auth.user) {
            console.warn('Auth or user data not available');
            return;
        }

        const user = window.auth.user;
        const displayName = user.displayName || user.username || 'ผู้ใช้';

        console.log('Updating user display to:', displayName);

        // Update all possible user display elements
        const selectors = [
            'span:contains("System Administrator")',
            '#userDisplayName',
            '#navUserName',
            '.user-name',
            '.navbar .user span'
        ];

        // Update navbar user name (common pattern)
        const navbarUserSpans = document.querySelectorAll('.navbar .user span, .user-info span');
        navbarUserSpans.forEach(span => {
            if (span.textContent === 'System Administrator' || span.textContent.trim() === '') {
                span.textContent = displayName;
                console.log('Updated navbar span:', span);
            }
        });

        // Update specific IDs
        const userDisplayNameEl = document.getElementById('userDisplayName');
        if (userDisplayNameEl) {
            userDisplayNameEl.textContent = displayName;
            console.log('Updated userDisplayName element');
        }

        const navUserNameEl = document.getElementById('navUserName');
        if (navUserNameEl) {
            navUserNameEl.textContent = displayName;
            console.log('Updated navUserName element');
        }

        // Update all spans containing "System Administrator"
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach(span => {
            if (span.textContent && span.textContent.trim() === 'System Administrator') {
                span.textContent = displayName;
                console.log('Updated hardcoded span:', span);
            }
        });

        // Force update specific elements that commonly contain "System Administrator"
        const commonSelectors = [
            '.navbar .user span',
            '.user-info span',
            '.user-section span',
            '.header .user span'
        ];

        commonSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.textContent && el.textContent.trim() === 'System Administrator') {
                    el.textContent = displayName;
                    console.log('Updated selector', selector, ':', el);
                }
            });
        });

        // Update user avatar/initial if exists
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (user.avatar) {
                userAvatar.textContent = user.avatar;
            } else {
                // Generate initials from display name
                const initials = displayName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
                userAvatar.textContent = initials;
            }
            console.log('Updated user avatar');
        }
    }

    // Function to wait for auth and update display
    function waitForAuthAndUpdate() {
        if (window.auth && window.auth.isAuthenticated()) {
            updateUserDisplay();
        } else {
            // Wait a bit and try again
            setTimeout(waitForAuthAndUpdate, 100);
        }
    }

    // Auto-run when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(waitForAuthAndUpdate, 200); // Give auth.js time to load
        });
    } else {
        setTimeout(waitForAuthAndUpdate, 200);
    }

    // Expose globally for manual calls
    window.updateUserDisplay = updateUserDisplay;

    // Force update every 2 seconds to catch any missed elements
    setInterval(() => {
        if (window.auth && window.auth.isAuthenticated()) {
            updateUserDisplay();
        }
    }, 2000);

    console.log('User display manager loaded');
})();