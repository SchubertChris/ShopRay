// ShopRay Admin — Service Worker für Web Push Notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'ShopRay Admin', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'ShopRay Admin', {
      body:  data.body  ?? '',
      icon:  '/favicon.svg',
      badge: '/favicon.svg',
      tag:   'shopray-order',
      data:  { url: data.url ?? '/' },
      vibrate: [100, 50, 100],
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
