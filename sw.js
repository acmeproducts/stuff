/* TalkBridge service worker — v5.8.1 (Turn 08 Base). Network-first; cached shell as offline fallback. */
var CACHE='tb-v581';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(function(r){
      if(e.request.mode==='navigate'&&r&&r.ok){var c=r.clone();caches.open(CACHE).then(function(cache){cache.put(e.request,c);});}
      return r;
    }).catch(function(){return caches.match(e.request);})
  );
});
