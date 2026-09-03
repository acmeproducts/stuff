/* N14 (D-1). The relay always knew whether the push service accepted a message;
   the device never did, so nobody could say which link was breaking — relay not
   sending, push service rejecting, or Android not alerting. The relay now
   reports the outcome to the device and this writes it into the log:
     n14_push_out status=201  the push service ACCEPTED it — the phone was
                              reached, so anything still wrong is on the handset
     n14_push_out status=403/404/410  the push service REJECTED it — the
                              subscription or signing key is wrong
     no line at all           the relay never sent — it still believes the app
                              is awake
   Adds one log line. Changes no behaviour. */
(function () {
  function note(d) {
    var o = d && d.out; if (!o) return;
    try { if (typeof log === 'function') log('n14_push_out', { status: o.status, host: o.host || '', err: o.error || '' }, o.status >= 200 && o.status < 300 ? 'ok' : 'error'); } catch (_) {}
  }
  if (typeof handleRelay === 'function') {
    var _h = handleRelay;
    handleRelay = function (d) { if (d && d.type === 'ev-push-out') { note(d); return; } return _h.apply(this, arguments); };
  }
  if (typeof LISTEN === 'object' && LISTEN && typeof LISTEN.handle === 'function') {
    var _l = LISTEN.handle;
    LISTEN.handle = function (roomId, d) { if (d && d.type === 'ev-push-out') { note(d); return; } return _l.apply(this, arguments); };
  }
})();
