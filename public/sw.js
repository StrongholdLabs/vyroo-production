// Vyroo Service Worker — PWA support
const CACHE_NAME = "vyroo-v1";
const STATIC_ASSETS = ["/", "/manifest.json"];

// Install — pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API/navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (Supabase, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip auth-related paths — never cache OAuth redirects
  if (url.pathname.startsWith("/login") || url.pathname.startsWith("/signup") || url.hash.includes("access_token") || url.search.includes("code=")) return;

  // Network-first for navigation requests and API calls
  if (request.mode === "navigate" || url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a copy of navigation responses
          if (response.ok && request.mode === "navigate") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(
            (cached) => {
              if (cached) return cached;
              return new Response(
                '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vyroo — Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0}div{text-align:center}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#94a3b8;font-size:.875rem}</style></head><body><div><h1>You are offline</h1><p>Check your connection and try again.</p></div></body></html>',
                { status: 200, headers: { "Content-Type": "text/html" } }
              );
            }
          );
        })
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/
    )
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
