// Breadcrumb Navigation for KingChat
class BreadcrumbManager {
  constructor() {
    this.breadcrumbContainer = null;
    this.routes = new Map();
    this.init();
  }

  init() {
    this.setupBreadcrumbContainer();
    this.registerRoutes();
    this.updateBreadcrumb();
    
    // Update breadcrumb on navigation
    window.addEventListener('popstate', () => {
      this.updateBreadcrumb();
    });
  }

  // Setup breadcrumb container
  setupBreadcrumbContainer() {
    // Check if breadcrumb already exists
    let container = document.querySelector('.breadcrumb-nav');
    
    if (!container) {
      container = document.createElement('nav');
      container.className = 'breadcrumb-nav';
      
      // Find appropriate place to insert breadcrumb
      const mainContent = document.querySelector('.main-content');
      const contentHeader = document.querySelector('.content-header');
      const navbar = document.querySelector('.navbar');
      
      if (contentHeader) {
        contentHeader.insertBefore(container, contentHeader.firstChild);
      } else if (mainContent) {
        mainContent.insertBefore(container, mainContent.firstChild);
      } else if (navbar) {
        navbar.insertAdjacentElement('afterend', container);
      } else {
        document.body.insertBefore(container, document.body.firstChild);
      }
    }

    this.breadcrumbContainer = container;
    this.addBreadcrumbStyles();
  }

  // Add breadcrumb styles
  addBreadcrumbStyles() {
    if (document.getElementById('breadcrumbStyles')) return;

    const style = document.createElement('style');
    style.id = 'breadcrumbStyles';
    style.textContent = `
      .breadcrumb-nav {
        background: var(--bg-primary);
        padding: var(--space-3) var(--space-6);
        border-bottom: 1px solid var(--border-color);
        font-size: var(--font-size-sm);
        margin-top: var(--navbar-height);
        position: sticky;
        top: var(--navbar-height);
        z-index: 100;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        list-style: none;
        margin: 0;
        padding: 0;
        flex-wrap: wrap;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .breadcrumb-item a {
        color: var(--primary);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .breadcrumb-item a:hover {
        color: var(--primary-hover);
        text-decoration: underline;
      }

      .breadcrumb-item.active {
        color: var(--text-secondary);
        font-weight: 500;
      }

      .breadcrumb-separator {
        color: var(--text-muted);
        font-size: 0.8rem;
        user-select: none;
      }

      .breadcrumb-icon {
        font-size: 1rem;
        margin-right: var(--space-1);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .breadcrumb-nav {
          padding: var(--space-2) var(--space-4);
          font-size: var(--font-size-xs);
        }
        
        .breadcrumb {
          gap: var(--space-1);
        }
        
        .breadcrumb-item {
          gap: var(--space-1);
        }

        /* Hide middle items on mobile if too many */
        .breadcrumb-item:not(:first-child):not(:last-child):not(:nth-last-child(2)) {
          display: none;
        }
        
        .breadcrumb-item:nth-child(2)::after {
          content: '...';
          color: var(--text-muted);
          margin: 0 var(--space-1);
        }
      }

      /* Dark mode adjustments */
      [data-theme="dark"] .breadcrumb-nav {
        background: var(--bg-secondary);
        border-color: var(--border-color);
      }
    `;

    document.head.appendChild(style);
  }

  // Register route definitions
  registerRoutes() {
    this.routes.set('/', {
      title: 'หน้าหลัก',
      icon: '🏠',
      path: '/chat.html'
    });
    
    this.routes.set('/chat.html', {
      title: 'แชท',
      icon: '💬'
    });

    this.routes.set('/pages/lineoa.html', {
      title: 'จัดการ LINE OA',
      icon: '📱',
      parent: '/chat.html'
    });

    this.routes.set('/pages/customers.html', {
      title: 'รายชื่อลูกค้า',
      icon: '👥',
      parent: '/chat.html'
    });

    this.routes.set('/pages/admin.html', {
      title: 'จัดการผู้ใช้',
      icon: '⚙️',
      parent: '/chat.html'
    });

    this.routes.set('/pages/profile.html', {
      title: 'โปรไฟล์',
      icon: '👤',
      parent: '/chat.html'
    });

    this.routes.set('/pages/settings.html', {
      title: 'ตั้งค่า',
      icon: '🔧',
      parent: '/chat.html'
    });

    this.routes.set('/login.html', {
      title: 'เข้าสู่ระบบ',
      icon: '🔐'
    });

    // Dynamic routes with parameters
    this.registerDynamicRoutes();
  }

