#!/usr/bin/env node
/* Fresh mutation gate for the v16.0.0 build — every planted defect must fail the harness. */
import { readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
const [shipP, builtP] = process.argv.slice(2);
const built = readFileSync(builtP, 'utf8');
const muts = [
 ['enable banner never renders',
  s => s.replace("host.parentNode.insertBefore(b, host);          /* TOP of the panel, unmissable */", ';')],
 ['banner lingers after permission granted',
  s => s.replace("if (!pa5NeedsEnable()) { if (existing) existing.remove(); return; }", 'if (!pa5NeedsEnable()) { return; }')],
 ['self-heal stops resubscribing dead subscriptions',
  s => s.replace("return step('enable-flow', 15000, r10EnableNotifications());", 'return;')],
 ['the load-time ask never fires (footer-hunt returns)',
  s => s.replace('setTimeout(pa5AutoAsk, 1200);', ';')],
 ['a heal step dies silently again (instrumentation stripped)',
  s => s.replace("function (e) { r8Log('heal_step', { s: name, ok: false, e: String(e && e.message || e) }, 'error'); throw e; });", 'function (e) { throw e; });')],
 ['self-heal prompts people who never granted',
  s => s.replace("if (Notification.permission !== 'granted') return;      /* nothing granted, nothing to heal */", ';')],
 ['background listeners fall silent (the double-alert defect)',
  s => s.replace("for (var id in (LISTEN.socks || {})) LISTEN.send(id, { type: 'ping', transient: true });", ';')],
 ['Chrome-on-iOS routed as Safari',
  s => s.replace("if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\\//.test(ua) || !/Safari\\//.test(ua)) return 'ios-other-browser';", ';')],
 ['lane line loses its permission state',
  s => s.replace("TB_LANE.notif = (window.Notification && Notification.permission) || 'unsupported';", "TB_LANE.notif = 0;")],
 ['a buried design sneaks back in',
  s => s.replace("/* ═══════════ GAP PART · N4-listener-heartbeat.js", "var ACK_GRACE = 1; /* ═══════════ GAP PART · N4-listener-heartbeat.js")],
 ['the permission ask slides back behind the awaits (no prompt on iOS)',
  s => s.replace("var ask = (window.Notification && Notification.permission === 'default')", "var ask = false && (window.Notification && Notification.permission === 'default')")],
 ['the vapid field-name mismatch returns (subscriptions fail everywhere)',
  s => s.replace("var vkey = v && (v.key || v.vapid);", "var vkey = v && v.key;")],

 ['an arriving payload overwrites an existing identity',
  s => s.replace("if (p && p.jn && !(S.user && S.user.name)) {", 'if (p && p.jn) {')],
 ['the typed name stops boarding the live URL (install loses identity)',
  s => s.replace("try { history.replaceState(null, '', newHash); } catch (_) {}", ';')],
 ['the window-level capability gate returns (the 8ms iOS exit)',
  s => s.replace("if (!('serviceWorker' in navigator)) { r8Log('enable_branch', { b: 'no-sw' }, 'error'); r10NotifStatus('unsupported'); return Promise.resolve(); }",
                 "if (!('serviceWorker' in navigator) || !window.PushManager) { r10NotifStatus('unsupported'); return Promise.resolve(); }")],
 ['typing the name stops boarding the invite',
  s => s.replace("p.jn = v;", ';')],
 ['exits go silent again (the masked-denied ghost returns)',
  s => s.replace("r8Log('enable_exit', { e: String(e && e.message || e) }, 'error');", ';')],
 ['the permission answer stops being recorded',
  s => s.replace("r8Log('perm_answer', { perm: perm, prop: (window.Notification && Notification.permission) || '?' }, perm === 'granted' ? 'ok' : 'error');", ';')],
 ['drained receipts vanish before reaching the log',
  s => s.replace("r8Log('sw_receipt', { ev: en.ev, at: en.ts, visible: en.visible, e: en.e }, en.ev === 'notification_failed' ? 'error' : 'ok');", ';')],
 ['no-rooms goes silent again',
  s => s.replace("r8Log('enable_exit', { e: 'no-rooms' }, 'error'); ", '')],
];
let caught = 0;
for (const [name, fn] of muts) {
  const m = fn(built);
  if (m === built) { console.log('NOT APPLIED  ' + name); continue; }
  writeFileSync('/tmp/mut-r10.html', m);
  const r = spawnSync('node', ['harness-r10.mjs', shipP, '/tmp/mut-r10.html'], { timeout: 200000 });
  const ok = r.status !== 0;
  caught += ok;
  console.log((ok ? 'caught  ' : 'MISSED  ') + name);
}
console.log('\n' + caught + '/' + muts.length + ' fresh defects caught');
process.exit(caught === muts.length ? 0 : 1);
