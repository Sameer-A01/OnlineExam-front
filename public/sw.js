// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
