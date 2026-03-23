// Vyroo Service Worker — minimal, network-first
// Never cache JS/CSS to avoid stale code issues with Vite content-hashed builds

const CACHE_NAME = "vyroo-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clear ALL old caches on activate
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Always go to network — no caching
  // This prevents stale JS/CSS from being served after deploys
});
