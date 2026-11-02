// AASTU Focus Football Cup Service Worker (PWA installable & non-blocking)
const CACHE_NAME = 'focus-cup-clean-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clear all legacy caches so no stale or corrupted responses remain in browser storage
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// Non-intercepting fetch listener:
// Satisfies PWA installation criteria without calling event.respondWith(),
// allowing Next.js client-side navigation and API streaming to function at 100% native speed.
self.addEventListener('fetch', () => {
  // Let the browser network engine handle all requests naturally
});
