// Leuro service worker - app shell caching + offline fallback.
//
// Strategy is NETWORK-FIRST (fall back to cache when offline), not
// cache-first: the old cache-first version returned the cached app.js/
// style.css immediately and only refreshed the cache in the background,
// so after every deploy users ran the PREVIOUS build on first load and
// needed a second reload to pick up the new one - a steady source of
// "this worked before" confusion. Network-first trades a little load
// speed for always-current code while keeping full offline support.
// CACHE_NAME is versioned so the activate step drops stale caches.
const CACHE_NAME = "leuro-cache-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API/Supabase/Anthropic calls - always go to network.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/index.html")),
      ),
  );
});
