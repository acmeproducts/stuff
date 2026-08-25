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
  s => s.replace("return r10EnableNotifications();                    /* silent: permission already granted */", 'return;')],
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
