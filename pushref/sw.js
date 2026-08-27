/* Minimal reference service worker — canonical pattern, no TalkBridge code. */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{
  const txt=(e.data&&e.data.text())||'(no payload)';
  e.waitUntil(self.registration.showNotification('Push Reference',{body:txt,tag:'pushref-'+Date.now()}));
});
