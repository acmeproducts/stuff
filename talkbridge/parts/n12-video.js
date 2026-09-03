/* N12 (25·pre-ship, plan v20.36.0). THE VIDEO SURFACE — owner spec, verbatim.
   Built by reading the live markup and CSS, never reconstructed:
     #call-band > .videos#call-videos > #remote-video, #local-video, #pip-x.
   Full size:
     - tapping EITHER video swaps which stream is large and which is inset;
     - the inset is draggable across the WHOLE screen, not just the video pane,
       and may sit mostly off-screen with a sliver left to drag it back;
     - a camera-swap control (front/back) is offered when the device has more
       than one camera;
     - a screen-share control appears ONLY where the browser can capture a
       screen — desktop; phones never see it.
   Back button → PiP: 9:16, small, the call stays LIVE so the person can read
   email or look something up. PiP shows exactly two controls: a diagonal
   double-arrow that expands back, and an X that ends the call.
   Everything wraps the frozen call logic and calls through. */
(function () {
  var S12 = { swapped: false, dragging: false, moved: false, x: null, y: null, share: null };
  function L(ev, d) { try { if (typeof log === 'function') log(ev, d || {}, 'ok'); } catch (_) {} }
  function $$(id) { return document.getElementById(id); }

  var css = document.createElement('style');
  css.textContent =
    /* the inset floats over the whole screen once dragged */
    '#local-video.n12-free{position:fixed;right:auto;bottom:auto;z-index:60;width:96px;height:128px;touch-action:none}' +
    '#scr-room.n12-swap #remote-video{position:absolute;right:8px;bottom:8px;width:82px;height:110px;object-fit:cover;border-radius:10px;border:1.5px solid rgba(255,255,255,.35);background:#000;z-index:2}' +
    '#scr-room.n12-swap #local-video{position:absolute;inset:0;right:auto;bottom:auto;width:100%;height:100%;border:0;border-radius:0;z-index:1}' +
    '#scr-room.n12-swap.pip #local-video,#scr-room.n12-swap #remote-ph{display:none}' +
    /* PiP: 9:16, live, exactly two controls */
    '#scr-room.pip #call-band{width:120px}#scr-room.pip #call-band .videos{height:213px}' +
    '#n12-grow{display:none;position:absolute;left:4px;top:4px;z-index:5;width:24px;height:24px;border-radius:50%;' +
      'background:rgba(0,0,0,.62);color:#fff;border:none;align-items:center;justify-content:center;cursor:pointer;padding:0}' +
    '#scr-room.pip #n12-grow{display:flex}' +
    /* full-size controls */
    '#n12-tools{display:none;position:absolute;left:8px;top:8px;z-index:4;gap:8px}' +
    '#scr-room.st-video #n12-tools{display:flex}#scr-room.pip #n12-tools{display:none}' +
    '.n12-btn{width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;border:none;' +
      'display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}';
  document.head.appendChild(css);

  function build() {
    var band = $$('call-band'), videos = $$('call-videos');
    if (!band || !videos || $$('n12-tools')) return;

    var grow = document.createElement('button');
    grow.id = 'n12-grow'; grow.setAttribute('aria-label', 'Back to full size');
    grow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M8 3H3v5"/><path d="M3 3l7 7"/><path d="M16 21h5v-5"/><path d="M21 21l-7-7"/></svg>';
    grow.addEventListener('click', function (e) { e.stopPropagation(); if (CALL.pip) { CALL.exitPip(); L('n12_pip_expand', {}); } });
    band.appendChild(grow);

    var tools = document.createElement('div');
    tools.id = 'n12-tools';
    tools.innerHTML =
      '<button class="n12-btn" id="n12-flip" aria-label="Switch camera"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10"/><path d="M20.5 15a9 9 0 0 1-14.9 3.4L1 14"/></svg></button>' +
      '<button class="n12-btn" id="n12-share" aria-label="Share screen" style="display:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></button>';
    videos.appendChild(tools);

    $$('n12-flip').addEventListener('click', function (e) { e.stopPropagation(); flip(); });
    $$('n12-share').addEventListener('click', function (e) { e.stopPropagation(); share(); });

    /* the screen-share control exists only where a screen can actually be
       captured — desktop browsers. Phones never see it. */
    var canShare = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) &&
      !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (canShare) $$('n12-share').style.display = '';
    L('n12_ready', { share: canShare });

    /* a camera-swap control is pointless with one camera */
    try {
      navigator.mediaDevices.enumerateDevices().then(function (ds) {
        var cams = (ds || []).filter(function (d) { return d.kind === 'videoinput'; }).length;
        if (cams < 2) $$('n12-flip').style.display = 'none';
      }).catch(function () {});
    } catch (_) {}

    wireTap(); wireDrag();
  }

  /* ---- tap either video to swap which one is large ---- */
  function swap() {
    S12.swapped = !S12.swapped;
    $$('scr-room').classList.toggle('n12-swap', S12.swapped);
    L('n12_swap', { swapped: S12.swapped });
  }
  function wireTap() {
    $$('call-videos').addEventListener('click', function (e) {
      if (S12.moved) { S12.moved = false; return; }        /* a drag is not a tap */
      if (CALL.pip) return;                                 /* in PiP a tap belongs to the frozen expand */
      if (CALL.kind !== 'video' || !CALL.active) return;
      if (e.target.closest && e.target.closest('#n12-tools')) return;
      swap();
    }, true);
  }

  /* ---- the inset is draggable anywhere, even mostly off-screen ---- */
  function wireDrag() {
    var el = $$('local-video');
    if (!el) return;
    function down(e) {
      if (!CALL.active || CALL.kind !== 'video' || CALL.pip) return;
      var p = e.touches ? e.touches[0] : e;
      var r = el.getBoundingClientRect();
      S12.dragging = true; S12.moved = false;
      S12.dx = p.clientX - r.left; S12.dy = p.clientY - r.top;
      el.classList.add('n12-free');
      el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
    }
    function move(e) {
      if (!S12.dragging) return;
      var p = e.touches ? e.touches[0] : e;
      S12.moved = true;
      var w = el.offsetWidth || 96, h = el.offsetHeight || 128;
      var x = p.clientX - S12.dx, y = p.clientY - S12.dy;
      /* it may hang off any edge, but a sliver always stays grabbable */
      var keep = 28;
      x = Math.max(keep - w, Math.min(x, window.innerWidth - keep));
      y = Math.max(keep - h, Math.min(y, window.innerHeight - keep));
      S12.x = x; S12.y = y;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      if (e.cancelable) e.preventDefault();
    }
    function up() { if (S12.dragging) { S12.dragging = false; L('n12_inset_moved', { x: Math.round(S12.x || 0), y: Math.round(S12.y || 0) }); } }
    el.addEventListener('mousedown', down); el.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('mousemove', move); window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up); window.addEventListener('touchend', up);
  }

  /* ---- camera swap ---- */
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
      $$('local-video').srcObject = CALL.stream;
      L('n12_camera_flip', { facing: facing });
    }).catch(function (e) { L('n12_camera_flip_failed', { e: String(e && e.name || e) }); });
  }

  /* ---- screen share: swap the outgoing video track, restore on stop ---- */
  function share() {
    if (S12.share) { stopShare(); return; }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(function (ds) {
      var st = ds.getVideoTracks()[0]; if (!st) return;
      var sender = CALL.pc && CALL.pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
      if (sender) sender.replaceTrack(st);
      S12.share = { stream: ds, camera: CALL.stream && CALL.stream.getVideoTracks()[0] };
      st.addEventListener('ended', stopShare);
      L('n12_share_started', {});
    }).catch(function (e) { L('n12_share_failed', { e: String(e && e.name || e) }); });
  }
  function stopShare() {
    if (!S12.share) return;
    var cam = S12.share.camera;
    var sender = CALL.pc && CALL.pc.getSenders().find(function (s) { return s.track && s.track.kind === 'video'; });
    if (sender && cam) sender.replaceTrack(cam);
    try { S12.share.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (_) {}
    S12.share = null; L('n12_share_stopped', {});
  }

  /* ---- PiP keeps the call alive; leaving the call resets the surface ---- */
  if (typeof CALL !== 'undefined' && CALL) {
    var _enter = CALL.enterPip;
    CALL.enterPip = function () { var r = _enter.apply(this, arguments); if (CALL.pip) L('n12_pip_enter', { live: !!CALL.active }); return r; };
    var _tear = CALL.teardown;
    CALL.teardown = function () {
      stopShare();
      S12.swapped = false;
      try { $$('scr-room').classList.remove('n12-swap'); } catch (_) {}
      var lv = $$('local-video');
      if (lv) { lv.classList.remove('n12-free'); lv.style.left = ''; lv.style.top = ''; }
      return _tear.apply(this, arguments);
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
