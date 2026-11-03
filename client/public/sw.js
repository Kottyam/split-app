/* Kharcha PWA service worker: network-first pages, cache-first static assets, offline fallback. */
const CACHE = 'kharcha-web-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icons/kharcha-logo-mark.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    // Every route (including /s/... share links) is the single-page app shell.
    event.respondWith(fetch(request).catch(() => caches.match('/index.html').then(r => r || caches.match('/'))));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
      return response;
    })));
  }
});
