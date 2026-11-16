/* ═══════════ 30·ship PART · CI-1 camera-icon.js — THE CAMERA-OFF ICON KEEPS ITS BODY (§7.25 item 3, B-9b, 11.7) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — one style rule, after the ribbon's own; it reassigns no function
   adds: CI_CSS, ciInit
   markers (log, prefix 'ci_'): init_failed

   THE OWNER (2026-08-14, again 2026-11-16 with two screenshots): the camera-off icon in a video call reads as a speaker.
   THE CAUSE: `.meter-btn.off .cam-fill{display:none}` — on the microphone `.mic-fill` is only the level fill, but on the camera
   `.cam-fill` is the camera's BODY (the rect, fill="none"); off left the lens triangle and the slash.
   THE CHANGE: one rule keeps the body when off; the slash rule is untouched. Nothing else in the ribbon moves (the owner's
   DO-NOT-BREAK exception for 11.7: the smallest possible change). */
var CI_CSS = '#rb-cam.off .cam-fill{display:inline}';
function ciInit() {
  try { if (document.getElementById('ci-css')) return; var st = document.createElement('style'); st.id = 'ci-css'; st.textContent = CI_CSS; document.head.appendChild(st); }
  catch (e) { try { log('ci_init_failed', { e: String(e && e.message || e) }, 'error'); } catch (_) {} }
}
if (typeof document !== 'undefined') ciInit();
