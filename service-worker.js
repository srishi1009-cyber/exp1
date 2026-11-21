const CACHE_NAME = "rishi-expense-manager-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// INSTALL SERVICE WORKER
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            await cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// ACTIVATE SERVICE WORKER
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key =>
                        key.startsWith("rishi-expense-manager-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});

// FETCH AND OFFLINE SUPPORT
self.addEventListener("fetch", event => {

    const request = event.request;

    // Only handle GET requests
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Only handle requests from this website
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        (async () => {

            // Check cache first
            const cachedResponse = await caches.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            try {

                // Get file from network
                const networkResponse = await fetch(request);

                // Cache successful static files
                if (networkResponse && networkResponse.ok) {

                    const cache = await caches.open(CACHE_NAME);

                    if (
                        request.destination === "document" ||
                        request.destination === "script" ||
                        request.destination === "style" ||
                        request.destination === "image" ||
                        url.pathname.endsWith(".json")
                    ) {
                        await cache.put(
                            request,
                            networkResponse.clone()
                        );
                    }
                }

                return networkResponse;

            } catch (error) {

                // Show cached homepage when offline
                if (request.mode === "navigate") {
                    return caches.match("./index.html");
                }

                return new Response(
                    "You are offline. Please reconnect to the internet.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain"
                        }
                    }
                );
            }
        })()
    );
});