// Mobile Menu Manager for KingChat
class MobileMenuManager {
  constructor() {
    this.sidebar = null;
    this.overlay = null;
    this.toggleButton = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createMobileElements();
    this.setupEventListeners();
    this.handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  // Create mobile-specific elements
  createMobileElements() {
    this.createMobileToggle();
    this.createMobileOverlay();
    this.setupSidebarForMobile();
  }

  // Create hamburger menu button
  createMobileToggle() {
    // Check if toggle already exists
    if (document.querySelector('.mobile-menu-toggle')) return;

    const toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle';
    toggle.innerHTML = '☰';
    toggle.setAttribute('aria-label', 'Toggle menu');
    toggle.setAttribute('aria-expanded', 'false');

    // Add to navbar
    const navbar = document.querySelector('.navbar');
    const navbarBrand = document.querySelector('.navbar-brand');
    
    if (navbar && navbarBrand) {
      navbar.insertBefore(toggle, navbarBrand.nextSibling);
    }

    this.toggleButton = toggle;
  }

  // Create mobile overlay
  createMobileOverlay() {
    if (document.querySelector('.mobile-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);
    
    this.overlay = overlay;
  }

  // Setup sidebar for mobile
  setupSidebarForMobile() {
    this.sidebar = document.querySelector('.sidebar');
    if (this.sidebar) {
      this.sidebar.setAttribute('aria-hidden', 'true');
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Toggle button click
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    }

    // Overlay click to close
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        this.close();
      });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close menu when clicking sidebar links on mobile
    if (this.sidebar) {
      this.sidebar.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && e.target.matches('a, .menu-item')) {
          // Small delay to allow navigation
          setTimeout(() => {
            this.close();
          }, 100);
        }
      });
    }

    // Handle swipe gestures
    this.setupSwipeGestures();
  }

  // Setup swipe gestures for mobile
  setupSwipeGestures() {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      if (window.innerWidth > 768) return;
      
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!isDragging || window.innerWidth > 768) return;
      
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;

      // Swipe from left edge to open
      if (!this.isOpen && startX < 20 && deltaX > 50) {
        this.open();
        isDragging = false;
      }
      
      // Swipe left to close when menu is open
      if (this.isOpen && deltaX < -50) {
        this.close();
        isDragging = false;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // Open mobile menu
  open() {
    if (!this.isMobile()) return;

    this.isOpen = true;
    
    if (this.sidebar) {
      this.sidebar.classList.add('mobile-open');
      this.sidebar.setAttribute('aria-hidden', 'false');
    }
    
    if (this.overlay) {
      this.overlay.classList.add('show');
    }
    
    if (this.toggleButton) {
      this.toggleButton.setAttribute('aria-expanded', 'true');
      this.toggleButton.innerHTML = '✕';
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus management
    this.trapFocus();
  }

  // Close mobile menu
  close() {
    this.isOpen = false;
    
    if (this.sidebar) {
      this.sidebar.classList.remove('mobile-open');
      this.sidebar.setAttribute('aria-hidden', 'true');
    }
    
    if (this.overlay) {
      this.overlay.classList.remove('show');
    }
    
    if (this.toggleButton) {
      this.toggleButton.setAttribute('aria-expanded', 'false');
      this.toggleButton.innerHTML = '☰';
    }

    // Restore body scroll
    document.body.style.overflow = '';
    
    // Return focus to toggle button
    if (this.toggleButton) {
      this.toggleButton.focus();
    }
  }

  // Toggle mobile menu
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Check if current viewport is mobile
  isMobile() {
    return window.innerWidth <= 768;
  }

  // Handle window resize
  handleResize() {
    if (!this.isMobile() && this.isOpen) {
      // Close menu if viewport becomes desktop size
      this.close();
    }
    
    // Show/hide toggle button based on screen size
    if (this.toggleButton) {
      this.toggleButton.style.display = this.isMobile() ? 'flex' : 'none';
    }
  }

  // Trap focus within sidebar when open
  trapFocus() {
    if (!this.sidebar || !this.isOpen) return;

    const focusableElements = this.sidebar.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    // Handle tab key
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const removeTrapListener = () => {
      document.removeEventListener('keydown', handleTab);
    };

    document.addEventListener('keydown', handleTab);
    
    // Remove listener when menu closes
    const checkClosed = () => {
      if (!this.isOpen) {
        removeTrapListener();
      } else {
        requestAnimationFrame(checkClosed);
      }
    };
    checkClosed();
  }

  // Get current state
  getState() {
    return {
      isOpen: this.isOpen,
      isMobile: this.isMobile()
    };
  }

  // Programmatically set menu state
  setState(isOpen) {
    if (isOpen) {
      this.open();
    } else {
      this.close();
    }
  }
}

// Touch and gesture helpers
class TouchHelpers {
  static addTouchRipple(element) {
    element.addEventListener('touchstart', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.touches[0].clientX - rect.left - size / 2;
      const y = e.touches[0].clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  static preventIosZoom() {
    // Prevent iOS zoom on form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.style.fontSize) {
        input.style.fontSize = '16px';
      }
    });
  }

  static enableFastClick() {
    // Remove 300ms delay on touch devices
    document.addEventListener('touchstart', function() {}, { passive: true });
  }
}

// Auto-initialize mobile menu
let mobileMenu;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mobileMenu = new MobileMenuManager();
    TouchHelpers.preventIosZoom();
    TouchHelpers.enableFastClick();
    
    // Add touch ripple to buttons
    document.querySelectorAll('.btn, .menu-item').forEach(element => {
      TouchHelpers.addTouchRipple(element);
    });
  });
} else {
  mobileMenu = new MobileMenuManager();
  TouchHelpers.preventIosZoom();
  TouchHelpers.enableFastClick();
}

// Global access
window.mobileMenu = mobileMenu;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MobileMenuManager, TouchHelpers };
}