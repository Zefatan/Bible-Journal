const CACHE = 'bible-journal-v2';

// App shell files to cache for offline use
const PRECACHE = ['/', '/index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('localhost') || client.url.includes('bible-journal')) {
          client.focus();
          return;
        }
      }
      clients.openWindow('/');
    })
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always go to network for Bible API and fonts
  if (url.includes('api.bible') || url.includes('googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for everything else (app shell)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
