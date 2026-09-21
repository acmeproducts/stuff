/* ═══════════ GAP PART · C1-signal-queue.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: relaySend
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   C-1 · SIGNALLING SURVIVES A RELAY OUTAGE (§7.14)

   THE EVIDENCE: on Android the signalling socket dies the moment a call starts
   (every socket on the phone dies together — a radio event), the reconnect is
   a fixed 2 s backoff that fails once, and for those ~4 s `relaySend` returns
   false and DROPS every ICE candidate the call produces. The candidates cross
   only when the reconnect handshake happens to trigger a resend. That is the
   4-second lag, to the millisecond, three calls out of three.

   THE CHANGE: `relaySendWhenOpen(m, tries)` already exists (200 ms retries)
   and already carries `call-accept` and `mic-state`. This part wraps
   `relaySend` so that a `webrtc-signal` message it cannot deliver is handed to
   that retry path once, instead of vanishing. Nothing else about the relay —
   heartbeat, hello, chat, history, the 2 s backoff — is touched.

   THE GUARD: `relaySendWhenOpen` calls `relaySend` by name, which is now this
   wrapper. Without a once-flag every retry would enqueue a fresh retry chain.
   The flag is a non-enumerable property so it never reaches the wire.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof relaySend !== 'function' || typeof relaySendWhenOpen !== 'function') return;

  var C1_TRIES = 40;   /* × 200 ms = 8 s; the observed outage is ~4 s */

  function mark(m, v) {
    try { Object.defineProperty(m, '_c1', { value: v, enumerable: false, configurable: true, writable: true }); }
    catch (_) { m._c1 = v; }
  }
  function kindOf(m) {
    try {
      var s = m.signal || {};
      if (s.description) return s.description.type || 'description';
      if (s.candidate) return 'candidate';
      if (s.restart) return 'restart';
    } catch (_) {}
    return 'other';
  }

  var _relaySend = relaySend;
  relaySend = function (m) {
    var ok = _relaySend.apply(this, arguments);
    try {
      if (m && m.type === 'webrtc-signal') {
        if (!ok && !m._c1) {
          mark(m, { t: Date.now(), kind: kindOf(m) });
          log('c1_queued', { kind: m._c1.kind }, 'warn');
          relaySendWhenOpen(m, C1_TRIES);
        } else if (ok && m._c1 && !m._c1.done) {
          m._c1.done = true;
          log('c1_flushed', { kind: m._c1.kind, ms: Date.now() - m._c1.t }, 'ok');
        }
      }
    } catch (_) {}
    return ok;
  };
})();
