// orbital8-sw.js - Service Worker for Caching
// Version: 2025-08-30 01:16 AM

const CACHE_NAME = 'orbital8-dojo-cache-v1';
// IMPORTANT: Add all files that need to be cached for the app to work offline.
const APP_SHELL_URLS = [
    './orbital8-dojo-sw.html',
    './orbital8-metadata-worker.js',
    'https://alcdn.msauth.net/browser/2.28.1/js/msal-browser.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Service Worker: Caching app shell');
            return cache.addAll(APP_SHELL_URLS);
        })
        .catch(error => {
            console.error('Service Worker: Failed to cache app shell:', error);
        })
    );
});

self.addEventListener('fetch', event => {
    // We only want to apply cache-first strategy for GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
        .then(cachedResponse => {
            // If the response is in the cache, return it
            if (cachedResponse) {
                return cachedResponse;
            }

            // If the response is not in the cache, fetch it from the network
            return fetch(event.request).then(
                networkResponse => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !networkResponse.type === 'cors') {
                        return networkResponse;
                    }

                    // IMPORTANT: Clone the response. A response is a stream
                    // and because we want the browser to consume the response
                    // as well as the cache consuming the response, we need
                    // to clone it so we have two streams.
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // We don't want to cache API calls to cloud providers
                            if (!event.request.url.includes('googleapis.com') && !event.request.url.includes('graph.microsoft.com')) {
                                cache.put(event.request, responseToCache);
                            }
                        });

                    return networkResponse;
                }
            ).catch(error => {
                console.error('Service Worker: Fetch failed:', error);
                // You could return a custom offline page here if you had one in the cache
            });
        })
    );
});
