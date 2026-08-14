const CACHE_NAME = 'physical-activity-bingo-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles-base.css',
  './overlays.css',
  './display.css?v=20260814-1',
  './helpers.js',
  './data.js',
  './core-ui.js?v=20260814-1',
  './core-play.js',
  './effects.js',
  './sync-display.js?v=20260814-1',
  './config.js?v=20260814-1',
  './manifest.webmanifest?v=20260814-1',
  './assets/inclusive-health-logo.png?v=20260814-1',
  './assets/play-qr.svg?v=20260806-5'
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
