/* ═══════════ 30·ship PART · BL-1 build-label.js — EVERY VISIBLE BUILD LABEL READS ONE BUILD RECORD (§7.25 item 1, B-11) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — it reassigns two DATA globals (VERSION, BUILD_INFO) and paints one footer; no function is reassigned
   adds: BL, blLog, blStage, blApply, blWatch, blInit
   markers (blLog's own prefix 'bl_'): applied, failed

   THE OWNER (2026-11-16): the settings sheet said "turn27-ship-video-c5 · built 2026-09-15 00:31 UTC" on a 30·pre-ship phone —
   "I don't think we're keeping it current".
   THE CAUSE: three visible labels are literal text from old stages — the settings footer (27·ship's painter, its own closure
   `BUILD`, repainted on every open), the keys sheet (`BUILD_INFO`, turn23) and About (`VERSION`, turn23). Only the boot log line
   was rewritten per stage.
   THE CHANGE: the stage's identity line (the one every stage already rewrites) records `window.TB_STAGE = { c, file, built, at }`.
   BL-1 sets VERSION and BUILD_INFO from it and paints the footer from it after the old painter (BL-1's observer is registered
   later on the same sheet, so it runs last). A later stage changes its identity line only; nothing here names a stage. */
var BL = { applied: 0, watching: false };
function blLog(what, d, lvl) { try { log('bl_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function blStage() { try { return (typeof window !== 'undefined' && window.TB_STAGE && window.TB_STAGE.c) ? window.TB_STAGE : null; } catch (_) { return null; } }
function blApply(why) {
  try {
    var s = blStage(); if (!s) return false;
    VERSION = s.c;
    BUILD_INFO = { release: s.c, builtAt: s.at };
    var line = s.c + ' · built ' + s.built;
    var f = document.getElementById('s13-build'); if (f && f.textContent !== line) f.textContent = line;
    var a = document.getElementById('about-ver'); if (a && a.textContent && a.textContent !== s.c) a.textContent = s.c;
    if (!BL.applied++) blLog('applied', { c: s.c, why: why }, 'ok');
    return true;
  } catch (e) { blLog('failed', { e: String(e && e.message || e) }, 'error'); return false; }
}
function blWatch() {
  if (BL.watching || typeof MutationObserver === 'undefined') return;
  BL.watching = true;
  ['m-s13', 'm-s11', 'm-about'].forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    try { new MutationObserver(function () { blApply('open'); }).observe(el, { attributes: true, attributeFilter: ['class'] }); } catch (_) {}
  });
}
function blInit() {
  try { blWatch(); blApply('load'); } catch (e) { blLog('failed', { e: String(e && e.message || e) }, 'error'); }
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', blInit); else blInit();
}
