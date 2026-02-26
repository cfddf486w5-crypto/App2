const CACHE_NAME = 'dl-wms-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/css/theme.css',
    '/css/layout.css',
    '/js/app.js',
    '/js/router.js',
    '/js/store.js',
    '/js/ai.js',
    '/pages/modules.html',
    '/pages/consolidation.html',
    '/pages/history.html',
    '/pages/settings.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return networkResponse;
                })
                .catch(() => caches.match('/index.html'));
        })
    );
});
