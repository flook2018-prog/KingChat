// Keyboard Shortcuts Manager for KingChat
class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.helpModal = null;
    this.init();
  }

  init() {
    this.registerDefaultShortcuts();
    this.createHelpModal();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  // Register a keyboard shortcut
  register(keys, callback, description = '', category = 'General') {
    const keyString = this.normalizeKeys(keys);
    this.shortcuts.set(keyString, {
      callback,
      description,
      category,
      keys: keys
    });
  }

  // Normalize key combination to consistent format
  normalizeKeys(keys) {
    return keys.toLowerCase()
      .replace(/\s+/g, '')
      .split('+')
      .sort()
      .join('+');
  }

  // Handle keydown events
  handleKeydown(event) {
    // Don't trigger shortcuts when typing in inputs
    if (this.isInputActive()) {
      return;
    }

    const keys = this.getKeysFromEvent(event);
    const keyString = this.normalizeKeys(keys);
    
    const shortcut = this.shortcuts.get(keyString);
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.callback(event);
    }
  }

  // Check if user is currently typing in an input
  isInputActive() {
    const activeElement = document.activeElement;
    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
    const editableTypes = ['text', 'email', 'password', 'search', 'url', 'tel'];
    
    if (inputTypes.includes(activeElement.tagName)) {
      if (activeElement.tagName === 'INPUT') {
        return editableTypes.includes(activeElement.type.toLowerCase());
      }
      return true;
    }
    
    return activeElement.contentEditable === 'true';
  }

  // Get key combination from event
  getKeysFromEvent(event) {
    const keys = [];
    
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.altKey) keys.push('alt');
    if (event.shiftKey) keys.push('shift');
    
    // Handle special keys
    const specialKeys = {
      ' ': 'space',
      'Enter': 'enter',
      'Escape': 'esc',
      'Tab': 'tab',
      'Backspace': 'backspace',
      'Delete': 'delete',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown'
    };
    
    const key = specialKeys[event.key] || event.key.toLowerCase();
    if (key.length === 1 || specialKeys[event.key]) {
      keys.push(key);
    }
    
    return keys.join('+');
  }

  // Register default shortcuts
  registerDefaultShortcuts() {
    // Navigation shortcuts
    this.register('ctrl+/', () => {
      this.focusGlobalSearch();
    }, 'เปิดการค้นหาแบบรวม', 'Navigation');

    this.register('ctrl+h', () => {
      window.location.href = '/dashboard.html';
    }, 'ไปหน้าหลัก', 'Navigation');

    this.register('ctrl+1', () => {
      window.location.href = '/dashboard.html';
    }, 'ไปหน้าหลัก', 'Navigation');

    this.register('ctrl+2', () => {
      window.location.href = '/pages/lineoa.html';
    }, 'ไป LINE OA', 'Navigation');

    this.register('ctrl+3', () => {
      window.location.href = '/pages/customers.html';
    }, 'ไปหน้าลูกค้า', 'Navigation');

    this.register('ctrl+4', () => {
      window.location.href = '/pages/chat.html';
    }, 'ไปหน้าแชท', 'Navigation');

    this.register('ctrl+5', () => {
      window.location.href = '/pages/admin.html';
    }, 'ไปหน้าจัดการผู้ใช้', 'Navigation');

    // Utility shortcuts
    this.register('ctrl+shift+d', () => {
      if (typeof themeManager !== 'undefined') {
        themeManager.toggleTheme();
      }
    }, 'เปลี่ยนโหมดสว่าง/มืด', 'Utility');

    this.register('ctrl+k', () => {
      this.showHelpModal();
    }, 'แสดงคีย์ลัด', 'Utility');

    this.register('esc', () => {
      this.closeAllModals();
    }, 'ปิด Modal ทั้งหมด', 'Utility');

    this.register('ctrl+r', (event) => {
      event.preventDefault();
      this.refreshCurrentPage();
    }, 'รีเฟรชหน้า', 'Utility');

    // Chat shortcuts (only in chat page)
    if (window.location.pathname.includes('chat')) {
      this.register('ctrl+enter', () => {
        this.sendChatMessage();
      }, 'ส่งข้อความ', 'Chat');

      this.register('ctrl+shift+c', () => {
        this.clearChatInput();
      }, 'ล้างข้อความ', 'Chat');
    }

    // Form shortcuts
    this.register('ctrl+s', (event) => {
      event.preventDefault();
      this.saveCurrentForm();
    }, 'บันทึกฟอร์ม', 'Forms');

    this.register('ctrl+z', (event) => {
      if (!this.isInputActive()) {
        event.preventDefault();
        this.undoLastAction();
      }
    }, 'ยกเลิกการกระทำล่าสุด', 'Forms');
  }

  // Focus global search
  focusGlobalSearch() {
    const searchInputs = [
      '#globalSearch',
      '#searchInput',
      '.search-input',
      'input[type="search"]',
      'input[placeholder*="ค้นหา"]'
    ];

    for (const selector of searchInputs) {
      const input = document.querySelector(selector);
      if (input) {
        input.focus();
        input.select();
        return;
      }
    }

    // If no search input found, create a temporary one
    this.createTemporarySearch();
  }

  // Create temporary search overlay
  createTemporarySearch() {
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
      <div class="search-container">
        <input type="text" placeholder="ค้นหาทุกอย่าง... (กด Esc เพื่อปิด)" id="tempSearch">
        <div class="search-results" id="tempSearchResults"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .search-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        z-index: 10000;
        padding-top: 20vh;
      }
      
      .search-container {
        background: var(--bg-primary);
        border-radius: var(--border-radius);
        padding: var(--space-4);
        min-width: 400px;
        max-width: 600px;
        width: 90%;
        box-shadow: var(--shadow-lg);
      }
      
      .search-container input {
        width: 100%;
        padding: var(--space-3);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1.1rem;
      }
      
      .search-results {
        margin-top: var(--space-3);
        max-height: 300px;
        overflow-y: auto;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#tempSearch');
    input.focus();

    // Handle search
    input.addEventListener('input', (e) => {
      this.performGlobalSearch(e.target.value);
    });

    // Close on Esc or outside click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeTemporarySearch(overlay, style);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTemporarySearch(overlay, style);
      }
    }, { once: true });
  }

  // Close temporary search
  closeTemporarySearch(overlay, style) {
    if (overlay) overlay.remove();
    if (style) style.remove();
  }

  // Perform global search
  async performGlobalSearch(query) {
    if (!query.trim()) return;

    try {
      // Simple navigation based search
      const pages = [
        { name: 'หน้าหลัก', url: '/dashboard.html', keywords: ['dashboard', 'หน้าหลัก', 'หน้าแรก'] },
        { name: 'LINE OA', url: '/pages/lineoa.html', keywords: ['lineoa', 'line', 'oa'] },
        { name: 'ลูกค้า', url: '/pages/customers.html', keywords: ['customers', 'ลูกค้า', 'customer'] },
        { name: 'แชท', url: '/pages/chat.html', keywords: ['chat', 'แชท', 'ข้อความ'] },
        { name: 'จัดการผู้ใช้', url: '/pages/admin.html', keywords: ['admin', 'ผู้ใช้', 'user'] },
        { name: 'ตั้งค่า', url: '/pages/settings.html', keywords: ['settings', 'ตั้งค่า', 'config'] }
      ];

      const results = pages.filter(page => 
        page.keywords.some(keyword => 
          keyword.toLowerCase().includes(query.toLowerCase())
        )
      );

      const resultsContainer = document.getElementById('tempSearchResults');
      if (resultsContainer) {
        resultsContainer.innerHTML = results.map(result => `
          <div class="search-result" onclick="window.location.href='${result.url}'">
            <strong>${result.name}</strong>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  // Send chat message
  sendChatMessage() {
    const sendButton = document.querySelector('#sendButton, .send-button, [data-action="send"]');
    if (sendButton) {
      sendButton.click();
    }
  }

  // Clear chat input
  clearChatInput() {
    const chatInput = document.querySelector('#messageInput, .message-input, .chat-input');
    if (chatInput) {
      chatInput.value = '';
      chatInput.focus();
    }
  }

  // Save current form
  saveCurrentForm() {
    const forms = document.querySelectorAll('form');
    const submitButtons = document.querySelectorAll('button[type="submit"], .save-button, [data-action="save"]');
    
    if (submitButtons.length > 0) {
      submitButtons[0].click();
    } else if (forms.length > 0) {
      // Try to submit the first form
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      forms[0].dispatchEvent(submitEvent);
    }
  }

  // Refresh current page
  refreshCurrentPage() {
    window.location.reload();
  }

  // Close all modals
  closeAllModals() {
    const modals = document.querySelectorAll('.modal, .dropdown-menu.show, .search-overlay');
    modals.forEach(modal => {
      if (modal.classList.contains('modal')) {
        modal.style.display = 'none';
      } else if (modal.classList.contains('dropdown-menu')) {
        modal.classList.remove('show');
      } else {
        modal.remove();
      }
    });
  }

  // Undo last action (placeholder)
  undoLastAction() {
    // This would need to be implemented based on specific app needs
    console.log('Undo functionality would be implemented here');
  }

  // Create help modal
  createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'shortcutsHelpModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>⌨️ คีย์ลัด</h3>
          <button class="modal-close" onclick="this.closest('.modal').style.display='none'">&times;</button>
        </div>
        <div class="modal-body">
          <div id="shortcutsList"></div>
        </div>
      </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .modal.show {
        display: flex;
      }
      
      .modal-content {
        background: var(--bg-primary);
        border-radius: var(--border-radius);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--border-color);
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-secondary);
      }
      
      .modal-body {
        padding: var(--space-4);
      }
      
      .shortcut-category {
        margin-bottom: var(--space-4);
      }
      
      .shortcut-category h4 {
        color: var(--primary);
        margin-bottom: var(--space-2);
      }
      
      .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--border-color);
      }
      
      .shortcut-keys {
        background: var(--bg-secondary);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--border-radius);
        font-family: monospace;
        font-size: 0.9rem;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);
    this.helpModal = modal;
  }

  // Show help modal
  showHelpModal() {
    if (!this.helpModal) {
      this.createHelpModal();
    }

    const categorizedShortcuts = this.getCategorizedShortcuts();
    const listContainer = document.getElementById('shortcutsList');
    
    if (listContainer) {
      listContainer.innerHTML = Object.entries(categorizedShortcuts)
        .map(([category, shortcuts]) => `
          <div class="shortcut-category">
            <h4>${category}</h4>
            ${shortcuts.map(shortcut => `
              <div class="shortcut-item">
                <span>${shortcut.description}</span>
                <span class="shortcut-keys">${shortcut.keys}</span>
              </div>
            `).join('')}
          </div>
        `).join('');
    }

    this.helpModal.style.display = 'flex';
  }

  // Get shortcuts organized by category
  getCategorizedShortcuts() {
    const categorized = {};
    
    this.shortcuts.forEach(shortcut => {
      const category = shortcut.category || 'General';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(shortcut);
    });

    return categorized;
  }
}

// Global keyboard shortcuts instance
const keyboardShortcuts = new KeyboardShortcuts();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardShortcuts;
}