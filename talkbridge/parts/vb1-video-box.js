/* ═══════════ 30·base PART · VB-1 video-box.js — THE VIDEO BOX: A WINDOW YOU DRAG, SHAPED LIKE ITS PICTURE (§7.22, candidate 2) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — it watches the call band's class and the room screen's call state; it reassigns no function
   adds: VB, vbLog, vbCss, vbBox, vbActive, vbBounds, vbAspect, vbShapes, vbSize, vbClamp, vbPlace, vbReshape, vbSave, vbLoad, vbShow, vbHide, vbWire, vbInit
   markers (vbLog's own prefix 'vb_'): shown, moved, init_failed, camera, shape

   THE OWNER (2026-10-22): "instead of being just a percentage of the screen it should be the tall 9:16 that's draggable,
   because in its current state it cuts off what you can see and what the recipient can see."
   THE CAUSE: the video sat in a full-width band 228 px tall with object-fit:cover — a phone's portrait picture was cut to a
   wide strip — and the self-view was an 82×110 cover crop, a different shape from what the partner receives.
   CANDIDATE 1 WAS REJECTED (G77): a FIXED 9:16 window, whole pictures (contain), the camera asked for 720×1280 — the Android
   sent 1280×720 landscape and the receiver saw it banded. CANDIDATE 2: the camera is opened exactly as the accepted app opens
   it, and THE WINDOW TAKES THE SHAPE OF THE PICTURE IT SHOWS (the big video's own videoWidth/videoHeight, re-read on every
   'resize'/'loadedmetadata' and on a swap; 3:4 portrait until the first frame) — so it neither crops nor bands: a phone's tall
   picture makes a tall window. The inset takes the shape of the small picture — exactly what the partner receives.
   THE CHANGE (video calls only; a voice call never shows the band): the band becomes a floating window over the room;
   both pictures are shown whole (contain) in frames of their own shape — so a misread shape shows as a thin band, never as a
   silent crop; the shape is re-read on loadedmetadata/resize/playing, on a swap, and once a second (Safari's resize on a stream
   is not to be trusted; review 2026-10-22); a change under 3% (WebRTC rescaling) is not a change; the window reshapes keeping its
   top edge and its nearer side; the inset is capped at 45% of the window's height; press-and-move drags the whole window (clamped,
   always fully on screen, remembered per phone); a press that does not move is a tap and swaps the pictures as before; the
   old small-video drag and its edge handle are off while the window shows; subtitles sit at the window's top.
   REVIEW (2026-10-22, independent): z 15 — above the ribbon (5) and the scroll button (8), below every dialog, drawer, sheet,
   overlay and toast (20+); bounds are the APP COLUMN (#app, max 480 px) less the safe areas, not the window; the height is
   capped by the room below the ribbon (a phone on its side); a call that ends WITHOUT the hang-up wrap (the partner hangs up,
   a decline, the caller's cancel call teardown() directly) still leaves no swap and no inline position — VB-1 resets them when
   the band closes. The box is an in-page window: like the band before it, it does not survive leaving the app (G35/V2 note). */
