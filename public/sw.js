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
  
  // Skip cross-origin requests (Supabase, Google Ads, etc.)
  if (url.origin !== self.location.origin) return;

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        // If the request was for an asset and we got it, optionally cache it
        return response;
      }).catch(() => {
        // Fallback to index.html for navigation requests (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html').then(fallback => {
            return fallback || new Response('Network error occurred. Please refresh.', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        }
        // Return a valid empty response if fetch fails for non-navigation
        return new Response('', { status: 408, statusText: 'Network Error' });
      });
    })
  );
});

