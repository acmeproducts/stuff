/* ═══════════ GAP PART · D1-call-diagnostics.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: TBD1, TBD1.sample, TBD1.turnProbe, TBD1.tick, TBD1.attach, TBD1.state
*/
/* ─────────────────────────────────────────────────────────────────────────────
   D1 · CALL DIAGNOSTICS — READ-ONLY INSTRUMENT, NO FIX

   WHY THIS EXISTS: two device logs show video freezing roughly twenty seconds
   into a call and never coming back, while chat and the transcript keep working
   because they ride the relay socket and reconnect on their own. The cause is
   NOT known. The owner's working theory is that the TURN relay is not being
   kept alive or checked during the call, so the video path never gets a chance
   to recover.

   The accepted build already logs `rtc_conn` and `rtc_recovery`, and it already
   carries a keepalive channel, a video watchdog and a three-step repair ladder.
   What it does NOT record is everything needed to tell those apart:

     · ICE connection state is read but never logged — only `failed` is acted on
     · nothing says whether the media path is going through TURN or peer-to-peer
     · nothing says whether TURN is still answering once the call is under way;
       credentials are fetched once at setup and never checked again
     · nothing says whether the keepalive channel is actually open and sending
     · nothing says whether the video watchdog ever armed
     · nothing measures the picture itself, so "froze" has no timestamp

   This part adds those readings and nothing else.

   SURFACE OWNED BY THIS PART: none. It replaces nothing, wraps nothing, and
   changes no behaviour. It reads the live call objects, attaches ADDITIONAL
   listeners to the peer connection with addEventListener (which does not
   disturb the `onxxx` handlers the recovery ladder installs), and writes log
   lines. Log lines already travel to the shared device log via N16, so the two
   handsets can be read together.

   THE ONE THING IT DOES ON THE NETWORK: a TURN reachability probe. A separate,
   throwaway RTCPeerConnection is built from the SAME iceServers the live call
   is already using — read back off the live connection, no new endpoint, no new
   credential path, no new secret (G19/G20) — forced to `relay` only, and asked
   to gather. If a relay candidate comes back, TURN answered. It is closed the
   moment the first relay candidate arrives or after five seconds, whichever is
   first. It never touches the call's connection, sends no signalling, and
   carries no media.

   DELIBERATELY NOT DONE HERE: no repair, no retry, no change to the recovery
   ladder, no UI. This build exists to produce evidence, and will never be a
   baseline.
   ───────────────────────────────────────────────────────────────────────────── */

