const CACHE_NAME = 'day-of-play-bingo-v3';
const APP_SHELL = [
  './',
  './index.html',
  './styles-base.css',
  './overlays.css',
  './display.css',
  './helpers.js',
  './data.js',
  './core-ui.js',
  './core-play.js',
  './effects.js',
  './sync-display.js',
  './config.js',
  './manifest.webmanifest',
  './assets/inclusive-health-logo.png',
  './assets/play-qr.png?v=20260806-3'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
