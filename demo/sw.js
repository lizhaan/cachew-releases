/* Service worker of the Cachew demo: keeps every file of the demo for offline use.
 *
 * Raise CACHE_VERSION every time any demo file changes. The browser then sees a new sw.js,
 * downloads all files again into a new cache, deletes the old one, and the page reloads once
 * with the new version. Without the bump, people keep the old files.
 */
'use strict';

const CACHE_VERSION = 1;
const CACHE = 'cachew-demo-v' + CACHE_VERSION;

const FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/demo.css',
  './js/core.js',
  './js/art.js',
  './js/ui.js',
  './js/flow.js',
  './js/app.js',
  './js/verdict.js',
  './js/main.js',
  './assets/fonts/inter-regular.woff',
  './assets/fonts/inter-medium.woff',
  './assets/fonts/inter-semibold.woff',
  './assets/fonts/inter-bold.woff',
  './assets/fonts/inter-extrabold.woff',
  './assets/fonts/inter-black.woff',
  './assets/icons/app_icon_512.png',
  './assets/icons/icon_192.png',
  './assets/icons/icon_180.png',
  './assets/icons/cashew.svg',
  './assets/icons/flame.svg',
  './assets/icons/heart.svg',
  './assets/icons/heart_empty.svg',
  './assets/icons/moon.svg',
  './assets/penny/back.png',
  './assets/penny/ball.png',
  './assets/penny/calm.png',
  './assets/penny/lie.png',
  './assets/penny/look.png',
  './assets/penny/love.png',
  './assets/penny/love2.png',
  './assets/penny/peek.png',
  './assets/penny/question.png',
  './assets/penny/sleep.png',
  './assets/penny/sparkle.png',
];

// Download everything up front, skipping the browser's HTTP cache so the new version is really new.
// Each file is tried up to 3 times; one bad download on a weak connection doesn't stop the install
// (a file that still failed is cached the first time the page asks for it).
async function cacheFile(cache, file) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(new Request(file, { cache: 'reload' }));
      if (res.ok) { await cache.put(file, res); return; }
    } catch (e) { /* try again */ }
  }
}
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(FILES.map(f => cacheFile(cache, f))))
      .then(() => self.skipWaiting())
  );
});

// Drop caches of older versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cachew-demo-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first: the demo opens instantly and works without internet.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
