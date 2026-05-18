self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

// Show local notifications dispatched from the page even when in background
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data && data.type === 'notify') {
    const { title, body, tag } = data;
    self.registration.showNotification(title || 'AI Factory', {
      body: body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'ai-factory',
      vibrate: [80, 40, 80],
      renotify: true,
    });
  }
});

self.addEventListener('push', (event) => {
  let payload = { title: 'AI Factory', body: '' };
  try { if (event.data) payload = { ...payload, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [80, 40, 80],
    })
  );
});
