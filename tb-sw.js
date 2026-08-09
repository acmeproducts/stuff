/* ─────────────────────────────────────────────────────────────────────────────
   TalkBridge service worker

   Two jobs, and deliberately no more.

   1. Receive a push and raise a notification. The push carries no payload — the
      relay sends a bare wake so no message content ever reaches a third party's
      queue. That means this worker cannot say what was said, and it does not
      pretend to: it says something happened, and opening the app shows what.

   2. Route a notification tap into the app, focusing an existing window rather
      than opening a second one.

   It caches nothing. Offline support is not what this is for, and a cache here
   would silently serve a stale build — which on this project has cost days.
   ───────────────────────────────────────────────────────────────────────────── */

const APP_URL = './';
const TAG = 'talkbridge-activity';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    /* If a window is already open and focused, the app is handling this over
       its own connection and a notification would be noise. */
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clients.some((c) => c.visibilityState === 'visible')) return;

    /* Tell any open-but-hidden window to reconcile, so returning to it is
       already up to date. */
    clients.forEach((c) => { try { c.postMessage({ type: 'tb-push' }); } catch (_) {} });

    await self.registration.showNotification('TalkBridge', {
      body: 'New activity',
      tag: TAG,               /* replaces rather than stacks */
      renotify: true,
      badge: undefined,
      data: { url: APP_URL }
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || APP_URL;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clients) {
      if ('focus' in c) {
        try { c.postMessage({ type: 'tb-notification-open' }); } catch (_) {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
