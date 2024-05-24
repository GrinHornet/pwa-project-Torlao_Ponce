const CACHE_NAME = 'temperature-v1';

//caching when install event happens
self.addEventListener('install', (event) => {
    console.log('install event')
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll([
            '/',
            '/index.html',
            '/manifest.json',
            '/converter.js',
            '/converter.css',
            '/images/ssNarrow.png',
            '/images/ssWide.png',
            '/images/icon11.png',
            '/offline.html'
        ]);
    })());
    console.log('cached for offline');
});

//deletes old cache versions when activate event happens
self.addEventListener('activate', event => {
    console.log('activate event');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            )
        })
    );
});


self.addEventListener('fetch', event => {
    // if(event.request.url.indexOf('firestore.googleapis.com') === -1){
        event.respondWith(
            (async () => {
                if (navigator.onLine) {
                    // If online, try to fetch the response from the network
                    try {
                        return await fetch(event.request);
                    } catch (error) {
                        console.error('Fetch error:', error);
                    }
                }

                // If offline or fetch fails, try to get the response from the cache
                const cacheRes = await caches.match(event.request);
                if (cacheRes) {
                    return cacheRes;
                }

                // // If not cached, return the offline fallback page
                return caches.match('/offline.html');
            })()
        );
    // }
});
