// Service Worker for KingChat PWA
const CACHE_NAME = 'kingchat-v1.0.0';
const STATIC_CACHE = 'kingchat-static-v1.0.0';
const DYNAMIC_CACHE = 'kingchat-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/dashboard.html',
  '/login.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/css/login.css',
  '/css/loading.css',
  '/css/mobile.css',
  '/js/auth.js',
  '/js/api.js',
  '/js/theme.js',
  '/js/loading.js',
  '/js/keyboard-shortcuts.js',
  '/js/auto-save.js',
  '/js/breadcrumb.js',
  '/js/mobile.js',
  '/js/notifications.js',
  '/js/dashboard.js',
  '/js/login.js',
  '/pages/chat.html',
  '/pages/customers.html',
  '/pages/lineoa.html',
  '/pages/admin.html',
  '/pages/profile.html',
  '/pages/settings.html'
];

// API endpoints to cache dynamically
const API_CACHE_PATTERNS = [
  /\/api\/auth\/profile/,
  /\/api\/customers/,
  /\/api\/lineoa/,
  /\/api\/settings/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES.map(url => {
          return new Request(url, { credentials: 'same-origin' });
        }));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // HTML pages - network first with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests - Network first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET requests for certain endpoints
    if (response.ok && shouldCacheApiResponse(url.pathname)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request failed because you are offline' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets - Cache first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const response = await fetch(request);
    
    // Cache the response
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Failed to load static asset:', request.url);
    
    // Return a fallback for failed static assets
    if (request.url.includes('.css')) {
      return new Response('/* Offline fallback */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    if (request.url.includes('.js')) {
      return new Response('console.log("Offline fallback");', {
        headers: { 'Content-Type': 'text/javascript' }
      });
    }
    
    throw error;
  }
}

// Handle page requests - Network first with cache fallback
async function handlePageRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('Network failed for page request, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlinePage = await caches.match('/dashboard.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Last resort - basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KingChat - Offline</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5; 
            }
            .offline-container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            .offline-title { color: #333; margin-bottom: 10px; }
            .offline-message { color: #666; margin-bottom: 20px; }
            .retry-btn { 
              background: #2563eb; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 5px; 
              cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">คุณออฟไลน์อยู่</h1>
            <p class="offline-message">
              ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้<br>
              โปรดตรวจสอบการเชื่อมต่อแล้วลองใหม่
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
              ลองใหม่
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Check if a path is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.includes(ext));
}

// Check if API response should be cached
function shouldCacheApiResponse(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'ดูข้อความ',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'ปิด',
        icon: '/images/xmark.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'KingChat';
    options.icon = data.icon || options.icon;
  }

  event.waitUntil(
    self.registration.showNotification('KingChat', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/dashboard.html')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/dashboard.html')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'send-messages') {
    event.waitUntil(syncMessages());
  }
});

// Sync messages when back online
async function syncMessages() {
  try {
    // Get pending messages from IndexedDB or cache
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Remove from pending messages
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for message sync
async function getPendingMessages() {
  // Implement IndexedDB or cache retrieval
  return [];
}

async function removePendingMessage(id) {
  // Implement pending message removal
  console.log('Removing pending message:', id);
}