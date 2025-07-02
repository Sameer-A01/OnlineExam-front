// public/sw.js
// self.addEventListener('push', function(event) {
//   const data = event.data?.json() || {};
//   const title = data.title || 'New Notification';
//   const options = {
//     body: data.body || '',
//     icon: '/notification-icon.png',
//     badge: '/notification-badge.png'
//   };

//   event.waitUntil(
//     self.registration.showNotification(title, options)
//   );
// });

self.addEventListener('push', function(event) {
  console.log('[SW] Push Received:', event);
  const data = event.data?.json() || {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    tag: Date.now().toString(),
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification Clicked');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // or your desired route
  );
});
