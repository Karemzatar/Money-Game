const CACHE_NAME = 'money-game-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html', // Login page
    '/home.html',  // Dashboard
    '/paybal-wallet.html',
    '/css/style.css',
    '/js/login.js',
    '/js/home.js',
    '/images/icon.svg',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // We try to cache what we can, but don't fail if some missing
            const cachePromises = ASSETS_TO_CACHE.map(url => {
                return fetch(url).then(response => {
                    if (response.ok) {
                        return cache.put(url, response);
                    }
                }).catch(e => console.warn("Failed to cache:", url));
            });
            return Promise.all(cachePromises);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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

self.addEventListener('fetch', (event) => {
    // For API requests, Network First, then fall back to nothing (or cache if we cached data)
    // For pages/assets, Cache First (Stale-While-Revalidate could be better but Cache First is simpler for static)

    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return new Response(JSON.stringify({ error: "Offline" }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
