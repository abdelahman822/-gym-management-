const CACHE_NAME = 'gym-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/1.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
  'https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.6.8/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.6.8/firebase-storage.js',
  'https://cdn.jsdelivr.net/npm/toastify-js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
