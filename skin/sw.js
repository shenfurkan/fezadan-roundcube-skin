// @ts-check
// Online-only mail app. No CacheStorage, precache, message or attachment storage.
const mailWorker = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

mailWorker.addEventListener('install', event => {
    event.waitUntil(mailWorker.skipWaiting());
});

mailWorker.addEventListener('activate', event => {
    event.waitUntil(mailWorker.clients.claim());
});

mailWorker.addEventListener('fetch', event => {
    const request = event.request;
    // Leave credentials POSTs, AJAX, attachments, previews and remote images alone.
    if (request.method !== 'GET' || request.mode !== 'navigate' || request.destination !== 'document'
        || new URL(request.url).origin !== mailWorker.location.origin) return;

    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => new Response(
        'No connection. Check your internet connection and reload to open your mail.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' } }
    )));
});
