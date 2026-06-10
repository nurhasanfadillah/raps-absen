
const CACHE_NAME = 'raps-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// 1. Install Event: Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activate worker immediately
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Claim control of all clients
});

// 3. Fetch Event: Handle requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Navigation Requests (HTML) - SPA Fallback
  // If navigating to /employees, /payroll, etc., serve index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // B. External Libraries & Images (ESM.sh, Fonts, Tailwind, Google Content) - Stale-While-Revalidate
  // Serve from cache fast, update in background
  if (
    url.hostname.includes('esm.sh') || 
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('cdn-icons-png.flaticon.com') ||
    url.hostname.includes('lh3.googleusercontent.com') // Added for App Images
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Check if valid response
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
        // Return cached response if available, else wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. Default Strategy: Network First, fallback to Cache (for everything else)
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
