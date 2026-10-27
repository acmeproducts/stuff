/* ═══════════ 30·base PART · VB-2 video-strip.js — THE STRIP YOU PULL DOWN (§7.22, candidate 4) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — it watches the call band's class and the room screen's call state; it reassigns no function
   adds: VB, vbLog, vbCss, vbBox, vbActive, vbAspect, vbShapes, vbLimits, vbApply, vbCorner, vbReshape, vbShow, vbHide, vbWire, vbInit
   markers (vbLog's own prefix 'vb_'): shown, resized, corner, shape, camera, init_failed

   THE OWNER (2026-10-27, after testing c3's floating window): "maybe being able to just drag the length of the video to where it
   could be longer if you needed to see more of the person and that there was basically a minimum height with the tall pip inside
   maybe that's a better solve"; then "Both, video first".
   THE CHANGE: the accepted band stays where it was — in the room's flow under the ribbon, the app column's width, pushing the chat
   down, never over it. Its height is the person's: a grab bar (its own row UNDER the pictures, outside #call-videos so a press on
   it can never swap) pulled down or up, between MIN (the accepted 228 px) and MAX (66% of the room below the ribbon, and never so
   tall that less than 120 px of chat is left beside every other row on the screen; never taller than a wide picture can use).
   Remembered per phone (only a drag saves it). Both pictures are whole (contain) — no crop at any height. The small picture is a
   frame of its own shape (the last good shape is kept while a stream is re-pointed), ≥ 110 px high, ≤ 40% of the strip's width,
   in a corner; dragged, it snaps to the nearest corner (remembered); a tap still swaps. The accepted page-wide small-video drag is
   kept dead while the strip shows (it writes viewport coordinates onto an element inside the band). Typing: unchanged from today.
   REVIEW (2026-10-27, independent): the keyboard pans the page (#app is fixed; the soft keyboard shrinks only the visual
   viewport), so a "smaller while typing" rule would change nothing — dropped; the bar is its own row (it overlapped the chat and
   the small picture); the small picture's width capped; MAX keeps a chat floor beside the banner, typing line, reach bar and
   composer; pointer events with capture, touch-action only on the bar and the small picture; the newest message stays in view
   when the strip grows; safe areas on the corners; a wide picture's useful height caps MAX. */
var VB = { on: false, h: 228, min: 228, max: 228, vmax: 228, corner: 'br', press: null, swallowClick: false, last: {}, poll: null,
  KEY_H: 'tb_vband_h', KEY_C: 'tb_vband_corner', MIN0: 228, BAR: 20, FLOOR: 120, SLOP: 8, TOL: 0.03, DEF: 0.75, big: 0.75, small: 0.75 };
