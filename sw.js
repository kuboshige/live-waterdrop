// Network-first service worker — FIXED.
// The previous version called fetch(req) with the default cache mode, which
// still reads the browser's HTTP cache (GitHub Pages sends max-age=600), so a
// new deploy stayed hidden for ~10 min. Using { cache: 'reload' } bypasses the
// HTTP cache entirely: online we always get the freshest file and refresh our
// own cache; offline we fall back to the last saved copy.
const CACHE = 'waterdrop-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil((async () => {
  // Nuke any stale caches (including v1) so nothing old can be served
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'reload' });   // bypass HTTP cache
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      return (await caches.match(req)) || Response.error();
    }
  })());
});
