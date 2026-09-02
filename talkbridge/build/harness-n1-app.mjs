#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
const partSrc = fs.readFileSync(process.argv[2] || 'talkbridge/parts/n1-app-join-thread.js', 'utf8');
// prove the assembled artifact actually carries this part
const html = fs.readFileSync('talkbridge/bridge-turn25-base.html', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
ok(html.includes('n1-app-join-thread') || html.includes('n1_join_thread_wired'), 'part present in assembled artifact');
ok(html.includes("register('./tb-sw-25b.js', { scope: '/stuff/talkbridge/' })"), 'artifact registers the N1 worker at the canonical scope');
const dom = new JSDOM('<body><div class="modal-scrim" id="m-s13"><div class="modal"><button id="s13-keys"></button></div></div></body>', { url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html', runScripts: 'outside-only' });
const w = dom.window; const logged = [];
w.log = (ev, d) => logged.push(ev);
let nav = null, reloaded = false;
// jsdom location is not settable to cross-doc; intercept via defineProperty shim object
const loc = { href: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html', reload: () => { reloaded = true; } };
const src = partSrc.replace(/location\.href/g, '__loc.href').replace(/location\.reload\(\)/g, '__loc.reload()');
w.__loc = new Proxy(loc, { set(t, k, v) { if (k === 'href') nav = v; t[k] = v; return true; } });
w.eval(src);
await new Promise(r => { if (w.document.readyState !== 'loading') r(); else w.document.addEventListener('DOMContentLoaded', r); });
const btn = w.document.getElementById('s13-join');
ok(!!btn, 'fourth option "Join thread" injected into clock menu');
ok(logged.includes('n1_join_thread_wired') && logged.includes('n1_notif_cfg'), 'wiring + notification-config lines fire');
btn.dispatchEvent(new w.Event('click'));
ok(!!w.document.getElementById('m-n1join'), 'join modal created');
w.document.getElementById('n1-join-url').value = 'garbage with no invite';
w.document.getElementById('n1-join').dispatchEvent(new w.Event('click'));
ok(nav === null && logged.includes('n1_join_thread_bad_link'), 'invalid link rejected, no navigation');
w.document.getElementById('n1-join-url').value = 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html#j=eyJyIjoiYWJjIn0';
w.document.getElementById('n1-join').dispatchEvent(new w.Event('click'));
ok(nav !== null && nav.includes('#j=eyJyIjoiYWJjIn0'), 'valid invite navigates to its #j= address');
ok(reloaded === true, 'same-page invite forces the boot join path (reload fires)');
console.log(fail === 0 ? 'N1-APP GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
