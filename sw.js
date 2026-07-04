// Network-first service worker.
// While ONLINE it always fetches the freshest file from the network (so a new
// deploy shows up immediately — no more stale-cache confusion), and it keeps a
// copy so the wallpaper still works OFFLINE. This is the right model for a live
// wallpaper and permanently fixes the "build not updating" problem.
const CACHE = 'waterdrop-cache';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
