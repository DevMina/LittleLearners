// A single, unversioned cache name. Freshness no longer depends on remembering to bump
// anything here — see the fetch handler below for why that's safe.
const CACHE_NAME = "little-learners";

const APP_SHELL = [
  "./",
  "./index.html",
  "./profiles.html",
  "./cards.html",
  "./game-match.html",
  "./game-find.html",
  "./count.html",
  "./sort.html",
  "./phonics.html",
  "./odd.html",
  "./order.html",
  "./trace.html",
  "./sentence.html",
  "./digest.html",
  "./settings.html",
  "./print.html",
  "./contact.html",
  "./review.html",
  "./story.html",
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
  "./js/count.js",
  "./js/sort.js",
  "./js/phonics.js",
  "./js/odd.js",
  "./js/order.js",
  "./js/trace.js",
  "./js/sentence.js",
  "./js/digest.js",
  "./js/settings.js",
  "./js/print.js",
  "./js/contact.js",
  "./js/review.js",
  "./js/story.js",
  "./img/icon-192.png",
  "./img/icon-512.png",
  "./img/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          APP_SHELL.map((url) =>
            fetch(url, { cache: "no-store" }).then((response) => cache.put(url, response))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first, cache as offline fallback. We used to cache-first everything and rely on
// bumping CACHE_VERSION to bust stale entries — but that only works if whoever edits an app
// file *also* remembers to edit this file, since the browser only re-checks for a new service
// worker when service-worker.js's own bytes change. Forgetting that step is exactly how users
// got stuck on an old version. Trying the network first removes that failure mode entirely:
// anyone online always gets the latest copy of every file, and the cache is only ever used
// when there's no network at all — no version bump required, ever.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    // cache: "no-store" bypasses the browser's own HTTP cache too, not just our Cache Storage
    // above — otherwise a stale HTTP-cached response can come back and look like "the network".
    fetch(event.request, { cache: "no-store" })
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request, { cacheName: CACHE_NAME }).then((cached) => {
          if (cached) return cached;
          // Offline and never cached — for a page navigation, fall back to the cached shell
          // rather than letting the browser show its generic offline error.
          if (event.request.mode === "navigate") {
            return caches.match("./index.html", { cacheName: CACHE_NAME });
          }
        })
      )
  );
});
