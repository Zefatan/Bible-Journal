const CACHE = 'bible-journal-v3';

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

// FCM data-only messages from scripts/send-reminders.mjs land here even when
// no tab is open. Handled without the Firebase SDK so no config lives in the SW.
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data?.json()?.data || {}; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Daily Bible Journal', {
      body:  data.body || '📖 Your daily devotion is waiting.',
      icon:  '/icon.svg',
      badge: '/icon.svg',
      tag:   'daily-reminder',
      vibrate: [200, 100, 200],
    })
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