function vbLog(what, d, lvl) { try { log('vb_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function vbCss() {
  if (document.getElementById('vb-css')) return;
  var S = '#scr-room.st-video #call-band.on';
  var SMALL = [S + ' .videos:not(.swapped) #local-video', S + ' .videos.swapped #remote-video'];
  var corner = function (c, sel) { return SMALL.map(function (x) { return x.replace('#call-band.on', '#call-band.on.vb-c-' + c); }).join(',') + sel; };
  var css =
    '#vb-bar{display:none}' +
    S + ' .videos{height:var(--vb-vh,228px);background:#000}' +
    /* the grab bar: its own row under the pictures */
    S + ' #vb-bar{display:flex;align-items:center;justify-content:center;height:' + VB.BAR + 'px;background:#101314;touch-action:none;cursor:ns-resize;user-select:none;-webkit-user-select:none}' +
    S + ' #vb-bar i{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.55)}' +
    /* the big picture: whole, in the strip, any height */
    S + ' .videos:not(.swapped) #remote-video,' + S + ' .videos.swapped #local-video{position:absolute;inset:0;width:100%;height:100%;' +
      'object-fit:contain;border:0;border-radius:0;background:#000;z-index:1;transform:none}' +
    /* the small picture: a frame of its own shape, in a corner */
    SMALL.join(',') + '{position:absolute;width:var(--vb-iw,82px);height:var(--vb-ih,110px);object-fit:contain;background:#000;' +
      'border-radius:8px;border:1.5px solid rgba(255,255,255,.4);z-index:3;touch-action:none;' +
      'transform:translate(var(--vb-dx,0px),var(--vb-dy,0px));left:auto;top:auto;right:auto;bottom:auto}' +
    corner('br', '{right:max(6px,env(safe-area-inset-right));bottom:6px}') +
    corner('bl', '{left:max(6px,env(safe-area-inset-left));bottom:6px}') +
    corner('tr', '{right:max(6px,env(safe-area-inset-right));top:6px}') +
    corner('tl', '{left:max(6px,env(safe-area-inset-left));top:6px}') +
    /* subtitles at the bottom, clear of a small picture in a bottom corner */
    S + ' #subtitle-area{left:var(--vb-sl,8px);right:var(--vb-sr,8px);bottom:8px;top:auto}' +
    S + '.vb-c-bl #btn-flip-overlay{bottom:auto;top:10px}' +
    S + ' #local-video-handle{display:none!important}' +
    '#scr-room.st-video #transcript{overscroll-behavior:contain}';
  var st = document.createElement('style'); st.id = 'vb-css'; st.textContent = css; document.head.appendChild(st);
}
function vbBox() { return document.getElementById('call-band'); }
function vbActive() {
  var b = vbBox(), s = document.getElementById('scr-room');
  return !!(b && s && b.classList.contains('on') && s.classList.contains('st-video'));
}
/* a picture's shape (width ÷ height) from its own frames; while a stream is re-pointed (the flip, CV-1) the last good one stands */
function vbAspect(el) {
  if (!el) return null;
  if (el.videoWidth > 0 && el.videoHeight > 0) { var a = el.videoWidth / el.videoHeight; VB.last[el.id] = a; return a; }
  return VB.last[el.id] || null;
}
function vbShapes() {
  var sw = false; try { var h = document.getElementById('call-videos'); sw = !!(h && h.classList.contains('swapped')); } catch (_) {}
  var rv = document.getElementById('remote-video'), lv = document.getElementById('local-video');
  var big = sw ? lv : rv, small = sw ? rv : lv;
  return { big: vbAspect(big) || VB.DEF, small: vbAspect(small) || VB.DEF, smallEl: small, bigPx: big ? [big.videoWidth || 0, big.videoHeight || 0] : [0, 0], smallPx: small ? [small.videoWidth || 0, small.videoHeight || 0] : [0, 0] };
}
/* MIN and MAX from the room as it is now: the ribbon, every other row in the room's flow, and a chat floor */
function vbLimits() {
  var s = document.getElementById('scr-room'), b = vbBox(); if (!s || !b) return;
  var room = s.clientHeight || window.innerHeight || 640, rib = 0, others = 0;
  [].forEach.call(s.children, function (c) {
    if (c === b || c.id === 'transcript') return;
    var cs = getComputedStyle(c); if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') return;
    if (c.id === 'room-ribbon') rib = c.offsetHeight; else others += c.offsetHeight;
  });
  var below = room - rib;
  var max = Math.min(0.66 * below, below - others - VB.FLOOR) - VB.BAR;
  var min = Math.min(VB.MIN0, max);
  min = Math.max(80, min); max = Math.max(min, max);   /* the chat's floor wins down to an 80 px picture (a phone on its side with every row showing can hold no more) */
  var w = b.clientWidth || (s.clientWidth || 360);
  var useful = VB.big > 0 ? w / VB.big : Infinity;          /* a wide picture gains nothing past its own height */
  VB.min = Math.round(min); VB.max = Math.round(max); VB.vmax = Math.round(Math.max(min, Math.min(max, useful)));
}
/* put the strip at height h (clamped; saving is the drag's job alone) and size the small picture */
function vbApply(h) {
  var b = vbBox(); if (!b || !VB.on) return;
  var t = document.getElementById('transcript'), pinned = !!t && (t.scrollHeight - t.scrollTop - t.clientHeight < 24);
  vbLimits();
  if (h != null) VB.h = h;
  var shown = Math.max(VB.min, Math.min(VB.vmax, VB.h));
  b.style.setProperty('--vb-vh', shown + 'px');
  var W = b.clientWidth || 360, a = VB.small || VB.DEF;
  var ih = Math.min(240, Math.max(110, 0.45 * shown), shown - 12), iw = ih * a;
  if (iw > 0.4 * W) { iw = 0.4 * W; ih = iw / a; }
  b.style.setProperty('--vb-iw', Math.round(iw) + 'px'); b.style.setProperty('--vb-ih', Math.round(ih) + 'px');
  var clear = Math.round(iw) + 14;
  b.style.setProperty('--vb-sr', VB.corner === 'br' ? clear + 'px' : '8px');
  b.style.setProperty('--vb-sl', VB.corner === 'bl' ? clear + 'px' : '8px');
  if (pinned && t) t.scrollTop = t.scrollHeight;            /* the newest message stays in view */
  VB.shown = shown;
}
function vbCorner(c) {
  var b = vbBox(); if (!b) return;
  ['tl', 'tr', 'bl', 'br'].forEach(function (k) { b.classList.toggle('vb-c-' + k, k === c); });
  VB.corner = c;
}
/* the picture changed shape (first frame, a swap, a flip): the small frame and the useful height follow */
function vbReshape(why) {
  if (!VB.on) return;
  var sh = vbShapes(), same = function (x, y) { return Math.abs(x / y - 1) <= VB.TOL; };
  if (why !== 'show' && same(sh.big, VB.big) && same(sh.small, VB.small)) return;
  VB.big = sh.big; VB.small = sh.small; vbApply();
  var set = null; try { var tr = (typeof CALL !== 'undefined' && CALL.stream && CALL.stream.getVideoTracks) ? CALL.stream.getVideoTracks()[0] : null; var st = tr && tr.getSettings ? tr.getSettings() : null; if (st) set = [st.width || 0, st.height || 0]; } catch (_) {}
  vbLog('shape', { why: why, big: sh.bigPx, small: sh.smallPx, cam: set, h: VB.shown, iw: Math.round(parseFloat(vbBox().style.getPropertyValue('--vb-iw')) || 0) }, 'ok');
}
function vbShow() {
  VB.on = true; var sh = vbShapes(); VB.big = sh.big; VB.small = sh.small;
  var h = null, c = null; try { h = parseFloat(localStorage.getItem(VB.KEY_H)); c = localStorage.getItem(VB.KEY_C); } catch (_) {}
  vbCorner(/^(tl|tr|bl|br)$/.test(c || '') ? c : 'br');
  vbApply(isFinite(h) && h > 0 ? h : VB.MIN0);
  vbLog('shown', { h: VB.shown, min: VB.min, max: VB.max, corner: VB.corner, big: sh.bigPx, small: sh.smallPx, camOn: (typeof CALL !== 'undefined') ? !!CALL.camOn : null }, 'ok');
  vbReshape('show');
  try { clearInterval(VB.poll); VB.poll = setInterval(function () { vbReshape('poll'); }, 1000); } catch (_) {}
  try { var tr = (typeof CALL !== 'undefined' && CALL.stream && CALL.stream.getVideoTracks) ? CALL.stream.getVideoTracks()[0] : null; var st = tr && tr.getSettings ? tr.getSettings() : null; if (st) vbLog('camera', { w: st.width || 0, h: st.height || 0, facing: st.facingMode || '' }, 'ok'); } catch (_) {}
}
function vbHide() {
  VB.on = false; VB.press = null; VB.swallowClick = false;
  try { clearInterval(VB.poll); VB.poll = null; } catch (_) {}
  /* the call ended — by any path: no swap, no dragged position, no size left inline; the remembered height and corner stay */
  try { if (typeof TB_SWAP !== 'undefined') TB_SWAP = false; } catch (_) {}
  try { var hv = document.getElementById('call-videos'); if (hv) hv.classList.remove('swapped'); } catch (_) {}
  ['remote-video', 'local-video'].forEach(function (id) { var el = document.getElementById(id); if (!el) return; if (el.__tbDragState) el.__tbDragState.on = false; try { tbClearPos(el); } catch (_) {} });
  var b = vbBox(); if (b) ['tl', 'tr', 'bl', 'br'].forEach(function (k) { b.classList.remove('vb-c-' + k); });   /* the corner lives in storage, not on the page between calls */
  if (b) ['--vb-vh', '--vb-iw', '--vb-ih', '--vb-sl', '--vb-sr', '--vb-dx', '--vb-dy'].forEach(function (p) { b.style.removeProperty(p); });
}
function vbWire() {
  var b = vbBox(), hv = document.getElementById('call-videos'); if (!b || !hv || b.__vbWired) return; b.__vbWired = true;
  var bar = document.getElementById('vb-bar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'vb-bar'; bar.setAttribute('aria-label', 'Resize video'); bar.innerHTML = '<i></i>'; b.appendChild(bar); }
  /* the accepted page-wide small-video drag stays dead while the strip shows (capture: it never hears the press) */
  var dead = function (ev) { if (vbActive()) ev.stopPropagation(); };
  hv.addEventListener('mousedown', dead, true); hv.addEventListener('touchstart', dead, { capture: true, passive: true });
  /* THE BAR: a vertical drag sets the height */
  bar.addEventListener('pointerdown', function (ev) {
    if (!vbActive()) return;
    VB.press = { kind: 'bar', id: ev.pointerId, sy: ev.clientY, h0: VB.shown || VB.h, moved: false };
    try { bar.setPointerCapture(ev.pointerId); } catch (_) {}
    if (ev.cancelable) ev.preventDefault();
  });
  bar.addEventListener('pointermove', function (ev) {
    var p = VB.press; if (!p || p.kind !== 'bar' || p.id !== ev.pointerId) return;
    var dy = ev.clientY - p.sy; if (!p.moved && Math.abs(dy) < VB.SLOP) return;
    p.moved = true; vbApply(Math.max(VB.min, Math.min(VB.vmax, p.h0 + dy)));
  });
  var barUp = function (ev) {
    var p = VB.press; if (!p || p.kind !== 'bar' || p.id !== ev.pointerId) return;
    VB.press = null;
    if (p.moved) { VB.h = VB.shown; try { localStorage.setItem(VB.KEY_H, String(VB.h)); } catch (_) {} vbLog('resized', { h: VB.h, min: VB.min, max: VB.max }, 'ok'); }
  };
  bar.addEventListener('pointerup', barUp); bar.addEventListener('pointercancel', barUp);
  /* THE SMALL PICTURE: a drag moves it and it snaps to the nearest corner; a tap swaps (the accepted click) */
  ['remote-video', 'local-video'].forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    el.addEventListener('pointerdown', function (ev) {
      if (!vbActive() || vbShapes().smallEl !== el) return;
      VB.press = { kind: 'inset', el: el, id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, moved: false };
      try { el.setPointerCapture(ev.pointerId); } catch (_) {}
    });
    el.addEventListener('pointermove', function (ev) {
      var p = VB.press; if (!p || p.kind !== 'inset' || p.id !== ev.pointerId) return;
      var dx = ev.clientX - p.sx, dy = ev.clientY - p.sy;
      if (!p.moved && Math.abs(dx) < VB.SLOP && Math.abs(dy) < VB.SLOP) return;
      p.moved = true; b.style.setProperty('--vb-dx', Math.round(dx) + 'px'); b.style.setProperty('--vb-dy', Math.round(dy) + 'px');
    });
    var up = function (ev) {
      var p = VB.press; if (!p || p.kind !== 'inset' || p.id !== ev.pointerId) return;
      VB.press = null;
      if (!p.moved) return;                                   /* a tap: the click swaps */
      var r = el.getBoundingClientRect(), q = hv.getBoundingClientRect();
      var cx = (r.left + r.right) / 2 - q.left, cy = (r.top + r.bottom) / 2 - q.top;
      var c = (cy < q.height / 2 ? 't' : 'b') + (cx < q.width / 2 ? 'l' : 'r');
      b.style.removeProperty('--vb-dx'); b.style.removeProperty('--vb-dy');
      vbCorner(c); vbApply();
      try { localStorage.setItem(VB.KEY_C, c); } catch (_) {}
      VB.swallowClick = true; setTimeout(function () { VB.swallowClick = false; }, 400);
      vbLog('corner', { c: c }, 'ok');
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    ['loadedmetadata', 'resize', 'playing'].forEach(function (t) { el.addEventListener(t, function () { vbReshape(t); }); });
  });
  /* a drag never swaps */
  hv.addEventListener('click', function (ev) { if (VB.swallowClick) { VB.swallowClick = false; ev.stopPropagation(); try { ev.preventDefault(); } catch (_) {} } }, true);
  try { new MutationObserver(function () { vbReshape('swap'); }).observe(hv, { attributes: true, attributeFilter: ['class'] }); } catch (_) {}
  var re = function () { if (VB.on) vbApply(); };
  window.addEventListener('resize', re); window.addEventListener('orientationchange', re);
  /* a row appearing or going (the banner, the typing line, the reach bar) changes the room the strip may take */
  try {
    var s = document.getElementById('scr-room');
    if (window.ResizeObserver && s) {
      var ro = new ResizeObserver(re), watch = function () { [].forEach.call(s.children, function (c) { if (c !== b && c.id !== 'transcript' && !c.__vbWatched) { c.__vbWatched = true; ro.observe(c); } }); };
      ro.observe(s); watch();
      new MutationObserver(function () { watch(); re(); }).observe(s, { childList: true });   /* a row added later (the reach bar, the typing line) */
    }
  } catch (_) {}
}
function vbInit() {
  try {
    vbCss(); vbWire();
    var b = vbBox(), s = document.getElementById('scr-room'); if (!b || !s) return;
    var sync = function () { var a = vbActive(); if (a && !VB.on) vbShow(); else if (!a && VB.on) vbHide(); };
    var mo = new MutationObserver(sync);
    mo.observe(b, { attributes: true, attributeFilter: ['class'] }); mo.observe(s, { attributes: true, attributeFilter: ['class'] });
    sync();
  } catch (e) { vbLog('init_failed', { e: String(e && e.message || e) }, 'error'); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vbInit); else vbInit();
