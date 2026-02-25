const CACHE_NAME = 'dl-wms-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/theme.css',
    '/css/layout.css',
    '/js/app.js',
    '/js/router.js',
    '/js/store.js',
    '/js/ai.js',
    '/pages/modules.html',
    '/pages/consolidation.html'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                // Return offline fallback if network fails
                return caches.match('/index.html');
            });
        })
    );
});