  // Register dynamic routes
  registerDynamicRoutes() {
    // Customer detail route
    this.routes.set('/pages/customer-detail', {
      title: 'รายละเอียดลูกค้า',
      icon: '👤',
      parent: '/pages/customers.html',
      isDynamic: true,
      getTitleFromUrl: (url) => {
        const params = new URLSearchParams(url.search);
        const customerId = params.get('id');
        const customerName = params.get('name');
        return customerName || `ลูกค้า #${customerId}`;
      }
    });

    // Chat with specific customer
    this.routes.set('/pages/chat-customer', {
      title: 'แชทกับลูกค้า',
      icon: '💬',
      parent: '/pages/chat.html',
      isDynamic: true,
      getTitleFromUrl: (url) => {
        const params = new URLSearchParams(url.search);
        const customerName = params.get('customer');
        return customerName ? `แชทกับ ${customerName}` : 'แชท';
      }
    });
  }

  // Update breadcrumb based on current path
  updateBreadcrumb() {
    if (!this.breadcrumbContainer) return;

    const currentPath = this.getCurrentPath();
    const breadcrumbItems = this.generateBreadcrumb(currentPath);
    
    this.renderBreadcrumb(breadcrumbItems);
  }

  // Get current path and handle special cases
  getCurrentPath() {
    const path = window.location.pathname;
    const search = window.location.search;
    
    // Handle special dynamic routes
    if (path === '/pages/customers.html' && search.includes('id=')) {
      return '/pages/customer-detail';
    }
    
    if (path === '/pages/chat.html' && search.includes('customer=')) {
      return '/pages/chat-customer';
    }
    
    return path;
  }

  // Generate breadcrumb items
  generateBreadcrumb(currentPath) {
    const items = [];
    const route = this.routes.get(currentPath);
    
    if (!route) {
      // Fallback for unknown routes
      items.push({
        title: 'หน้าที่ไม่รู้จัก',
        icon: '❓',
        isActive: true
      });
      return items;
    }

    // Build breadcrumb chain
    const chain = this.buildBreadcrumbChain(currentPath);
    
    chain.forEach((routePath, index) => {
      const routeInfo = this.routes.get(routePath);
      const isLast = index === chain.length - 1;
      
      let title = routeInfo.title;
      
      // Handle dynamic titles
      if (routeInfo.isDynamic && routeInfo.getTitleFromUrl) {
        title = routeInfo.getTitleFromUrl(window.location);
      }
      
      items.push({
        title,
        icon: routeInfo.icon,
        path: routeInfo.path || routePath,
        isActive: isLast
      });
    });

    return items;
  }

  // Build breadcrumb chain by following parent relationships
  buildBreadcrumbChain(currentPath) {
    const chain = [];
    let path = currentPath;
    
    // Prevent infinite loops
    const visited = new Set();
    
    while (path && !visited.has(path)) {
      visited.add(path);
      chain.unshift(path);
      
      const route = this.routes.get(path);
      path = route ? route.parent : null;
    }
    
    return chain;
  }

  // Render breadcrumb HTML
  renderBreadcrumb(items) {
    if (items.length === 0) {
      this.breadcrumbContainer.innerHTML = '';
      return;
    }

    const breadcrumbHTML = `
      <ol class="breadcrumb">
        ${items.map((item, index) => `
          <li class="breadcrumb-item ${item.isActive ? 'active' : ''}">
            ${item.isActive ? 
              `<span class="breadcrumb-icon">${item.icon}</span>${item.title}` :
              `<a href="${item.path}">
                <span class="breadcrumb-icon">${item.icon}</span>${item.title}
              </a>`
            }
          </li>
          ${index < items.length - 1 ? '<li class="breadcrumb-separator">›</li>' : ''}
        `).join('')}
      </ol>
    `;

    this.breadcrumbContainer.innerHTML = breadcrumbHTML;
  }

  // Add custom route
  addRoute(path, config) {
    this.routes.set(path, config);
  }

  // Update current page title in breadcrumb
  updateCurrentTitle(title) {
    const currentPath = this.getCurrentPath();
    const route = this.routes.get(currentPath);
    
    if (route) {
      route.title = title;
      this.updateBreadcrumb();
    }
  }

  // Show/hide breadcrumb
  toggle(show = true) {
    if (this.breadcrumbContainer) {
      this.breadcrumbContainer.style.display = show ? 'block' : 'none';
    }
  }

  // Get breadcrumb data for current page
  getCurrentBreadcrumb() {
    const currentPath = this.getCurrentPath();
    return this.generateBreadcrumb(currentPath);
  }
}

// Global breadcrumb manager instance
const breadcrumb = new BreadcrumbManager();

// Convenience functions
window.updateBreadcrumbTitle = (title) => {
  breadcrumb.updateCurrentTitle(title);
};

window.addBreadcrumbRoute = (path, config) => {
  breadcrumb.addRoute(path, config);
};

// Auto-update breadcrumb on hash changes (for SPA-like behavior)
window.addEventListener('hashchange', () => {
  breadcrumb.updateBreadcrumb();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BreadcrumbManager;
}