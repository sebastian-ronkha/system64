const CACHE_NAME = 'system64-cache-v1';
const urlsToCache = [
  '/',             // This represents your index.html at the root for some servers
  'index.html',    // Your main app file
  'icon-192.png',  // Your app icon
  // Add 'icon-512.png' here if you made one and want to cache it
  // e.g., 'icon-512.png',
];

// When the app is "installed" by the browser
self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Opened cache and attempting to save core files.');
        return cache.addAll(urlsToCache)
          .then(() => console.log('Service Worker: Core files successfully cached.'))
          .catch(error => console.error('Service Worker: Failed to cache one or more core files:', error, urlsToCache));
      })
  );
  self.skipWaiting(); // Makes the new service worker activate immediately
});

// When the app makes a request (e.g., for index.html, images)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          function(networkResponse) {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      }
    )
  );
});

// When a new version of the service worker is activated (e.g., after you change CACHE_NAME)
self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME]; // The name of the current cache to keep

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // If this cache name is not in our whitelist, delete it
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of the page immediately
});