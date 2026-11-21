const CACHE_NAME = "rishi-expense-manager-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// INSTALL
self.addEventListener("install", event => {

    event.waitUntil(
        (async () => {

            const cache = await caches.open(CACHE_NAME);

            // Cache available files without failing the entire installation
            await Promise.allSettled(
                FILES_TO_CACHE.map(file => cache.add(file))
            );

            await self.skipWaiting();

        })()
    );

});

// ACTIVATE
self.addEventListener("activate", event => {

    event.waitUntil(
        (async () => {

            const cacheKeys = await caches.keys();

            await Promise.all(
                cacheKeys
                    .filter(key =>
                        key.startsWith("rishi-expense-manager-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            );

            await self.clients.claim();

        })()
    );

});

// FETCH
self.addEventListener("fetch", event => {

    const request = event.request;

    // Only handle GET requests
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Only handle this website's requests
    if (url.origin !== self.location.origin) return;

    // Ignore unsupported protocols
    if (url.protocol !== "https:" && url.protocol !== "http:") return;

    event.respondWith(
        (async () => {

            const cache = await caches.open(CACHE_NAME);

            // HTML navigation: network first
            if (request.mode === "navigate") {

                try {

                    const response = await fetch(request);

                    if (response.ok) {
                        await cache.put(request, response.clone());
                    }

                    return response;

                } catch (error) {

                    return (
                        await cache.match(request)
                    ) || (
                        await cache.match("./index.html")
                    ) || new Response(
                        "App unavailable offline.",
                        { status: 503 }
                    );

                }

            }

            // Other files: cache first
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            try {

                const response = await fetch(request);

                if (response.ok) {

                    await cache.put(
                        request,
                        response.clone()
                    );

                }

                return response;

            } catch (error) {

                return new Response(
                    "You are offline. Please reconnect.",
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
