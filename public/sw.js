/**
 * Samadhan Setu Service Worker
 * Provides offline shell caching, stale-while-revalidate for assets,
 * and seamless offline fallback for citizens & field officers.
 */

const CACHE_NAME = 'samadhan-setu-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.jpg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests, SSE stream, and API mutation endpoints
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/events') ||
    url.pathname.startsWith('/api/whatsapp') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Stale-while-revalidate strategy for UI assets and HTML
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || cachedResponse;
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
