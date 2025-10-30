// service-worker.js
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

// Встановлення - закешувати всі відео
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кешування відео...");
      return cache.addAll(VIDEO_URLS);
    })
  );
  self.skipWaiting();
});

// Активація - очистити старі кеші
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехоплення запитів - Cache First для відео
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Тільки для відео файлів
  if (
    url.pathname.includes("/assets/videos/") &&
    url.pathname.endsWith(".webm")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("Відео з кешу:", url.pathname);
            return cachedResponse;
          }

          // Якщо немає в кеші - завантажити і закешувати
          return fetch(event.request).then((networkResponse) => {
            // Клонувати відповідь для кешування
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