var VB = { on: false, W: 0, H: 0, x: 0, y: 0, b: null, press: null, moved: false, swallowClick: false, KEY: 'tb_vbox_pos', SLOP: 8, big: 0.75, small: 0.75, DEF: 0.75, poll: null, TOL: 0.03 };
function vbLog(what, d, lvl) { try { log('vb_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function vbCss() {
  if (document.getElementById('vb-css')) return;
  var S = '#scr-room.st-video #call-band.on';
  var css =
    S + '{position:fixed;left:var(--vb-x,8px);top:var(--vb-y,64px);width:var(--vb-w,180px);height:var(--vb-h,240px);z-index:15;' +
      'border-radius:14px;overflow:hidden;-webkit-mask-image:-webkit-radial-gradient(white,black);background:#000;box-shadow:0 6px 24px rgba(0,0,0,.38);touch-action:none;' +
      'user-select:none;-webkit-user-select:none;cursor:grab}' +
    S + ' .videos{width:100%;height:100%;background:#000}' +
    /* the big picture fills a window of its own shape: no band, no crop */
    S + ' .videos:not(.swapped) #remote-video,' + S + ' .videos.swapped #local-video{position:absolute;inset:0;width:100%;height:100%;' +
      'object-fit:contain;border:0;border-radius:0;background:#000;z-index:1}' +
    /* the small picture: a frame of its own shape, bottom-right */
    S + ' .videos:not(.swapped) #local-video,' + S + ' .videos.swapped #remote-video{position:absolute;left:auto;top:auto;right:6px;bottom:6px;' +
      'width:min(32%, calc(var(--vb-h,240px) * 0.45 * var(--vb-sar,0.75)));height:auto;aspect-ratio:var(--vb-sar,0.75);object-fit:contain;background:#000;border-radius:8px;border:1.5px solid rgba(255,255,255,.4);z-index:3}' +
    S + ' #subtitle-area{left:6px;right:6px;top:6px;bottom:auto}' +
    S + ' .subtitle-line{font-size:12px}' +
    S + ' #btn-flip-overlay{left:6px;bottom:6px}' +
    S + ' #local-video-handle{display:none!important}' +
    S + ' *{touch-action:none}' +
    '#vb-probe{position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}';
  var st = document.createElement('style'); st.id = 'vb-css'; st.textContent = css; document.head.appendChild(st);
  var pr = document.createElement('div'); pr.id = 'vb-probe'; document.body.appendChild(pr);
}
/* the room the box may use: the app column, less the phone's safe areas, below the ribbon's top edge */
function vbBounds() {
  var vw = window.innerWidth || 360, vh = window.innerHeight || 640, a = { left: 0, top: 0, right: vw, bottom: vh };
  try { var app = document.getElementById('app'); if (app) { var r = app.getBoundingClientRect(); if (r.width > 0 && r.height > 0) a = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; } } catch (_) {}
  try { var cs = getComputedStyle(document.getElementById('vb-probe')); a.top += parseFloat(cs.paddingTop) || 0; a.right -= parseFloat(cs.paddingRight) || 0; a.bottom -= parseFloat(cs.paddingBottom) || 0; a.left += parseFloat(cs.paddingLeft) || 0; } catch (_) {}
  var rib = 0; try { var rb = document.getElementById('room-ribbon'); if (rb) { var q = rb.getBoundingClientRect(); if (q.bottom > a.top) rib = q.bottom; } } catch (_) {}
  a.ribbon = Math.max(a.top, rib);
  return a;
}
function vbBox() { return document.getElementById('call-band'); }
function vbActive() {
  var b = vbBox(), s = document.getElementById('scr-room');
  return !!(b && s && b.classList.contains('on') && s.classList.contains('st-video'));
}
/* a picture's shape (width ÷ height) from its own frames; null until the first frame */
function vbAspect(el) { return (el && el.videoWidth > 0 && el.videoHeight > 0) ? el.videoWidth / el.videoHeight : null; }
function vbShapes() {
  var sw = false; try { var h = document.getElementById('call-videos'); sw = !!(h && h.classList.contains('swapped')); } catch (_) {}
  var rv = document.getElementById('remote-video'), lv = document.getElementById('local-video');
  var big = sw ? lv : rv, small = sw ? rv : lv;
  return { big: vbAspect(big) || VB.DEF, small: vbAspect(small) || VB.DEF, bigPx: big ? [big.videoWidth || 0, big.videoHeight || 0] : [0, 0], smallPx: small ? [small.videoWidth || 0, small.videoHeight || 0] : [0, 0] };
}
function vbSize() {
  var b = VB.b = vbBounds(), aw = b.right - b.left, a = VB.big || VB.DEF, W, H;
  if (a <= 1) { W = Math.max(140, Math.min(260, aw * 0.55)); H = W / a; }          /* a tall picture: a tall window */
  else { W = Math.max(180, Math.min(380, aw * 0.8)); H = W / a; }                   /* a wide picture (a laptop): a wide window */
  W = Math.min(W, aw - 16); H = W / a;
  var room = (b.bottom - b.ribbon) - 16;   /* below the ribbon, 8 px each side */
  if (H > room) { H = Math.max(100, room); W = H * a; }   /* a phone on its side: the window still fits */
  VB.W = Math.round(W); VB.H = Math.round(H);
  var box = vbBox(); if (box) box.style.setProperty('--vb-sar', String(+(VB.small || VB.DEF).toFixed(4)));
}
function vbClamp() {
  var b = VB.b || vbBounds();
  VB.x = Math.max(b.left, Math.min(b.right - VB.W, VB.x)); VB.y = Math.max(b.top, Math.min(b.bottom - VB.H, VB.y));
}
function vbPlace() {
  var b = vbBox(); if (!b) return;
  vbClamp();
  b.style.setProperty('--vb-w', VB.W + 'px'); b.style.setProperty('--vb-h', VB.H + 'px');
  b.style.setProperty('--vb-x', Math.round(VB.x) + 'px'); b.style.setProperty('--vb-y', Math.round(VB.y) + 'px');
}
/* the picture changed shape (first frame, a swap, a flip): the window follows it, keeping its centre where it was */
function vbReshape(why) {
  if (!VB.on) return;
  var sh = vbShapes(), same = function (a, b) { return Math.abs(a / b - 1) <= VB.TOL; };
  if (why !== 'show' && same(sh.big, VB.big) && same(sh.small, VB.small)) return;
  var bb = VB.b || vbBounds(), right = (VB.x + VB.W / 2) > (bb.left + (bb.right - bb.left) / 2), rx = VB.x + VB.W;
  VB.big = sh.big; VB.small = sh.small; vbSize();
  if (why !== 'show' && right) VB.x = rx - VB.W;   /* keep the top edge and the nearer side where they were */
  vbPlace();
  var set = null; try { var tr = (typeof CALL !== 'undefined' && CALL.stream && CALL.stream.getVideoTracks) ? CALL.stream.getVideoTracks()[0] : null; var st = tr && tr.getSettings ? tr.getSettings() : null; if (st) set = [st.width || 0, st.height || 0]; } catch (_) {}
  vbLog('shape', { why: why, big: sh.bigPx, small: sh.smallPx, cam: set, w: VB.W, h: VB.H }, 'ok');
}
function vbSave() {
  var b = VB.b || vbBounds(), sx = (b.right - b.left) - VB.W, sy = (b.bottom - b.top) - VB.H;
  var fx = sx > 0 ? (VB.x - b.left) / sx : 1, fy = sy > 0 ? (VB.y - b.top) / sy : 0;
  try { localStorage.setItem(VB.KEY, JSON.stringify({ fx: +fx.toFixed(4), fy: +fy.toFixed(4) })); } catch (_) {}
  return { fx: +fx.toFixed(3), fy: +fy.toFixed(3) };
}
function vbLoad() {
  var b = VB.b || vbBounds(), p = null;
  try { p = JSON.parse(localStorage.getItem(VB.KEY) || 'null'); } catch (_) {}
  if (p && isFinite(p.fx) && isFinite(p.fy)) { var fx = Math.max(0, Math.min(1, +p.fx)), fy = Math.max(0, Math.min(1, +p.fy)); VB.x = b.left + fx * ((b.right - b.left) - VB.W); VB.y = b.top + fy * ((b.bottom - b.top) - VB.H); return; }
  VB.x = b.right - VB.W - 8; VB.y = b.ribbon + 8;   /* first call on this phone: top-right, under the ribbon */
}
function vbShow() {
  VB.on = true; var sh = vbShapes(); VB.big = sh.big; VB.small = sh.small; vbSize(); vbLoad(); vbPlace();
  var lv = document.getElementById('local-video');
  vbLog('shown', { w: VB.W, h: VB.H, self: lv ? { vw: lv.videoWidth || 0, vh: lv.videoHeight || 0, rs: lv.readyState, paused: !!lv.paused, shown: lv.style.display !== 'none' } : null, camOn: (typeof CALL !== 'undefined') ? !!CALL.camOn : null }, 'ok');
  vbReshape('show');
  try { clearInterval(VB.poll); VB.poll = setInterval(function () { vbReshape('poll'); }, 1000); } catch (_) {}
  /* the device gate reads the shape each phone really sends (the camera is asked for 9:16 as an ideal) */
  try { var tr = (typeof CALL !== 'undefined' && CALL.stream && CALL.stream.getVideoTracks) ? CALL.stream.getVideoTracks()[0] : null; var st = tr && tr.getSettings ? tr.getSettings() : null; if (st) vbLog('camera', { w: st.width || 0, h: st.height || 0, facing: st.facingMode || '' }, 'ok'); } catch (_) {}
}
function vbHide() {
  VB.on = false; VB.press = null; VB.moved = false; VB.swallowClick = false;
  try { clearInterval(VB.poll); VB.poll = null; } catch (_) {}
  /* the call ended — by any path, the hang-up wrap or not: no swap and no dragged position is carried to the next call */
  try { if (typeof TB_SWAP !== 'undefined') TB_SWAP = false; } catch (_) {}
  try { var h = document.getElementById('call-videos'); if (h) h.classList.remove('swapped'); } catch (_) {}
  ['remote-video', 'local-video'].forEach(function (id) { var el = document.getElementById(id); if (!el) return; if (el.__tbDragState) el.__tbDragState.on = false; try { tbClearPos(el); } catch (_) {} });
}
function vbWire() {
  var b = vbBox(); if (!b || b.__vbWired) return; b.__vbWired = true;
  function pt(ev) { var t = ev.touches && ev.touches[0] ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0] : ev); return { x: t.clientX, y: t.clientY }; }
  function down(ev) {
    if (!vbActive()) return;
    if (ev.target && ev.target.closest && ev.target.closest('button')) return;   /* the flip button is never a drag */
    var p = pt(ev); VB.press = { sx: p.x, sy: p.y, x0: VB.x, y0: VB.y }; VB.moved = false;
    ev.stopPropagation();   /* capture phase: the old small-video drag never starts while the window shows */
  }
  function move(ev) {
    if (!VB.press || !vbActive()) return;
    var p = pt(ev), dx = p.x - VB.press.sx, dy = p.y - VB.press.sy;
    if (!VB.moved && Math.abs(dx) < VB.SLOP && Math.abs(dy) < VB.SLOP) return;
    VB.moved = true;
    if (ev.cancelable) { try { ev.preventDefault(); } catch (_) {} }   /* the page does not scroll under a drag */
    VB.x = VB.press.x0 + dx; VB.y = VB.press.y0 + dy; vbPlace();
  }
  function up() {
    if (!VB.press) return;
    if (VB.moved) { VB.swallowClick = true; vbLog('moved', vbSave(), 'ok'); setTimeout(function () { VB.swallowClick = false; }, 400); }
    VB.press = null; VB.moved = false;
  }
  b.addEventListener('touchstart', down, { capture: true, passive: true });
  b.addEventListener('mousedown', down, true);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('mousemove', move);
  document.addEventListener('touchend', up); document.addEventListener('touchcancel', up); document.addEventListener('mouseup', up);
  b.addEventListener('click', function (ev) { if (VB.swallowClick) { VB.swallowClick = false; ev.stopPropagation(); try { ev.preventDefault(); } catch (_) {} } }, true);   /* a drag never swaps */
  var re = function () { if (VB.on) { vbSize(); vbPlace(); } };
  window.addEventListener('resize', re); window.addEventListener('orientationchange', re);
  ['remote-video', 'local-video'].forEach(function (id) { var el = document.getElementById(id); if (!el) return; ['loadedmetadata', 'resize', 'playing'].forEach(function (t) { el.addEventListener(t, function () { vbReshape(t); }); }); });
  try { var hv = document.getElementById('call-videos'); if (hv) new MutationObserver(function () { vbReshape('swap'); }).observe(hv, { attributes: true, attributeFilter: ['class'] }); } catch (_) {}
  try { if (window.visualViewport) window.visualViewport.addEventListener('resize', re); } catch (_) {}
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
