/* ═══════════ 29·post-ship PART · RK-1 reach-mark.js — WHETHER THE OTHER PERSON CAN BE REACHED, FROM THE RELAY'S RECORD (candidate 4, plan v21.99.0 §7.20) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — two relay words are routed to this module by a banked edit in handleRelay; it reassigns no function
   adds: rkState, rkLog, rkLine, rkRender, rkOnPeer, rkOnCallReach, rkInit
   markers (rkLog's own prefix 'rk_'): reach_mark, reach_unreachable, init_failed

   THE OWNER'S PROBLEM (2026-10-12): you cannot tell, before or during a call, whether the call can reach the other person. You find out by silence.
   THE RELAY KNOWS. v6.11 says two things, counts only, no id, no endpoint:
     · on every peer announce, `reach: {known, subs}` — the OTHER devices this room knows and how many hold a fresh push subscription;
     · after a call-start's push attempt, `call-reach {app, pushed, none, muted}` to the CALLER — what the recipient record says.
   ONLY THE NEGATIVE CLAIM IS HONEST (review 2026-10-12): a subscription's existence is not deliverability (an abandoned phone, a tab beside an
   installed copy, a push endpoint the service has not yet declared dead all count); so the mark says "won't be alerted when away" when
   known > 0 and subs === 0, and says NOTHING otherwise. It is a dim line above the composer, beside the reach bar (one's own reachability),
   never in the room ribbon (a third span there is the first thing a narrow phone clips). The caller's line is on the call screen: when nobody
   is in the app, nobody's push was accepted and someone was unreachable or muted, "… can't be reached when away yet" replaces "Ringing…"
   through l10nCap (a language switch re-words it); the ring goes on — they may open the app.
   The name is used only when the room knows exactly one other device; otherwise the generic line (a 3-person room has no per-person model). */
var rkState = { reach: null, line: '' };
function rkLog(what, d, lvl) { try { log('rk_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function rkLine(reach) {
  if (!reach || !(reach.known > 0) || reach.subs > 0) return '';
  var room = (typeof activeRoom === 'function') ? activeRoom() : null;
  return reach.known === 1 ? l10n('reach_none', { who: (room && room.partnerName) || l10n('partner') }) : l10n('reach_none_many');
}
function rkRender() {
  var compose = document.querySelector('#scr-room .compose'); if (!compose || !compose.parentNode) return;
  var line = (S.view === 'room') ? rkLine(rkState.reach) : '';
  var el = document.getElementById('rk-line');
  if (!line) { if (el && el.parentNode) el.parentNode.removeChild(el); rkState.line = ''; return; }
  if (!el) { el = document.createElement('div'); el.id = 'rk-line'; el.className = 'rh-bar rk-line'; var bar = document.getElementById('rh-bar'); compose.parentNode.insertBefore(el, bar || compose); }
  if (line !== rkState.line) { el.innerHTML = '<div class="rh-t rh-warn"></div>'; el.firstChild.textContent = line; rkState.line = line; rkLog('reach_mark', { known: rkState.reach.known, subs: rkState.reach.subs }, 'info'); }
}
function rkOnPeer(d) {
  if (!d || !d.reach || typeof d.reach.known !== 'number') return;
  rkState.reach = { known: d.reach.known, subs: d.reach.subs || 0 };
  rkRender();
}
function rkOnCallReach(d) {
  if (!d || d.type !== 'call-reach') return;
  var app = d.app || 0, pushed = d.pushed || 0, none = d.none || 0, muted = d.muted || 0;
  if (app > 0 || pushed > 0 || none + muted === 0) return;
  var sub = document.getElementById('n10-sub'), ov = document.getElementById('n10-out'); if (!sub || !ov || !ov.classList.contains('show')) return;   /* only the caller's screen, only while it is up */
  var room = (typeof activeRoom === 'function') ? activeRoom() : null; var one = (none + muted) === 1 && (!rkState.reach || rkState.reach.known <= 1);
  sub.textContent = one ? l10nCap('n10-sub', 'n10_unreachable', { who: (room && room.partnerName) || l10n('partner') }) : l10nCap('n10-sub', 'n10_unreachable_many');
  rkLog('reach_unreachable', { none: none, muted: muted, callId: d.callId || null }, 'warn');
}
function rkInit() {
  try {
    var scr = document.getElementById('scr-room');
    if (scr && typeof MutationObserver === 'function') new MutationObserver(function () { try { rkRender(); } catch (_) {} }).observe(scr, { attributes: true, attributeFilter: ['class'] });
  } catch (e) { rkLog('init_failed', { e: String(e && e.message || e) }, 'error'); }
}
rkInit();
