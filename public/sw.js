const CACHE_NAME = 'qreview-pro-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For navigation requests (like index.html), use a Network First strategy
  // This ensures users always get the latest version of your Vite app after a deployment
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If we successfully get a new index.html, update the cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline, fallback to the cached version
          return caches.match('/index.html').then((fallback) => {
            return fallback || new Response('Network error occurred. Please refresh.', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
    return;
  }

  // For all other assets, use Cache First strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).catch(() => {
        return new Response('', { status: 408, statusText: 'Network Error' });
      });
    })
  );
});

