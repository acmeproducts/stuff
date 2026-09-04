/* N13 (25·pre-ship, plan v20.37.0 — replaces the buried N12, G35).
   Two corrections to the owner's spec, learned on device:

   1. TAP SWAPS, AND ONLY SWAPS. N12 changed the layout on tap so it read as a
      collapse to the small 9:16 view. Here a tap exchanges the two streams in
      place — big becomes small, small becomes big — and touches nothing else:
      not the size of the band, not PiP, not the mode. Swapping is done by
      moving the STREAMS between the two elements, so the large element is
      always the large element and no layout can shift.

   2. FLOATING OVER OTHER APPS IS THE BROWSER'S PICTURE-IN-PICTURE. A CSS
      overlay can only float inside our own page — the moment another app comes
      forward it is gone. The back button therefore asks the browser for real
      Picture-in-Picture on the video element, which is the window that
      survives leaving the app. If the browser refuses or does not support it,
      the frozen in-page PiP still runs, so nothing is lost.
      (On Android this needs Chrome's own "Picture-in-picture" permission —
      Settings > Apps > Chrome > Picture-in-picture. The app reports which
      path it got in the log: n13_native_pip or n13_inpage_pip.)

   Also here: camera swap, and screen share where a screen can be captured.
   Wraps the frozen call logic and calls through. */
