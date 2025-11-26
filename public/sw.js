
const CACHE_NAME = 'expensewise-cache-v2';
const urlsToCache = [
  '/',
  '/offline.html' // A fallback page
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate the service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});


// Cache and return requests
self.addEventListener('fetch', event => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/offline.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Cache hit - return response
            if (response) {
            return response;
            }

            return fetch(event.request).then(
            response => {
                // Check if we received a valid response
                if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
                }

                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                .then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }
            );
        })
    );
});


self.addEventListener('notificationclick', event => {
  const { action, employeeId } = event.notification.data;
  event.notification.close();

  if (action === 'mark_present' && employeeId) {
    // We cannot access the database directly from the service worker.
    // Instead, we will focus a client and send a message.
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // Find the first visible client
        const visibleClient = clientList.find(client => client.visibilityState === 'visible');

        if (visibleClient) {
          // If a client is visible, focus it and send a message.
          visibleClient.navigate(event.notification.data.url).then(client => {
            client.focus();
            client.postMessage({
              type: 'MARK_ATTENDANCE',
              payload: { employeeId, date: new Date().toISOString().split('T')[0] }
            });
          });
        } else if (clients.openWindow) {
          // If no client is visible, open a new window.
          clients.openWindow(event.notification.data.url).then(client => {
             // The message will be sent once the client is ready, handled in the client-side code.
          });
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification.
  } else {
     event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
             if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
  }
});


self.addEventListener('push', event => {
  console.log('Push received:', event.data.text());
  const { title, ...options } = JSON.parse(event.data.text());
  event.waitUntil(
    self.registration.showNotification(title, {
        ...options,
        // Default values
        icon: '/Fintrack(logo).png',
        badge: '/Fintrack(logo).png',
    })
  );
});
