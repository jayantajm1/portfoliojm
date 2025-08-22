// Service Worker for Portfolio PWA
const CACHE_NAME = "portfolio-v1.0.0";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/cris.jpg",
  "/index.jpg",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/v4-shims.min.css",
  "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@1,300&display=swap",
  "https://unpkg.com/aos@2.3.1/dist/aos.css",
  "https://unpkg.com/aos@2.3.1/dist/aos.js",
];

// Install Service Worker
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
