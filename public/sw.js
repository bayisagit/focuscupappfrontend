// AASTU Focus Football Cup Service Worker (Production-Grade PWA)
const CACHE_NAME = 'focus-cup-v3';

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('Pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Only process GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Parse URL: Never intercept cross-origin API calls (Render backend, Cloudinary, etc.)
  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  if (url.origin !== self.location.origin) {
    return; // Pass through directly to standard network
  }

  // 3. Do not intercept local API routes or Next.js RSC payload queries
  if (url.pathname.startsWith('/api/') || url.searchParams.has('_rsc')) {
    return;
  }

  // 4. HTML Page Navigation: Network-First with cached root fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          const root = await caches.match('/');
          if (root) return root;

          // Safe fallback page if completely offline and not in cache
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Focus Football Cup</title><style>body{background:#0B132B;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center}.card{background:#1C2541;padding:32px;border-radius:24px;border:1px solid #2C3960;max-width:380px;box-shadow:0 20px 40px rgba(0,0,0,0.5)}.btn{background:#10B981;color:#0B132B;font-weight:bold;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;margin-top:20px}</style></head><body><div class="card"><h2>Focus Football Cup</h2><p>Reconnecting to network. Please tap below to reload.</p><a href="javascript:location.reload()" class="btn">Reload Page</a></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 5. Static Assets (_next/static, images, fonts, icons): Stale-While-Revalidate
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For any other request, do not intercept, allowing browser standard pipeline
});
