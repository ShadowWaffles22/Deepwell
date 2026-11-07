// Offline support. The cache name changes on every build, the page loads network-first, so updates show on the next load.
const CACHE = 'deepwell-__VERSION__';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;
  // the page itself: network first, so a new version shows up on the very next load (cache only when offline)
  if (sameOrigin && (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname))) {
    e.respondWith(caches.open(CACHE).then(async cache => {
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r && r.ok) cache.put('index.html', r.clone()); return r; }
      catch (err) { return (await cache.match('index.html')) || new Response('Offline', { status: 503 }); }
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) return hit;
    const r = await net;
    if (r) return r;
    if (req.mode === 'navigate') return cache.match('index.html');
    return new Response('', { status: 504 });
  }));
});
