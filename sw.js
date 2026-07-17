// Cultivate — service worker
// Caches the app shell so it launches instantly and works offline once installed.
//
// IMPORTANT: bump CACHE_NAME any time the list of cached files changes, and it's good practice
// to bump it on any meaningful release even if this list doesn't change — browsers only notice
// a service worker update when the sw.js file's bytes change, so changing this string is what
// makes browsers pick up new files at all.
const CACHE_NAME = 'cultivate-v28';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Firebase/Firestore/auth calls: let them pass straight through, untouched.
//
// The HTML document itself: always try the network FIRST so that pushing an update to GitHub
// shows up the next time the app loads, falling back to the cached copy only when offline.
// (Cache-first here was the bug — it meant browsers kept serving the very first version
// forever, regardless of what got deployed afterward.)
//
// Everything else (icons, manifest): cache-first is fine, since those essentially never change.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  const isDocument = event.request.mode === 'navigate'
    || url.pathname.endsWith('/index.html')
    || url.pathname.endsWith('/');

  if (isDocument) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
