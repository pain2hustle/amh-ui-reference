const CACHE_NAME = "amh-fieldscan-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./panel.css",
  "./nav.js",
  "./effects.js",
  "./intake.js",
  "./dashboard.js",
  "./bee-facts.js",
  "./pwa.js",
  "./dashboard.html",
  "./login.html",
  "./forgot-password.html",
  "./fieldscan.html",
  "./fieldscan-signup.html",
  "./fieldproof.html",
  "./fieldproof-capture.js",
  "./fieldproof-dashboard.js",
  "./icon.svg",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
  );
});