var TBD1 = (function () {
  if (typeof log !== 'function') return null;

  var BUILD = { c: 'turn27-ship-diag-d1', file: 'bridge-turn27-ship-diag1.html', base: '956ceb381585' };

  var TICK_MS = 500;        /* how often the live call objects are read      */
  var SAMPLE_EVERY = 4;     /* ticks between getStats samples → every 2s     */
  var PROBE_MS = 15000;     /* how often TURN is re-probed during a call     */
  var PROBE_TIMEOUT = 5000; /* how long a probe waits for a relay candidate  */
  var DEAD_SAMPLES = 2;     /* stats samples with no new frames = frozen     */

  var S = {
    pcSeen: 0, samples: 0, probes: 0,
    lastProbe: 0, lastServers: null,
    cur: null,                       /* per-peer-connection record           */
    inCall: false, callStart: 0,
    recStep: -1, kaState: '', wd: null
  };

  function L(ev, d, lvl) { try { log(ev, d || {}, lvl || 'info'); } catch (_) {} }
  function now() { return Date.now(); }
  function C() { try { return (typeof CALL !== 'undefined' && CALL) ? CALL : null; } catch (_) { return null; } }
  function gen() { try { return (typeof GEN !== 'undefined' && GEN) ? GEN.n : -1; } catch (_) { return -1; } }
  function role() {
    try { var r = (typeof activeRoom === 'function') ? activeRoom() : null; return (r && r.role) || '?'; }
    catch (_) { return '?'; }
  }
  function candType(c) {
    if (!c) return '?';
    if (c.type) return c.type;
    var bits = String(c.candidate || '').split(' ');
    return bits.length > 7 ? bits[7] : '?';
  }
  function netInfo() {
    var o = { on: true };
    try { o.on = navigator.onLine !== false; } catch (_) {}
    try {
      var n = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (n) { o.type = n.effectiveType || n.type; o.down = n.downlink; o.rtt = n.rtt; }
    } catch (_) {}
    return o;
  }

  /* ── Peer connection: additional listeners, never a replacement ─────────── */
  function attach(pc) {
    if (!pc) return null;
    try { if (pc.__tbD1) return pc.__tbD1; } catch (_) { return null; }

    S.pcSeen++;
    var rec = {
      id: S.pcSeen, t0: now(), cands: {}, relayCands: 0,
      ice: '', conn: '', sig: '', gather: '',
      bytes: -1, frames: -1, dead: 0, deadAt: 0, reported: false, pair: ''
    };
    try { Object.defineProperty(pc, '__tbD1', { value: rec, enumerable: false }); } catch (_) { pc.__tbD1 = rec; }

    var c = C();
    rec.ice = pc.iceConnectionState; rec.conn = pc.connectionState;
    rec.sig = pc.signalingState; rec.gather = pc.iceGatheringState;
    L('d1_pc_seen', {
      pc: rec.id, gen: gen(), role: role(), kind: c && c.kind,
      conn: rec.conn, ice: rec.ice, sig: rec.sig, gather: rec.gather
    }, 'ok');

    function transition(field, read) {
      return function () {
        try {
          var v = read();
          if (v === rec[field]) return;
          var was = rec[field]; rec[field] = v;
          L('d1_' + field, { pc: rec.id, from: was, to: v, ms: now() - rec.t0, gen: gen() },
            (v === 'failed') ? 'error' : (v === 'disconnected') ? 'warn' : 'info');
        } catch (_) {}
      };
    }
    try {
      pc.addEventListener('iceconnectionstatechange', transition('ice', function () { return pc.iceConnectionState; }));
      pc.addEventListener('connectionstatechange', transition('conn', function () { return pc.connectionState; }));
      pc.addEventListener('signalingstatechange', transition('sig', function () { return pc.signalingState; }));
      pc.addEventListener('icegatheringstatechange', transition('gather', function () { return pc.iceGatheringState; }));
      pc.addEventListener('icecandidate', function (e) {
        try {
          if (!e.candidate) {
            L('d1_cand_done', { pc: rec.id, ms: now() - rec.t0, types: rec.cands, relay: rec.relayCands },
              rec.relayCands ? 'ok' : 'warn');
            return;
          }
          var t = candType(e.candidate);
          rec.cands[t] = (rec.cands[t] || 0) + 1;
          if (t === 'relay') rec.relayCands++;
        } catch (_) {}
      });
      pc.addEventListener('icecandidateerror', function (e) {
        try {
          L('d1_cand_err', {
            pc: rec.id, code: e && e.errorCode,
            url: String((e && e.url) || '').slice(0, 60),
            txt: String((e && e.errorText) || '').slice(0, 60)
          }, 'warn');
        } catch (_) {}
      });
    } catch (_) {}

    return rec;
  }

  /* ── One getStats reading ───────────────────────────────────────────────── */
  function sample() {
    var c = C(); var pc = c && c.pc;
    if (!pc || typeof pc.getStats !== 'function') return;
    var rec = null;
    try { rec = pc.__tbD1; } catch (_) {}
    if (!rec) return;

    pc.getStats().then(function (report) {
      try {
        var vin = null, vout = null, pair = null, byId = {};
        report.forEach(function (r) {
          byId[r.id] = r;
          if (r.type === 'inbound-rtp' && r.kind === 'video') vin = r;
          if (r.type === 'outbound-rtp' && r.kind === 'video') vout = r;
          if (r.type === 'candidate-pair' && (r.selected === true || r.nominated === true) && r.state === 'succeeded') pair = r;
        });
        if (!pair) {
          report.forEach(function (r) { if (!pair && r.type === 'candidate-pair' && r.state === 'succeeded') pair = r; });
        }

        var lt = '?', rt = '?';
        if (pair) {
          var lc = byId[pair.localCandidateId], rc = byId[pair.remoteCandidateId];
          if (lc) lt = lc.candidateType || '?';
          if (rc) rt = rc.candidateType || '?';
        }
        var pairKey = lt + '/' + rt;

        var bytes = vin ? (vin.bytesReceived || 0) : 0;
        var frames = vin ? (vin.framesDecoded || 0) : 0;
        var dBytes = rec.bytes < 0 ? 0 : bytes - rec.bytes;
        var dFrames = rec.frames < 0 ? 0 : frames - rec.frames;
        var first = rec.bytes < 0;
        rec.bytes = bytes; rec.frames = frames;

        S.samples++;
        var row = {
          pc: rec.id, n: S.samples, ms: now() - rec.t0,
          conn: pc.connectionState, ice: pc.iceConnectionState,
          path: pairKey,
          rtt: pair && pair.currentRoundTripTime != null ? Math.round(pair.currentRoundTripTime * 1000) : null,
          inB: dBytes, inF: dFrames,
          outB: vout ? (vout.bytesSent || 0) : null,
          lost: vin ? (vin.packetsLost || 0) : null,
          h: vin ? (vin.frameHeight || 0) : null,
          ka: c.kaChannel ? c.kaChannel.readyState : 'none',
          kaT: !!c.kaTimer, wd: !!c.videoWatchTimer, ct: !!c.connectTimeoutTimer,
          rs: c.recoveryStep, rl: !!c.recoveryLock
        };
        L('d1_stats', row, 'info');

        /* The path changed mid-call — a TURN allocation lost, or a relay
           fallback taken. Called out separately so it cannot be missed. */
        if (rec.pair && rec.pair !== pairKey) {
          L('d1_path_change', { pc: rec.id, from: rec.pair, to: pairKey, ms: now() - rec.t0 }, 'warn');
        }
        rec.pair = pairKey;

        /* The picture itself. Independent of the app's own watchdog, and of
           connectionState, which can read healthy while nothing is arriving. */
        if (!first && c.kind === 'video') {
          if (dFrames === 0 && dBytes === 0) {
            rec.dead++;
            if (rec.dead === DEAD_SAMPLES && !rec.reported) {
              rec.reported = true; rec.deadAt = now();
              L('d1_video_dead', {
                pc: rec.id, sinceCallMs: S.callStart ? now() - S.callStart : null,
                ms: now() - rec.t0, conn: pc.connectionState, ice: pc.iceConnectionState,
                path: pairKey, ka: row.ka, wd: row.wd, rs: c.recoveryStep, net: netInfo()
              }, 'error');
              turnProbe('video_dead');
            }
          } else {
            if (rec.reported) {
              L('d1_video_resumed', { pc: rec.id, deadMs: now() - rec.deadAt, path: pairKey, rs: c.recoveryStep }, 'ok');
              rec.reported = false;
            }
            rec.dead = 0;
          }
        }
      } catch (e) {
        L('d1_stats_err', { e: String((e && e.name) || e) }, 'warn');
      }
    }).catch(function (e) {
      L('d1_stats_err', { e: String((e && e.name) || e) }, 'warn');
    });
  }

  /* ── Is TURN still answering? ───────────────────────────────────────────── */
  function turnProbe(why) {
    S.lastProbe = now();
    var c = C(); var pc = c && c.pc;
    var servers = null;
    try { if (pc && typeof pc.getConfiguration === 'function') servers = pc.getConfiguration().iceServers; } catch (_) {}
    if (!servers || !servers.length) servers = S.lastServers;
    if (!servers || !servers.length) { L('d1_turn_probe', { why: why, skip: 'no-config' }, 'warn'); return; }
    S.lastServers = servers;

    var hasTurn = false;
    try {
      for (var i = 0; i < servers.length; i++) {
        var urls = servers[i].urls || servers[i].url || [];
        if (typeof urls === 'string') urls = [urls];
        for (var j = 0; j < urls.length; j++) if (/^turns?:/i.test(String(urls[j]))) hasTurn = true;
      }
    } catch (_) {}
    if (!hasTurn) {
      L('d1_turn_probe', { why: why, ok: false, reason: 'no-turn-server-configured' }, 'error');
      return;
    }

    S.probes++;
    var t0 = now(), probe = null, done = false, relay = 0, errs = [];
    function finish(how) {
      if (done) return; done = true;
      L('d1_turn_probe', {
        why: why, n: S.probes, ok: relay > 0, relay: relay,
        ms: now() - t0, end: how, err: errs.slice(0, 2)
      }, relay > 0 ? 'ok' : 'error');
      try { if (probe) probe.close(); } catch (_) {}
    }
    try {
      probe = new RTCPeerConnection({ iceServers: servers, iceTransportPolicy: 'relay' });
      probe.addEventListener('icecandidate', function (e) {
        try {
          if (!e.candidate) { finish('gathered'); return; }
          if (candType(e.candidate) === 'relay') { relay++; finish('relay'); }
        } catch (_) {}
      });
      probe.addEventListener('icecandidateerror', function (e) {
        try { errs.push(String((e && e.errorCode) || '?') + ':' + String((e && e.errorText) || '').slice(0, 40)); } catch (_) {}
      });
      probe.createDataChannel('d1probe');
      probe.createOffer().then(function (o) { return probe.setLocalDescription(o); })
        .catch(function (e) { errs.push(String((e && e.name) || e)); finish('sld-err'); });
      setTimeout(function () { finish('timeout'); }, PROBE_TIMEOUT);
    } catch (e) {
      errs.push(String((e && e.name) || e));
      finish('throw');
    }
  }

  /* ── The loop ───────────────────────────────────────────────────────────── */
  var ticks = 0;
  function tick() {
    ticks++;
    var c = C();
    if (!c) return;

    var active = !!c.active;
    if (active && !S.inCall) {
      S.inCall = true; S.callStart = now(); S.samples = 0;
      L('d1_call_start', { gen: gen(), role: role(), kind: c.kind, caller: !!c.caller, net: netInfo() }, 'ok');
    } else if (!active && S.inCall) {
      S.inCall = false;
      L('d1_call_end', {
        gen: gen(), durMs: now() - S.callStart, samples: S.samples,
        probes: S.probes, pcs: S.pcSeen, rs: c.recoveryStep
      }, 'ok');
      S.callStart = 0; S.recStep = -1; S.kaState = ''; S.wd = null;
    }

    if (c.pc) attach(c.pc);
    if (!active) return;

    /* State the app keeps to itself, surfaced the moment it moves. */
    if (c.recoveryStep !== S.recStep) {
      if (S.recStep !== -1) L('d1_recovery_step', { from: S.recStep, to: c.recoveryStep, lock: !!c.recoveryLock, ms: now() - S.callStart }, 'warn');
      S.recStep = c.recoveryStep;
    }
    var ka = c.kaChannel ? c.kaChannel.readyState : 'none';
    if (ka !== S.kaState) {
      L('d1_ka', { rs: ka, timer: !!c.kaTimer, ms: now() - S.callStart }, ka === 'open' ? 'ok' : 'warn');
      S.kaState = ka;
    }
    var wd = !!c.videoWatchTimer;
    if (wd !== S.wd) {
      L('d1_watchdog', { armed: wd, kind: c.kind, ms: now() - S.callStart }, (wd || c.kind !== 'video') ? 'info' : 'warn');
      S.wd = wd;
    }

    if (ticks % SAMPLE_EVERY === 0) sample();
    if (now() - S.lastProbe > PROBE_MS) turnProbe('interval');
  }

  /* ── Things that happen to the call from outside it ─────────────────────── */
  try {
    window.addEventListener('online', function () { L('d1_net', netInfo(), S.inCall ? 'warn' : 'info'); });
    window.addEventListener('offline', function () { L('d1_net', { on: false, inCall: S.inCall }, S.inCall ? 'warn' : 'info'); });
    var nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (nc && nc.addEventListener) nc.addEventListener('change', function () { L('d1_netinfo', netInfo(), 'info'); });
  } catch (_) {}
  try {
    document.addEventListener('visibilitychange', function () {
      if (S.inCall) L('d1_vis', { hidden: !!document.hidden, ms: now() - S.callStart }, 'warn');
    });
    window.addEventListener('pagehide', function () { if (S.inCall) L('d1_vis', { pagehide: true }, 'warn'); });
  } catch (_) {}

  L('d1_build', { c: BUILD.c, file: BUILD.file, base: BUILD.base }, 'ok');
  var timer = setInterval(tick, TICK_MS);

  return {
    build: BUILD, state: S, tick: tick, sample: sample, turnProbe: turnProbe,
    attach: attach, timer: timer
  };
})();
