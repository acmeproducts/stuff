/* N16 — SHARED DEVICE LOG. Every log line this device writes is also sent to
   one shared file both handsets write to, in arrival order, so the two sides
   of a call can be read together instead of correlated by hand from two
   exports. Batched every few seconds and on the way out; failures are silent
   and never touch the app. Wraps log() and calls through — the existing local
   log is unchanged. */
(function () {
  if (typeof log !== 'function') return;
  var Q = [], SENDING = false;
  var DEV = (function () {
    try {
      var k = 'tb_devlog_name', v = localStorage.getItem(k);
      if (!v) {
        var ua = navigator.userAgent || '';
        v = (/iPhone|iPad|iPod/.test(ua) ? 'iphone' : /Android/.test(ua) ? 'android' : 'desktop')
          + '-' + Math.random().toString(36).slice(2, 5);
        localStorage.setItem(k, v);
      }
      return v;
    } catch (_) { return 'dev'; }
  })();
  function base() {
    try { return (typeof p3RelayHttp === 'function' ? p3RelayHttp() : '').replace(/\/signal.*$/, ''); } catch (_) { return ''; }
  }
  function flush() {
    if (SENDING || !Q.length) return;
    var b = base(); if (!b) return;
    var rows = Q.splice(0, 100);
    SENDING = true;
    fetch(b + '/log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dev: DEV, rows: rows }), keepalive: true })
      .catch(function () {}).then(function () { SENDING = false; });
  }
  var _log = log;
  log = function (ev, d, lvl) {
    try { Q.push({ t: Date.now(), e: ev, d: d || {} }); if (Q.length > 400) Q.shift(); } catch (_) {}
    return _log.apply(this, arguments);
  };
  setInterval(flush, 4000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);
  try { log('n16_devlog', { dev: DEV }); } catch (_) {}
})();
