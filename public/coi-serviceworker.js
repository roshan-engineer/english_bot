/**
 * Cross-Origin Isolation Service Worker
 *
 * Injects Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
 * into every response so that SharedArrayBuffer (required for multi-threaded
 * WASM) is available even in environments where the server cannot set these
 * headers (e.g. Safari, GitHub Pages, simple static hosts).
 *
 * Based on: https://github.com/gzuidhof/coi-serviceworker
 */

const CACHE_VERSION = 'v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin requests; cross-origin requests are passed through
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response and add COEP/COOP headers
        const headers = new Headers(response.headers);
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      })
      .catch((err) => {
        console.error('[coi-serviceworker] fetch failed:', err);
        return new Response('Service Worker fetch failed', { status: 500 });
      })
  );
});
