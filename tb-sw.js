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
const CTX = 'talkbridge-context';        /* cache holding only what a wake needs */

/* One line, both platforms. iOS shows one line and nothing else, so the design
   has to work at that size — the expanded Android view is a bonus, never the
   point. No room names, no message text, no sender: a stranger reading a lock
   screen learns that this app is in use, and nothing more. */
function summarise(counts) {
  const parts = [];
  if (counts.chat) parts.push(counts.chat + (counts.chat === 1 ? ' chat' : ' chats'));
  if (counts.voice) parts.push(counts.voice + (counts.voice === 1 ? ' call' : ' calls'));
  if (counts.video) parts.push(counts.video + (counts.video === 1 ? ' video' : ' videos'));
  if (!parts.length) return 'New activity';
  let line = parts.length === 1 ? parts[0]
    : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  if (counts.rooms > 1) line += ' across ' + counts.rooms + ' rooms';
  return line;
}

/* The app hands over the little the worker needs. Kept in the cache rather than
   in memory because a worker is stopped when idle and woken cold by a push. */
async function saveContext(ctx) {
  const cache = await caches.open(CTX);
  await cache.put('/context', new Response(JSON.stringify(ctx), {
    headers: { 'Content-Type': 'application/json' }
  }));
}

async function loadContext() {
  try {
    const cache = await caches.open(CTX);
    const res = await cache.match('/context');
    return res ? await res.json() : null;
  } catch (_) { return null; }
}

/* Counts are worked out here, from the relay, so nothing but a bare wake ever
   passes through a push service. Without context this cannot count — and says
   so plainly rather than inventing a number. */
async function countMissed(ctx) {
  const counts = { chat: 0, voice: 0, video: 0, rooms: 0 };
  if (!ctx || !ctx.relay || !ctx.app || !ctx.client || !Array.isArray(ctx.rooms)) return null;

  for (const room of ctx.rooms) {
    try {
      const url = ctx.relay.replace(/^ws/, 'http') +
        '?app=' + encodeURIComponent(ctx.app) +
        '&session=' + encodeURIComponent(room.id) +
        '&client=' + encodeURIComponent(ctx.client) +
        '&since=' + encodeURIComponent(room.since || 0);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const msgs = await res.json();
      if (!Array.isArray(msgs) || !msgs.length) continue;

      let touched = false;
      for (const m of msgs) {
        if (m.type === 'chat-msg') { counts.chat++; touched = true; }
        else if (m.type === 'call-start') {
          if (m.kind === 'video') counts.video++; else counts.voice++;
          touched = true;
        }
      }
      if (touched) counts.rooms++;
    } catch (_) {}
  }
  return counts;
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* Android will not offer installation unless the worker handles fetch. This one
   goes straight to the network and caches nothing — the requirement is that a
   handler exists, not that it intercepts anything. A caching handler here would
   serve a stale build, which on this project has cost days. */
/* CONFIRMED, not guessed: Chrome's own installability documentation states a
   no-op fetch handler is specifically detected and disqualified —
   "the fetch event handler cannot be a noop method, meaning it is just a
   placeholder" — after developers widely added empty handlers purely to game
   this exact requirement. The previous handler here (`return;` with no
   response) was precisely that pattern, and is a strong candidate for why
   Android never offered install even with a handler technically registered.
   This one actively responds — passing straight through to the network, never
   caching anything — which is a real handler by Chrome's own current
   detection, while keeping the original design intent: no cache, so nothing
   here can ever serve a stale build. */
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
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

    const ctx = await loadContext();
    const counts = await countMissed(ctx);
    const body = counts ? summarise(counts) : 'New activity';

    await self.registration.showNotification('TalkBridge', {
      body: body,
      tag: TAG,               /* replaces rather than stacks */
      renotify: true,
      data: { url: APP_URL }
    });
  })());
});

/* The app keeps the worker's context current while it is open. */
self.addEventListener('message', (event) => {
  const d = event.data;
  if (!d || d.type !== 'tb-context') return;
  event.waitUntil(saveContext(d.context || null));
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
