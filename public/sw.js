// Choose a cache name
const cacheName = 'ExpenseWise-v1';

// List the files to precache
const precacheResources = [
  '/',
  '/dashboard',
  '/transactions',
  '/planner',
  '/reports',
  '/employees',
  '/profile',
  '/upgrade',
  '/manifest.json',
  '/Fintrack(logo).png',
  // You might need to add more assets here, like specific CSS or JS files if they aren't inlined
];

// When the service worker is installed, open a new cache and add all of our precache resources to it
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(precacheResources);
    })
  );
});

// When a new service worker activates, remove any outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== cacheName) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});


// When a fetch request is made, try to serve a cached response first
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first strategy to ensure users get the latest pages,
  // but fall back to the cache if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, return it
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, fetch the resource from the network
      return fetch(event.request).then((networkResponse) => {
        // And cache it for next time
        return caches.open(cacheName).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
