/* push-proto service worker — the bare minimum.
   Receives a payload-free push and shows a fixed notification. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  e.waitUntil(self.registration.showNotification('Push proto', {
    body: 'It worked — push received at ' + new Date().toLocaleTimeString(),
    tag: 'push-proto'
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.openWindow('./push.html'));
});
