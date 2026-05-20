// Service Worker for Tarefas Realizadas PWA
const CACHE_VERSION = 'v10-2026-05-17-pdfbg';
const CACHE_NAME = `tarefas-${CACHE_VERSION}`;

// Assets to cache (same-origin only — external CDNs are handled at runtime)
const STATIC_ASSETS = [
  './',
  './tarefas-realizadas.html',
  './manifest.json',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('SW: some assets failed to cache:', err);
      })
    ).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('tarefas-') && k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML (so updates show up), cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache Firebase/Firestore/Storage requests
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('firebasestorage.googleapis.com') ||
      url.hostname.includes('firebasestorage.app') ||
      url.hostname.includes('appspot.com')) {
    return; // let browser handle normally (online-only)
  }

  // For navigation/HTML — network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
          return resp;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./tarefas-realizadas.html')))
    );
    return;
  }

  // For other same-origin assets — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return resp;
        });
      })
    );
  }
});
