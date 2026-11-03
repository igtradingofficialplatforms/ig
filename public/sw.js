
const CACHE = 'igtrade-shell-v3';

const CORE = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );

  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(
            key => key.startsWith('igtrade-shell-') && key !== CACHE
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Always fetch latest HTML
  if (
    request.mode === 'navigate' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE).then(cache =>
              cache.put('/index.html', copy)
            );
          }

          return response;
        })
        .catch(() => caches.match('/index.html'))
    );

    return;
  }

  // Other files use normal browser network behavior
});
