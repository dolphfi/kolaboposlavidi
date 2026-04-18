const CACHE_NAME = 'kolabopos-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignore webpack hot module replacement and dev server issues
    if (request.url.includes('/ws') || request.url.includes('sockjs-node')) {
        return;
    }
    
    // Only cache GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Stale-While-Revalidate strategy for static assets
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                // Ensure the response is valid and is a basic request (not opaque CORS) before caching
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback mechanism (especially for SPA routing when offline)
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
