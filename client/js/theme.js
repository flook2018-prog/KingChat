// Theme Management System for KingChat
class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme();
    this.applyTheme(this.currentTheme);
    this.initializeThemeToggle();
  }

  getStoredTheme() {
    return localStorage.getItem('kingchat-theme') || 'light';
  }

  setStoredTheme(theme) {
    localStorage.setItem('kingchat-theme', theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.updateThemeIcon(theme);
    this.setStoredTheme(theme);
    this.currentTheme = theme;
    
    // Update brand text colors after theme change
    this.updateBrandTextColors();
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme } 
    }));
  }

  updateBrandTextColors() {
    // รอสักครู่ให้ CSS variables โหลดเสร็จ
    setTimeout(() => {
      // รีเฟรช brand animation ให้ใช้สีใหม่
      if (window.brandAnimation) {
        const brandTexts = document.querySelectorAll('.brand-text:not(.navbar .brand-text)');
        brandTexts.forEach(brandText => {
          const letters = brandText.querySelectorAll('.letter');
          letters.forEach(letter => {
            // ไม่ต้องเปลี่ยนสีของ navbar (ให้เป็นขาวเสมอ)
            if (!brandText.closest('.navbar')) {
              letter.style.color = 'var(--text-primary)';
            }
          });
        });
      }
    }, 50);
  }

  updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    
    // Add smooth transition effect
    this.addTransitionEffect();
  }

  addTransitionEffect() {
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  }

  initializeThemeToggle() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupThemeToggle();
      });
    } else {
      this.setupThemeToggle();
    }
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  // Method to ensure theme button exists and is configured
  ensureThemeButton() {
    let themeToggle = document.getElementById('themeToggle');
    
    if (!themeToggle) {
      // Try to find navbar menu to add theme button
      const navbarMenu = document.querySelector('.navbar-menu');
      if (navbarMenu) {
        const themeItem = document.createElement('div');
        themeItem.className = 'navbar-item';
        themeItem.innerHTML = `
          <button class="theme-toggle" id="themeToggle" title="เปลี่ยนโหมดสี">
            <span id="themeIcon">${this.currentTheme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
        `;
        navbarMenu.insertBefore(themeItem, navbarMenu.firstChild);
        this.setupThemeToggle();
      }
    }
  }
}

// Global theme manager instance
let themeManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
  });
} else {
  themeManager = new ThemeManager();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}