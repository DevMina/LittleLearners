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
  "./opposites.html",
  "./feelings.html",
  "./rhyme.html",
  "./read.html",
  "./case.html",
  "./moreless.html",
  "./colorhunt.html",
  "./samediff.html",
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
  "./js/opposites.js",
  "./js/feelings.js",
  "./js/rhyme.js",
  "./js/read.js",
  "./js/case.js",
  "./js/moreless.js",
  "./js/colorhunt.js",
  "./js/samediff.js",
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

// ---------- Daily practice reminder (best-effort) ----------
// Periodic Background Sync is the only way a PWA without a push server can fire a
// notification while fully closed — but it's Android/Chrome-only (no iOS Safari support at
// all), and even there the browser decides if/when it actually runs based on its own
// engagement heuristics, so this can't be guaranteed to fire daily, or at all, for every user.
// It also can't check "did the child already practice today" — a service worker has no
// access to this app's localStorage-based progress data — so it's a simple generic nudge,
// not a smart one. See js/app.js's requestPracticeReminder() for where this gets registered.
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-practice-reminder") {
    event.waitUntil(
      self.registration.showNotification("Little Learners", {
        body: "A few minutes of practice today? 🌟",
        icon: "./img/icon-192.png",
        tag: "daily-practice-reminder",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => "focus" in c);
      if (existing) return existing.focus();
      return self.clients.openWindow("./index.html");
    })
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
