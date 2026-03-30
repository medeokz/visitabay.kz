/* Service Worker для push-уведомлений */
self.addEventListener('push', function (event) {
  if (!event.data) return;
  let data = { title: 'Уведомление', body: '', url: '/' };
  try {
    data = Object.assign(data, event.data.json());
  } catch (_) {
    data.body = event.data.text();
  }
  const options = {
    body: data.body,
    icon: '/visitabay/images/hotels-hero.jpg',
    badge: '/visitabay/images/hotels-hero.jpg',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const w of list) {
        if (w.url.indexOf(self.registration.scope) === 0 && 'focus' in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
