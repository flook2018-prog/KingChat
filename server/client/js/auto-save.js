// Auto-save Manager for KingChat
class AutoSaveManager {
  constructor() {
    this.autoSaveTimers = new Map();
    this.autoSaveConfig = {
      delay: 2000, // 2 seconds delay
      maxRetries: 3,
      retryDelay: 5000 // 5 seconds between retries
    };
    this.autoSaveQueue = new Map();
    this.init();
  }

  init() {
    this.setupAutoSaveIndicator();
    this.registerGlobalFormHandlers();
  }

  // Setup auto-save status indicator
  setupAutoSaveIndicator() {
    if (document.getElementById('autoSaveIndicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'autoSaveIndicator';
    indicator.className = 'auto-save-indicator';
    indicator.innerHTML = `
      <div class="auto-save-content">
        <span class="auto-save-icon">💾</span>
        <span class="auto-save-text">บันทึกแล้ว</span>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .auto-save-indicator {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: var(--space-2) var(--space-3);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        font-size: var(--font-size-sm);
      }

      .auto-save-indicator.show {
        opacity: 1;
        transform: translateY(0);
      }

      .auto-save-indicator.saving {
        background: var(--warning);
      }

      .auto-save-indicator.error {
        background: var(--error);
      }

      .auto-save-content {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .auto-save-icon {
        font-size: 1.2rem;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      .auto-save-indicator.saving .auto-save-icon {
        animation: pulse 1s infinite;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(indicator);
  }

  // Register auto-save for form inputs
  registerAutoSave(element, saveFunction, options = {}) {
    if (!element || typeof saveFunction !== 'function') {
      console.warn('AutoSave: Invalid element or save function');
      return;
    }

    const config = { ...this.autoSaveConfig, ...options };
    const elementId = element.id || `autosave_${Date.now()}`;
    
    if (!element.id) {
      element.id = elementId;
    }

    // Store save function and config
    this.autoSaveQueue.set(elementId, {
      saveFunction,
      config,
      element,
      lastValue: this.getElementValue(element),
      retryCount: 0
    });

    // Add event listeners
    this.addAutoSaveListeners(element, elementId);
  }

  // Add event listeners to element
  addAutoSaveListeners(element, elementId) {
    const events = ['input', 'change', 'blur'];
    
    events.forEach(eventType => {
      element.addEventListener(eventType, (event) => {
        this.handleAutoSaveEvent(elementId, event);
      });
    });

    // Special handling for contenteditable
    if (element.contentEditable === 'true') {
      element.addEventListener('keyup', (event) => {
        this.handleAutoSaveEvent(elementId, event);
      });
    }
  }

  // Handle auto-save events
  handleAutoSaveEvent(elementId, event) {
    const autoSaveData = this.autoSaveQueue.get(elementId);
    if (!autoSaveData) return;

    const currentValue = this.getElementValue(autoSaveData.element);
    
    // Only save if value changed
    if (currentValue === autoSaveData.lastValue) {
      return;
    }

    // Clear existing timer
    if (this.autoSaveTimers.has(elementId)) {
      clearTimeout(this.autoSaveTimers.get(elementId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.performAutoSave(elementId, currentValue);
    }, autoSaveData.config.delay);

    this.autoSaveTimers.set(elementId, timer);
    
    // Update last value
    autoSaveData.lastValue = currentValue;
    
    // Show saving indicator
    this.showAutoSaveStatus('saving', 'กำลังบันทึก...');
  }

  // Get value from different element types
  getElementValue(element) {
    if (element.contentEditable === 'true') {
      return element.innerHTML;
    }
    
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked;
    }
    
    return element.value;
  }

  // Perform auto-save
  async performAutoSave(elementId, value) {
    const autoSaveData = this.autoSaveQueue.get(elementId);
    if (!autoSaveData) return;

    try {
      // Call the save function
      await autoSaveData.saveFunction(value, autoSaveData.element);
      
      // Reset retry count on success
      autoSaveData.retryCount = 0;
      
      // Show success indicator
      this.showAutoSaveStatus('success', 'บันทึกแล้ว');
      
    } catch (error) {
      console.error('Auto-save error:', error);
      
      // Increment retry count
      autoSaveData.retryCount++;
      
      if (autoSaveData.retryCount < autoSaveData.config.maxRetries) {
        // Retry after delay
        setTimeout(() => {
          this.performAutoSave(elementId, value);
        }, autoSaveData.config.retryDelay);
        
        this.showAutoSaveStatus('saving', `กำลังลองใหม่... (${autoSaveData.retryCount}/${autoSaveData.config.maxRetries})`);
      } else {
        // Max retries reached
        this.showAutoSaveStatus('error', 'บันทึกไม่สำเร็จ');
        autoSaveData.retryCount = 0; // Reset for next attempt
      }
    }
  }

  // Show auto-save status
  showAutoSaveStatus(type, message) {
    const indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) return;

    const textElement = indicator.querySelector('.auto-save-text');
    const iconElement = indicator.querySelector('.auto-save-icon');
    
    // Update content
    if (textElement) textElement.textContent = message;
    
    // Update icon based on type
    if (iconElement) {
      switch (type) {
        case 'saving':
          iconElement.textContent = '⏳';
          break;
        case 'success':
          iconElement.textContent = '✅';
          break;
        case 'error':
          iconElement.textContent = '❌';
          break;
        default:
          iconElement.textContent = '💾';
      }
    }

    // Update classes
    indicator.className = `auto-save-indicator ${type}`;
    indicator.classList.add('show');

    // Auto-hide after delay (except for errors)
    if (type !== 'error') {
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 3000);
    } else {
      // Hide error after longer delay
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 5000);
    }
  }

  // Register global form handlers
  registerGlobalFormHandlers() {
    // Auto-detect and register common form elements
    const detectAutoSaveElements = () => {
      const selectors = [
        'textarea[data-autosave]',
        'input[data-autosave]',
        '[contenteditable][data-autosave]',
        '.auto-save'
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          if (!this.autoSaveQueue.has(element.id)) {
            this.registerAutoSaveForElement(element);
          }
        });
      });
    };

    // Run detection on DOM ready and mutations
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', detectAutoSaveElements);
    } else {
      detectAutoSaveElements();
    }

    // Watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const autoSaveElements = node.querySelectorAll ? 
              node.querySelectorAll('[data-autosave], .auto-save') : 
              [];
            
            autoSaveElements.forEach(element => {
              this.registerAutoSaveForElement(element);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Register auto-save for detected elements
  registerAutoSaveForElement(element) {
    const saveEndpoint = element.dataset.autosaveEndpoint;
    const saveKey = element.dataset.autosaveKey || element.name || element.id;
    
    if (!saveEndpoint || !saveKey) {
      console.warn('AutoSave: Missing endpoint or key for element', element);
      return;
    }

    const saveFunction = async (value) => {
      const data = { [saveKey]: value };
      
      // Use global API client if available
      if (typeof api !== 'undefined') {
        return await api.request(saveEndpoint, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        // Fallback to fetch
        const response = await fetch(saveEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      }
    };

    this.registerAutoSave(element, saveFunction, {
      delay: parseInt(element.dataset.autosaveDelay) || 2000
    });
  }

  // Manual save all pending auto-saves
  async saveAll() {
    const promises = [];
    
    this.autoSaveQueue.forEach((autoSaveData, elementId) => {
      // Clear timer and save immediately
      if (this.autoSaveTimers.has(elementId)) {
        clearTimeout(this.autoSaveTimers.get(elementId));
        this.autoSaveTimers.delete(elementId);
      }
      
      const currentValue = this.getElementValue(autoSaveData.element);
      if (currentValue !== autoSaveData.lastValue) {
        promises.push(this.performAutoSave(elementId, currentValue));
      }
    });

    if (promises.length > 0) {
      this.showAutoSaveStatus('saving', 'กำลังบันทึกทั้งหมด...');
      
      try {
        await Promise.all(promises);
        this.showAutoSaveStatus('success', 'บันทึกทั้งหมดแล้ว');
      } catch (error) {
        this.showAutoSaveStatus('error', 'บันทึกไม่สำเร็จบางรายการ');
      }
    }
  }

  // Cleanup auto-save for element
  unregisterAutoSave(elementId) {
    // Clear timer
    if (this.autoSaveTimers.has(elementId)) {
      clearTimeout(this.autoSaveTimers.get(elementId));
      this.autoSaveTimers.delete(elementId);
    }
    
    // Remove from queue
    this.autoSaveQueue.delete(elementId);
  }

  // Get auto-save status for element
  getAutoSaveStatus(elementId) {
    const autoSaveData = this.autoSaveQueue.get(elementId);
    if (!autoSaveData) return null;

    return {
      isRegistered: true,
      hasUnsavedChanges: this.autoSaveTimers.has(elementId),
      retryCount: autoSaveData.retryCount,
      lastValue: autoSaveData.lastValue
    };
  }
}

// Global auto-save manager instance
const autoSave = new AutoSaveManager();

// Convenience function for manual registration
window.registerAutoSave = (element, saveFunction, options) => {
  autoSave.registerAutoSave(element, saveFunction, options);
};

// Auto-save all before page unload
window.addEventListener('beforeunload', () => {
  autoSave.saveAll();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoSaveManager;
}