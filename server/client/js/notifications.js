// Notification System for KingChat
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultTimeout = 5000;
    this.container = null;
    this.permission = 'default';
    this.init();
  }

  async init() {
    this.createNotificationContainer();
    this.requestPermission();
    this.setupServiceWorker();
    this.addNotificationStyles();
  }

  // Create notification container
  createNotificationContainer() {
    if (document.getElementById('notificationContainer')) return;

    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
    this.container = container;
  }

  // Add notification styles
  addNotificationStyles() {
    if (document.getElementById('notificationStyles')) return;

    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
      .notification-container {
        position: fixed;
        top: calc(var(--navbar-height) + var(--space-4));
        right: var(--space-4);
        z-index: 10000;
        max-width: 400px;
        width: calc(100% - var(--space-8));
      }

      .notification {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        margin-bottom: var(--space-3);
        padding: var(--space-4);
        position: relative;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification.success {
        border-left: 4px solid var(--success);
      }

      .notification.error {
        border-left: 4px solid var(--error);
      }

      .notification.warning {
        border-left: 4px solid var(--warning);
      }

      .notification.info {
        border-left: 4px solid var(--info);
      }

      .notification-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-2);
      }

      .notification-title {
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .notification-icon {
        font-size: 1.2rem;
      }

      .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }

      .notification-close:hover {
        background: var(--bg-secondary);
      }

      .notification-body {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.5;
      }

      .notification-actions {
        margin-top: var(--space-3);
        display: flex;
        gap: var(--space-2);
      }

      .notification-action {
        padding: var(--space-1) var(--space-3);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
        font-size: var(--font-size-xs);
        transition: all 0.2s ease;
      }

      .notification-action:hover {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      .notification-action.primary {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: var(--primary);
        transition: width 0.1s linear;
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        .notification-container {
          top: var(--space-4);
          right: var(--space-2);
          left: var(--space-2);
          width: auto;
          max-width: none;
        }

        .notification {
          transform: translateY(-100px);
        }

        .notification.show {
          transform: translateY(0);
        }
      }

      /* Dark mode */
      [data-theme="dark"] .notification {
        background: var(--bg-secondary);
        border-color: var(--border-color);
      }
    `;

    document.head.appendChild(style);
  }

  // Request browser notification permission
  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  // Setup service worker for push notifications
  async setupServiceWorker() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Show in-app notification
  show(title, options = {}) {
    const {
      type = 'info',
      body = '',
      icon = null,
      timeout = this.defaultTimeout,
      actions = [],
      persistent = false,
      onClick = null,
      onClose = null
    } = options;

    const notification = this.createNotificationElement(title, {
      type,
      body,
      icon,
      timeout,
      actions,
      persistent,
      onClick,
      onClose
    });

    this.addNotification(notification);
    return notification;
  }

  // Create notification element
  createNotificationElement(title, options) {
    const { type, body, icon, timeout, actions, persistent, onClick, onClose } = options;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.dataset.id = Date.now().toString();

    // Get icon based on type
    const typeIcons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const notificationIcon = icon || typeIcons[type] || 'ℹ️';

    notification.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">
          <span class="notification-icon">${notificationIcon}</span>
          ${title}
        </div>
        <button class="notification-close" aria-label="Close notification">&times;</button>
      </div>
      ${body ? `<div class="notification-body">${body}</div>` : ''}
      ${actions.length > 0 ? `
        <div class="notification-actions">
          ${actions.map((action, index) => `
            <button class="notification-action ${action.primary ? 'primary' : ''}" 
                    data-action="${index}">
              ${action.text}
            </button>
          `).join('')}
        </div>
      ` : ''}
      ${!persistent && timeout > 0 ? '<div class="notification-progress"></div>' : ''}
    `;

    // Add event listeners
    this.setupNotificationEvents(notification, { timeout, persistent, onClick, onClose, actions });

    return notification;
  }

  // Setup notification event listeners
  setupNotificationEvents(notification, options) {
    const { timeout, persistent, onClick, onClose, actions } = options;

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeNotification(notification);
      if (onClose) onClose();
    });

    // Click handler
    if (onClick) {
      notification.addEventListener('click', onClick);
    }

    // Action buttons
    const actionButtons = notification.querySelectorAll('.notification-action');
    actionButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (actions[index] && actions[index].handler) {
          actions[index].handler();
        }
        if (!actions[index]?.keepOpen) {
          this.removeNotification(notification);
        }
      });
    });

    // Auto-remove with progress bar
    if (!persistent && timeout > 0) {
      const progressBar = notification.querySelector('.notification-progress');
      let progress = 100;
      const interval = 50;
      const step = (interval / timeout) * 100;

      const progressInterval = setInterval(() => {
        progress -= step;
        if (progressBar) {
          progressBar.style.width = `${Math.max(0, progress)}%`;
        }

        if (progress <= 0) {
          clearInterval(progressInterval);
          this.removeNotification(notification);
          if (onClose) onClose();
        }
      }, interval);

      // Pause progress on hover
      notification.addEventListener('mouseenter', () => {
        clearInterval(progressInterval);
      });

      notification.addEventListener('mouseleave', () => {
        // Resume or restart timeout
        setTimeout(() => {
          this.removeNotification(notification);
          if (onClose) onClose();
        }, 1000);
      });
    }
  }

  // Add notification to container
  addNotification(notification) {
    if (!this.container) return;

    // Remove oldest notification if limit reached
    while (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      if (oldest.parentNode) {
        this.removeNotification(oldest);
      }
    }

    this.notifications.push(notification);
    this.container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
  }

  // Remove notification
  removeNotification(notification) {
    notification.classList.remove('show');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  // Show browser notification
  showBrowserNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Browser notifications not permitted');
      return null;
    }

    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/icon.png',
      badge: options.badge || '/badge.png',
      tag: options.tag || 'kingchat',
      renotify: options.renotify || false,
      silent: options.silent || false,
      vibrate: options.vibrate || [200, 100, 200],
      ...options
    });

    if (options.onClick) {
      notification.addEventListener('click', options.onClick);
    }

    return notification;
  }

  // Convenience methods
  success(title, body, options = {}) {
    return this.show(title, { ...options, type: 'success', body });
  }

  error(title, body, options = {}) {
    return this.show(title, { ...options, type: 'error', body, persistent: true });
  }

  warning(title, body, options = {}) {
    return this.show(title, { ...options, type: 'warning', body });
  }

  info(title, body, options = {}) {
    return this.show(title, { ...options, type: 'info', body });
  }

  // Clear all notifications
  clearAll() {
    this.notifications.forEach(notification => {
      this.removeNotification(notification);
    });
  }

  // Get notification count
  getCount() {
    return this.notifications.length;
  }
}

// Global notification manager instance
const notifications = new NotificationManager();

// Convenience global functions
window.showNotification = (title, options) => notifications.show(title, options);
window.showSuccess = (title, body, options) => notifications.success(title, body, options);
window.showError = (title, body, options) => notifications.error(title, body, options);
window.showWarning = (title, body, options) => notifications.warning(title, body, options);
window.showInfo = (title, body, options) => notifications.info(title, body, options);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}