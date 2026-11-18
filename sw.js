'use strict';

const CACHE_NAME = 'interval-timer-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/main.js',
  './js/store.js',
  './js/sound.js',
  './js/timer.js',
  './js/builder.js',
  './js/schedule.js',
  './js/platform.js',
  './js/i18n.js',
  './js/dict.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
