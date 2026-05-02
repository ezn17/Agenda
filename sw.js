const CACHE = 'agenda-erick-v2';
const FILES = ['/Agenda/', '/Agenda/index.html', '/Agenda/manifest.json', '/Agenda/icons/icon-192.png', '/Agenda/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for HTML so updates land fast; cache-first for static assets.
  const req = e.request;
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('/Agenda/index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).catch(() => caches.match('/Agenda/index.html')))
  );
});

// Bring user back to the app on notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/Agenda/') && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/Agenda/');
    })
  );
});
