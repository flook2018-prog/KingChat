// Service Worker for KingChat PWA// Service Worker for KingChat// Service Worker for KingChat PWA - DISABLED for debugging// Service Worker for KingChat PWA - DISABLED for debugging

const CACHE_NAME = 'kingchat-v1.0';

const CACHE_NAME = 'kingchat-v1.0';

// Basic service worker - just pass through requests

self.addEventListener('install', (event) => {const STATIC_CACHE_NAME = 'kingchat-static-v1.0';console.log('Service Worker: Disabled for debugging');console.log('Service Worker: Disabled for debugging');

  console.log('Service Worker: Installing...');

  self.skipWaiting();const DYNAMIC_CACHE_NAME = 'kingchat-dynamic-v1.0';

});



self.addEventListener('activate', (event) => {

  console.log('Service Worker: Activating...');// Static cache files

  event.waitUntil(self.clients.claim());

});const STATIC_CACHE_FILES = [// Empty service worker to prevent errors// Empty service worker to prevent errors



self.addEventListener('fetch', (event) => {  '/',

  // Pass through all requests without caching

  return;  '/index.html',self.addEventListener('install', (event) => {self.addEventListener('install', (event) => {

});

  '/css/style.css',

console.log('Service Worker: Loaded');
  '/css/line-theme.css',  console.log('SW: Install event - skipping cache');  console.log('SW: Install event - skipping cache');

  '/css/mobile.css',

  '/js/app.js',  self.skipWaiting();  self.skipWaiting();

  '/js/auth.js',

  '/js/menu.js',});});

  '/js/menu-fixed.js',

  '/js/socket.js',

  '/js/theme.js',

  '/js/utils.js',self.addEventListener('activate', (event) => {self.addEventListener('activate', (event) => {

  '/js/auto-save.js',

  '/js/breadcrumb.js',  console.log('SW: Activate event - skipping cache cleanup');  console.log('SW: Activate event - skipping cache cleanup');

  '/js/mobile.js',

  '/js/notifications.js',  event.waitUntil(self.clients.claim());  event.waitUntil(self.clients.claim());

  '/js/login.js',

  '/pages/chat.html',});});

  '/pages/customers.html',

  '/pages/lineoa.html',

  '/pages/admin.html',

  '/pages/profile.html',self.addEventListener('fetch', (event) => {self.addEventListener('fetch', (event) => {

  '/pages/settings.html'

];// Static cache files

const STATIC_CACHE_FILES = [

// API endpoints to cache dynamically  '/',

const API_CACHE_PATTERNS = [  '/index.html',

  /\/api\/auth\/profile/,  '/css/style.css',

  /\/api\/customers/,  '/css/line-theme.css',

  /\/api\/lineoa/,  '/css/mobile.css',

  /\/api\/settings/  '/js/app.js',

];  '/js/auth.js',

  '/js/menu.js',

// Install event - cache static files  '/js/menu-fixed.js',

self.addEventListener('install', (event) => {  '/js/socket.js',

  console.log('Service Worker: Installing...');  '/js/theme.js',

  event.waitUntil(  '/js/utils.js',

    caches.open(STATIC_CACHE_NAME)  '/js/auto-save.js',

      .then(cache => {  '/js/breadcrumb.js',

        console.log('Service Worker: Caching static files');  '/js/mobile.js',

        return cache.addAll(STATIC_CACHE_FILES);  '/js/notifications.js',

      })  '/js/login.js',

      .catch(err => {  '/pages/chat.html',

        console.log('Service Worker: Cache failed', err);  '/pages/customers.html',

      })  '/pages/lineoa.html',

  );  '/pages/admin.html',

});  '/pages/profile.html',

  '/pages/settings.html'

// Activate event - clean old caches];

self.addEventListener('activate', (event) => {

  console.log('Service Worker: Activating...');// API endpoints to cache dynamically

  event.waitUntil(const API_CACHE_PATTERNS = [

    caches.keys()  /\/api\/auth\/profile/,

      .then(cacheNames => {  /\/api\/customers/,

        return Promise.all(  /\/api\/lineoa/,

          cacheNames.map(cacheName => {  /\/api\/settings/

            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {];

              console.log('Service Worker: Deleting old cache', cacheName);

              return caches.delete(cacheName);// Install event - cache static files

            }self.addEventListener('install', (event) => {

          })  console.log('Service Worker: Installing...');

        );  

      })  event.waitUntil(

  );    Promise.all([

});      // Cache static files

      caches.open(STATIC_CACHE).then((cache) => {

// Fetch event - serve cached content when offline        console.log('Service Worker: Caching static files');

self.addEventListener('fetch', (event) => {        return cache.addAll(STATIC_FILES.map(url => {

  // Skip non-http(s) requests          return new Request(url, { credentials: 'same-origin' });

  if (!event.request.url.startsWith('http')) {        }));

    return;      }),

  }      

      // Skip waiting to activate immediately

  // Handle API requests differently      self.skipWaiting()

  if (event.request.url.includes('/api/')) {    ])

    event.respondWith(  );

      fetch(event.request)});

        .then(response => {

          // Clone response for caching// Activate event - clean up old caches

          const responseClone = response.clone();self.addEventListener('activate', (event) => {

            console.log('Service Worker: Activating...');

          // Cache successful API responses  

          if (response.status === 200) {  event.waitUntil(

            caches.open(DYNAMIC_CACHE_NAME)    Promise.all([

              .then(cache => {      // Clean up old caches

                cache.put(event.request, responseClone);      caches.keys().then((cacheNames) => {

              });        return Promise.all(

          }          cacheNames.map((cacheName) => {

                      if (cacheName !== STATIC_CACHE && 

          return response;                cacheName !== DYNAMIC_CACHE && 

        })                cacheName !== CACHE_NAME) {

        .catch(() => {              console.log('Service Worker: Deleting old cache:', cacheName);

          // Return cached version if available              return caches.delete(cacheName);

          return caches.match(event.request);            }

        })          })

    );        );

    return;      }),

  }      

      // Take control of all clients

  // Handle static files      self.clients.claim()

  event.respondWith(    ])

    caches.match(event.request)  );

      .then(response => {});

        // Return cached version if available

        if (response) {// Fetch event - handle requests with cache strategies

          return response;self.addEventListener('fetch', (event) => {

        }  const { request } = event;

          const url = new URL(request.url);

        // Fetch from network and cache

        return fetch(event.request)  // Skip non-GET requests

          .then(response => {  if (request.method !== 'GET') {

            // Clone response for caching    return;

            const responseClone = response.clone();  }

            

            // Cache successful responses  // Skip chrome-extension and other non-http(s) requests

            if (response.status === 200) {  if (!request.url.startsWith('http')) {

              caches.open(DYNAMIC_CACHE_NAME)    return;

                .then(cache => {  }

                  cache.put(event.request, responseClone);

                });  // Handle different types of requests

            }  if (url.pathname.startsWith('/api/')) {

                // API requests - network first with cache fallback

            return response;    event.respondWith(handleApiRequest(request));

          });  } else if (isStaticAsset(url.pathname)) {

      })    // Static assets - cache first

      .catch(() => {    event.respondWith(handleStaticAsset(request));

        // Return offline page for navigation requests  } else {

        if (event.request.mode === 'navigate') {    // HTML pages - network first with cache fallback

          return caches.match('/index.html');    event.respondWith(handlePageRequest(request));

        }  }

      })});

  );

});// Handle API requests - Network first strategy

async function handleApiRequest(request) {

// Handle push notifications  const url = new URL(request.url);

self.addEventListener('push', (event) => {  

  console.log('Service Worker: Push received');  try {

      // Try network first

  if (event.data) {    const response = await fetch(request);

    const data = event.data.json();    

        // Cache successful GET requests for certain endpoints

    const options = {    if (response.ok && shouldCacheApiResponse(url.pathname)) {

      body: data.body || 'มีข้อความใหม่',      const cache = await caches.open(DYNAMIC_CACHE);

      icon: '/icons/icon-192.png',      cache.put(request, response.clone());

      badge: '/icons/badge-72.png',    }

      tag: 'kingchat-notification',    

      vibrate: [100, 50, 100],    return response;

      data: {  } catch (error) {

        url: data.url || '/'    console.log('Network failed for API request, trying cache:', url.pathname);

      },    

      actions: [    // Fallback to cache

        {    const cachedResponse = await caches.match(request);

          action: 'open',    if (cachedResponse) {

          title: 'เปิด',      return cachedResponse;

          icon: '/icons/open.png'    }

        },    

        {    // Return offline response for failed API requests

          action: 'close',    return new Response(

          title: 'ปิด',      JSON.stringify({ 

          icon: '/icons/close.png'        error: 'Offline', 

        }        message: 'This request failed because you are offline' 

      ]      }),

    };      {

            status: 503,

    event.waitUntil(        headers: { 'Content-Type': 'application/json' }

      self.registration.showNotification(data.title || 'KingChat', options)      }

    );    );

  }  }

});}



// Handle notification clicks// Handle static assets - Cache first strategy

self.addEventListener('notificationclick', (event) => {async function handleStaticAsset(request) {

  console.log('Service Worker: Notification clicked');  try {

      // Try cache first

  event.notification.close();    const cachedResponse = await caches.match(request);

      if (cachedResponse) {

  if (event.action === 'open' || !event.action) {      return cachedResponse;

    const url = event.notification.data?.url || '/';    }

        

    event.waitUntil(    // Fallback to network

      clients.matchAll({ type: 'window' })    const response = await fetch(request);

        .then(clientList => {    

          // Focus existing window if available    // Cache the response

          for (const client of clientList) {    if (response.ok) {

            if (client.url.includes(url) && 'focus' in client) {      const cache = await caches.open(STATIC_CACHE);

              return client.focus();      cache.put(request, response.clone());

            }    }

          }    

              return response;

          // Open new window  } catch (error) {

          if (clients.openWindow) {    console.log('Failed to load static asset:', request.url);

            return clients.openWindow(url);    

          }    // Return a fallback for failed static assets

        })    if (request.url.includes('.css')) {

    );      return new Response('/* Offline fallback */', {

  }        headers: { 'Content-Type': 'text/css' }

});      });

    }

// Handle background sync    

self.addEventListener('sync', (event) => {    if (request.url.includes('.js')) {

  console.log('Service Worker: Background sync triggered');      return new Response('console.log("Offline fallback");', {

          headers: { 'Content-Type': 'text/javascript' }

  if (event.tag === 'background-sync') {      });

    event.waitUntil(    }

      // Perform background sync tasks    

      fetch('/api/sync')    throw error;

        .then(response => {  }

          console.log('Service Worker: Background sync completed');}

        })

        .catch(err => {// Handle page requests - Network first with cache fallback

          console.log('Service Worker: Background sync failed', err);async function handlePageRequest(request) {

        })  try {

    );    // Try network first

  }    const response = await fetch(request);

});    

    // Cache successful responses

console.log('Service Worker: Loaded');    if (response.ok) {
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