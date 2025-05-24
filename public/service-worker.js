const CACHE_NAME = 'system64-cache-v1'; // Increment this on any file changes
const urlsToCache = [
  '/',             // Root index.html
  'index.html',    // Main HTML
  '/icons/icon-192x512.png',  // App icon
  '/icons/icon-512x512.png'   // Another icon
];

// Install event - caching essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[ServiceWorker] Failed to cache:', error);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Fetch event - respond with cached assets, then fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {
            if (
              !networkResponse || 
              networkResponse.status !== 200 || 
              networkResponse.type !== 'basic'
            ) {
              return networkResponse; // Don't cache opaque/cross-origin responses
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache).catch(err => {
                  console.warn('[ServiceWorker] Failed to cache:', event.request.url, err);
                });
              });

            return networkResponse;
          })
          .catch(error => {
            console.warn('[ServiceWorker] Fetch failed; maybe offline:', event.request.url);
            // Optional: return custom offline fallback
            // return caches.match('/offline.html');
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );

  self.clients.claim(); // Start controlling all pages
});
