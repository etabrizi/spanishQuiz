const CACHE_PREFIX = 'spanish-quiz-offline-';
const CACHE_NAME = `${CACHE_PREFIX}__CACHE_VERSION__`;
const PRECACHE_FILES = __PRECACHE_FILES__;

self.addEventListener('install', (event) => {
  // Installation only succeeds once every file is available offline.
  // Updated workers wait until the old app's tabs close before taking over.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_FILES.map((url) => new Request(url, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Keep the page, scripts and questions on the same release, even online.
    const cached = await cache.match(event.request.mode === 'navigate' ? '/index.html' : event.request);
    return cached || fetch(event.request);
  })());
});
