const CACHE_NAME = "video-cache-v1";
const VIDEO_URLS = [
  "/assets/videos/1.webm",
  "/assets/videos/2.webm",
  "/assets/videos/3.webm",
  "/assets/videos/4.webm",
  "/assets/videos/5.webm",
  "/assets/videos/6.webm",
  "/assets/videos/7.webm",
  "/assets/videos/8.webm",
];

// НЕ кешуй при установці
self.addEventListener("install", (event) => {
  console.log("SW: встановлено");
  self.skipWaiting();
});

// Очищення старих кешів
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Кешуй по запиту
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.match(/\/assets\/videos\/.*\.webm$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          if (!response || !response.ok) return response;

          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});
