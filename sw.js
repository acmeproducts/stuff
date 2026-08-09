/* TalkBridge service worker — v5.8.2. Navigations always come from the network. */
var CACHE='tb-v582';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  /* Never let an old root-scoped worker revive stale application HTML. */
  if(e.request.mode==='navigate')return;
  e.respondWith(
    fetch(e.request).catch(function(){return caches.match(e.request);})
  );
});
