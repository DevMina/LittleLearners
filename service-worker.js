// Bump this version string whenever assets change to invalidate old caches
const CACHE_VERSION = "v4";
const CACHE_NAME = "little-learners-" + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./profiles.html",
  "./cards.html",
  "./game-match.html",
  "./game-find.html",
  "./trace.html",
  "./custom.html",
  "./sentence.html",
  "./digest.html",
  "./settings.html",
  "./print.html",
  "./manifest.json",
  "./css/style.css",
  "./js/data.js",
  "./js/profiles.js",
  "./js/profiles-ui.js",
  "./js/storage.js",
  "./js/app.js",
  "./js/cards.js",
  "./js/game-match.js",
  "./js/game-find.js",
  "./js/trace.js",
  "./js/custom.js",
  "./js/sentence.js",
  "./js/digest.js",
  "./js/settings.js",
  "./js/print.js",
  "./img/icon-192.png",
  "./img/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for app shell assets, falling back to network; network-first for anything else
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