(function () {
  var S = { swapped: false, share: null, drag: false, moved: false, x: 0, y: 0 };
  function L(ev, d) { try { if (typeof log === 'function') log(ev, d || {}, 'ok'); } catch (_) {} }
  function $$(id) { return document.getElementById(id); }

  var css = document.createElement('style');
  css.textContent =
    '#local-video.n13-free{position:fixed;right:auto;bottom:auto;z-index:60;touch-action:none}' +
    '#n13-tools{display:none;position:absolute;left:8px;top:8px;z-index:4;gap:8px}' +
    '#scr-room.st-video #n13-tools{display:flex}#scr-room.pip #n13-tools{display:none}' +
    '.n13-btn{width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;border:none;' +
      'display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}' +
    '#n13-grow{display:none;position:absolute;left:4px;top:4px;z-index:5;width:24px;height:24px;border-radius:50%;' +
      'background:rgba(0,0,0,.62);color:#fff;border:none;align-items:center;justify-content:center;cursor:pointer;padding:0}' +
    '#scr-room.pip #n13-grow{display:flex}';
  document.head.appendChild(css);

  /* ---------- 1. tap swaps the streams, nothing else ---------- */
  function swap() {
    var big = $$('remote-video'), small = $$('local-video');
    if (!big || !small) return;
    var a = big.srcObject, b = small.srcObject;
    if (!a && !b) return;
    big.srcObject = b; small.srcObject = a;
    S.swapped = !S.swapped;
    /* N21a: the element holding OUR OWN camera must always be muted or the
       handset feeds its own microphone back through the speaker. The element
       holding the far side follows the room's Ear setting — the app owns that
       switch and a swap must never override it. */
    var mine = CALL.stream;
    var room = (typeof activeRoom === 'function') ? activeRoom() : null;
    var earOn = !room || room.ear !== false;
    [big, small].forEach(function (el) {
      var isMine = mine && el.srcObject === mine;
      el.muted = isMine ? true : !earOn;
      /* N21b: both elements are autoplay, but assigning a new srcObject to an
         element that is already playing does not restart it — the app itself
         calls play() everywhere it swaps a stream in. Without this the picture
         simply does not change, which is exactly what a tap looked like. */
      try { var q = el.play(); if (q && q.catch) q.catch(function () {}); } catch (_) {}
    });
    L('n13_swap', { swapped: S.swapped, ear: earOn });
  }

  /* ---------- 2. the back button asks for the browser's own PiP ---------- */
  function nativePip() {
    var v = $$('remote-video');
    if (!v || !document.pictureInPictureEnabled || v.disablePictureInPicture) return Promise.reject(new Error('unsupported'));
    if (document.pictureInPictureElement) return Promise.resolve('already');
    return v.requestPictureInPicture();
  }

  function build() {
    var band = $$('call-band'), videos = $$('call-videos');
    if (!band || !videos || $$('n13-tools')) return;

    var grow = document.createElement('button');
    grow.id = 'n13-grow'; grow.setAttribute('aria-label', 'Back to full size');
    grow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M8 3H3v5"/><path d="M3 3l7 7"/><path d="M16 21h5v-5"/><path d="M21 21l-7-7"/></svg>';
    grow.addEventListener('click', function (e) { e.stopPropagation(); if (CALL.pip) { CALL.exitPip(); L('n13_pip_expand', {}); } });
    band.appendChild(grow);

    var tools = document.createElement('div');
    tools.id = 'n13-tools';
    tools.innerHTML =
      '<button class="n13-btn" id="n13-flip" aria-label="Switch camera"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10"/><path d="M20.5 15a9 9 0 0 1-14.9 3.4L1 14"/></svg></button>' +
      '<button class="n13-btn" id="n13-share" aria-label="Share screen" style="display:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></button>';
    videos.appendChild(tools);
    $$('n13-flip').addEventListener('click', function (e) { e.stopPropagation(); flip(); });
    $$('n13-share').addEventListener('click', function (e) { e.stopPropagation(); share(); });

    var canShare = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) &&
      !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (canShare) $$('n13-share').style.display = '';
    try {
      navigator.mediaDevices.enumerateDevices().then(function (ds) {
        if ((ds || []).filter(function (d) { return d.kind === 'videoinput'; }).length < 2) $$('n13-flip').style.display = 'none';
      }).catch(function () {});
    } catch (_) {}
    L('n13_ready', { share: canShare, nativePip: !!document.pictureInPictureEnabled });

    videos.addEventListener('click', function (e) {
      if (S.moved) { S.moved = false; return; }
      if (CALL.pip || !CALL.active || CALL.kind !== 'video') return;
      if (e.target.closest && e.target.closest('#n13-tools')) return;
      swap();
    }, true);

    dragInset();
  }

  function dragInset() {
    var el = $$('local-video'); if (!el) return;
    function down(e) {
      if (!CALL.active || CALL.kind !== 'video' || CALL.pip) return;
      var p = e.touches ? e.touches[0] : e, r = el.getBoundingClientRect();
      S.drag = true; S.moved = false; S.dx = p.clientX - r.left; S.dy = p.clientY - r.top;
      el.classList.add('n13-free'); el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
    }
    function move(e) {
      if (!S.drag) return;
      var p = e.touches ? e.touches[0] : e, w = el.offsetWidth || 82, h = el.offsetHeight || 110, keep = 28;
      S.moved = true;
      S.x = Math.max(keep - w, Math.min(p.clientX - S.dx, window.innerWidth - keep));
      S.y = Math.max(keep - h, Math.min(p.clientY - S.dy, window.innerHeight - keep));
      el.style.left = S.x + 'px'; el.style.top = S.y + 'px';
      if (e.cancelable) e.preventDefault();
    }
    function up() { if (S.drag) { S.drag = false; L('n13_inset_moved', { x: Math.round(S.x), y: Math.round(S.y) }); } }
    el.addEventListener('mousedown', down); el.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('mousemove', move); window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up); window.addEventListener('touchend', up);
  }

  function flip() {
    if (!CALL.active || CALL.kind !== 'video' || !CALL.stream) return;
    var cur = CALL.stream.getVideoTracks()[0];
    var facing = (cur && cur.getSettings && cur.getSettings().facingMode) === 'environment' ? 'user' : 'environment';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }).then(function (ns) {
      var nt = ns.getVideoTracks()[0]; if (!nt) return;
      var sender = CALL.pc && CALL.pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
      if (sender) sender.replaceTrack(nt);
      if (cur) { try { CALL.stream.removeTrack(cur); cur.stop(); } catch (_) {} }
      CALL.stream.addTrack(nt);
      L('n13_camera_flip', { facing: facing });
    }).catch(function (e) { L('n13_camera_flip_failed', { e: String(e && e.name || e) }); });
  }

  function share() {
    if (S.share) { stopShare(); return; }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(function (ds) {
      var st = ds.getVideoTracks()[0]; if (!st) return;
      var sender = CALL.pc && CALL.pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
      if (sender) sender.replaceTrack(st);
      S.share = { stream: ds, camera: CALL.stream && CALL.stream.getVideoTracks()[0] };
      st.addEventListener('ended', stopShare);
      L('n13_share_started', {});
    }).catch(function (e) { L('n13_share_failed', { e: String(e && e.name || e) }); });
  }
  function stopShare() {
    if (!S.share) return;
    var sender = CALL.pc && CALL.pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
    if (sender && S.share.camera) sender.replaceTrack(S.share.camera);
    try { S.share.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (_) {}
    S.share = null; L('n13_share_stopped', {});
  }

  if (typeof CALL !== 'undefined' && CALL) {
    var _enter = CALL.enterPip;
    CALL.enterPip = function () {
      var self = this, args = arguments;
      if (this.active && this.kind === 'video') {
        try {
          return nativePip().then(function () {
            L('n13_native_pip', {});                     /* floats over other apps */
          }).catch(function (e) {
            L('n13_inpage_pip', { why: String(e && e.name || e) });
            return _enter.apply(self, args);             /* browser refused — keep the frozen behaviour */
          });
        } catch (e) { L('n13_inpage_pip', { why: String(e && e.name || e) }); }
      }
      return _enter.apply(this, args);
    };
    var _tear = CALL.teardown;
    CALL.teardown = function () {
      stopShare();
      try { if (document.pictureInPictureElement) document.exitPictureInPicture(); } catch (_) {}
      /* N21c: hand both elements back the way the app expects to find them, or
         a swap left running at hang-up carries into the NEXT call — the far
         side's audio silently muted, our own camera in the large frame. */
      if (S.swapped) {
        var b = $$('remote-video'), sm = $$('local-video');
        if (b && sm) { var t = b.srcObject; b.srcObject = sm.srcObject; sm.srcObject = t; }
        S.swapped = false;
      }
      try {
        var rv = $$('remote-video'), lv2 = $$('local-video');
        var room2 = (typeof activeRoom === 'function') ? activeRoom() : null;
        if (rv) rv.muted = !!(room2 && room2.ear === false);
        if (lv2) lv2.muted = true;
      } catch (_) {}
      var lv = $$('local-video');
      if (lv) { lv.classList.remove('n13-free'); lv.style.left = ''; lv.style.top = ''; }
      return _tear.apply(this, arguments);
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
