'use strict';

const CACHE_NAME = 'interval-timer-v7';
const ASSETS = new Array(
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.png',
  './js/main.js',
  './js/store.js',
  './js/sound.js',
  './js/timer.js',
  './js/builder.js',
  './js/schedule.js'
);

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
