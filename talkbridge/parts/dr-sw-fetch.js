
/* R-3 (§7.12; 29·pre-ship, the directory release) — THE FETCH HANDLER, additive.
   Chrome's installability needs a worker with a fetch handler; the skeleton
   (tb-skeleton/sw.js) proved the shape. Scoped to what the page itself loads:
   same-origin GETs only — network first, the cache as the fallback, the start
   page for a navigation. A cross-origin request (translation, GitHub, the TURN
   credentials) is never answered from here; a non-GET is never touched. The
   precache tolerates a missing file so the worker always activates (push must
   never wait on a cache). Every handler above is tb-sw3.js, byte for byte. */
var APP_CACHE = 'tb-app-v1';
var APP_ASSETS = ['./', './index.html', './tb-manifest.webmanifest', './tb-manifest-ios.webmanifest', './icon-v2-192.png', './icon-v2-badge-96.png', './flags.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(APP_CACHE).then(function (c) { return Promise.all(APP_ASSETS.map(function (a) { return c.add(a).catch(function () {}); })); }).catch(function () {}));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url; try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  var scopePath = self.registration.scope.replace(self.location.origin, '');
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && url.pathname.indexOf(scopePath) === 0) { var copy = res.clone(); caches.open(APP_CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {}); }
    return res;
  }).catch(function (err) {
    return caches.match(req).then(function (r) { if (r) return r; if (req.mode === 'navigate') return caches.match('./index.html').then(function (p) { if (p) return p; throw err; }); throw err; });
  }));
});
