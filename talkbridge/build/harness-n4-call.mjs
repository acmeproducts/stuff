#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
const part = fs.readFileSync(process.argv[2] || 'talkbridge/parts/n4-caller-call-screen.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
ok(fs.readFileSync('talkbridge/bridge-turn25-base.html','utf8').includes('n4_caller_screen'), 'part present in artifact');
const dom = new JSDOM('<body><div id="scr-room"></div></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
const w = dom.window; const logged = []; const sent = [];
w.log = (e, d) => logged.push({ e, d });
w.relaySend = m => sent.push(m);
w.activeRoom = () => ({ id: 'r1', partnerName: 'Sally' });
w.RING = { on: false, start() { this.on = true; }, stop() { this.on = false; } };
w.CALL = {
  active: false, caller: false, micOn: true, startTs: 0, stream: null, _micToggles: 0,
  toggleMic() { this.micOn = !this.micOn; this._micToggles++; },
  async start(kind) { this.active = true; this.caller = true; this.kind = kind; this.startTs = Date.now(); },
  onAccepted() { this.accepted = true; },
  async accept() { this.active = true; this.caller = false; this.startTs = Date.now(); },
  teardown() { this.active = false; },
};
w.eval(part);
await new Promise(r => { if (w.document.readyState !== 'loading') r(); else w.document.addEventListener('DOMContentLoaded', r); });
const CALL = w.CALL;
await CALL.start('voice');
ok(CALL.micOn === false, 'caller microphone is muted while placing the call');
ok(w.document.getElementById('cb-overlay').classList.contains('show'), 'caller sees the call screen');
ok(w.RING.on === true, 'caller hears ring-back');
ok(logged.some(l => l.e === 'n4_caller_screen'), 'caller screen logged');
const placedAt = CALL.startTs;
await new Promise(r => setTimeout(r, 60));
CALL.onAccepted({ role: 'creator' });
ok(CALL.micOn === true, 'microphone goes live when they answer');
ok(w.RING.on === false && !w.document.getElementById('cb-overlay').classList.contains('show'), 'ring-back and call screen stop on answer');
ok(CALL.startTs > placedAt, 'caller clock re-anchors to the accept, not the placement (B-8a)');
// callee side
const CALL2 = w.CALL; CALL2.caller = true;
await CALL2.accept(); await new Promise(r => setTimeout(r, 20));
ok(CALL2.startTs > 0 && CALL2.caller === false, 'callee clock anchored at its accept');
CALL.teardown();
ok(w.RING.on === false, 'teardown always stops the ring-back');
console.log(fail === 0 ? 'N4 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
