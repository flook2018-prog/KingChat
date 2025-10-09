// Loading Manager for KingChat
class LoadingManager {
  constructor() {
    this.createLoadingOverlay();
    this.loadingCount = 0;
  }

  // Create global loading overlay
  createLoadingOverlay() {
    if (document.getElementById('loadingOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <div class="loading-text" id="loadingText">กำลังโหลด</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Show global loading
  show(message = 'กำลังโหลด') {
    this.loadingCount++;
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingText) {
      loadingText.textContent = message;
    }
    
    if (overlay) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  // Hide global loading
  hide() {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    if (this.loadingCount === 0) {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    }
  }

  // Show button loading state
  showButtonLoading(button, originalText) {
    if (button) {
      button.disabled = true;
      button.classList.add('loading');
      button.setAttribute('data-original-text', originalText || button.textContent);
    }
  }

  // Hide button loading state
  hideButtonLoading(button) {
    if (button) {
      button.disabled = false;
      button.classList.remove('loading');
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.textContent = originalText;
        button.removeAttribute('data-original-text');
      }
    }
  }

  // Show skeleton loading for containers
  showSkeletonLoading(container, type = 'default', count = 3) {
    if (!container) return;

    const skeletons = this.generateSkeletons(type, count);
    container.innerHTML = skeletons;
    container.classList.add('loading-state');
  }

  // Generate skeleton HTML
  generateSkeletons(type, count) {
    let skeletonHTML = '';
    
    switch (type) {
      case 'table':
        for (let i = 0; i < count; i++) {
          skeletonHTML += `<div class="skeleton table-skeleton"></div>`;
        }
        break;
        
      case 'card':
        for (let i = 0; i < count; i++) {
          skeletonHTML += `
            <div class="card-skeleton-container">
              <div class="skeleton card-skeleton"></div>
            </div>
          `;
        }
        break;
        
      case 'list':
        for (let i = 0; i < count; i++) {
          skeletonHTML += `
            <div class="list-item-skeleton">
              <div class="skeleton text-skeleton title"></div>
              <div class="skeleton text-skeleton subtitle"></div>
              <div class="skeleton text-skeleton content"></div>
            </div>
          `;
        }
        break;
        
      default:
        for (let i = 0; i < count; i++) {
          skeletonHTML += `<div class="skeleton text-skeleton"></div>`;
        }
    }
    
    return skeletonHTML;
  }

  // Hide skeleton loading
  hideSkeletonLoading(container) {
    if (container) {
      container.classList.remove('loading-state');
    }
  }

  // Show progress bar
  showProgress(container, progress = 0) {
    if (!container) return;

    let progressBar = container.querySelector('.progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressBar.innerHTML = `<div class="progress-bar-fill"></div>`;
      container.appendChild(progressBar);
    }

    const fill = progressBar.querySelector('.progress-bar-fill');
    if (progress === -1) {
      // Indeterminate progress
      fill.classList.add('indeterminate');
      fill.style.width = '30%';
    } else {
      fill.classList.remove('indeterminate');
      fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  }

  // Hide progress bar
  hideProgress(container) {
    if (container) {
      const progressBar = container.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.remove();
      }
    }
  }

  // Show loading dots
  showLoadingDots(element, text = 'กำลังโหลด') {
    if (element) {
      element.innerHTML = `
        ${text}
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    }
  }

  // Wrap API calls with loading
  async withLoading(asyncFunction, options = {}) {
    const {
      globalLoading = true,
      message = 'กำลังโหลด',
      button = null,
      container = null,
      skeletonType = 'default',
      skeletonCount = 3
    } = options;

    try {
      // Show loading states
      if (globalLoading) {
        this.show(message);
      }
      
      if (button) {
        this.showButtonLoading(button);
      }
      
      if (container) {
        this.showSkeletonLoading(container, skeletonType, skeletonCount);
      }

      // Execute function
      const result = await asyncFunction();
      return result;

    } catch (error) {
      console.error('Error in withLoading:', error);
      throw error;
    } finally {
      // Hide loading states
      if (globalLoading) {
        this.hide();
      }
      
      if (button) {
        this.hideButtonLoading(button);
      }
      
      if (container) {
        this.hideSkeletonLoading(container);
      }
    }
  }

  // Auto-retry with loading
  async withRetry(asyncFunction, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 2,
      ...loadingOptions
    } = options;

    let lastError;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.withLoading(asyncFunction, {
          ...loadingOptions,
          message: attempt > 1 ? `กำลังลองใหม่ (${attempt}/${maxRetries})` : loadingOptions.message
        });
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= backoff;
        }
      }
    }

    throw lastError;
  }
}

// Global loading manager instance
const loading = new LoadingManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Loading styles are already added via CSS file
  });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingManager;
}