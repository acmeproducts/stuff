#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const n9 = fs.readFileSync(process.env.N9 || 'talkbridge/parts/n9-notif-permission.js', 'utf8');
const n10 = fs.readFileSync(process.env.N10 || 'talkbridge/parts/n10-caller-call-screen.js', 'utf8');

/* ---------- N9: no extra step, and the card cannot smother the app ---------- */
function permWorld(ua) {
  const dom = new JSDOM('<body><button id="room-menu-btn">menu</button></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
  const w = dom.window; const logged = []; let attempts = 0; let menuOpened = 0;
  const store = {};
  Object.defineProperty(w.navigator, 'userAgent', { value: ua, configurable: true });
  Object.defineProperty(w, 'localStorage', { value: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, configurable: true });
  w.p3Log = (e, d) => logged.push({ e, d });
  w.p3AttemptInGesture = () => { attempts++; };
  w.p3ShowRecipe = () => {};
  w.document.getElementById('room-menu-btn').addEventListener('click', () => { menuOpened++; });
  w.eval(n9);
  return { w, logged, menu: () => menuOpened, attempts: () => attempts };
}
let p = permWorld('Mozilla/5.0 (Linux; Android 14) Chrome/140');
ok(!p.w.document.getElementById('n9-bar'), 'no extra "turn on notifications" bar is ever shown — the app asks for nothing');
p.w.p3ShowRecipe();
let card = p.w.document.getElementById('p3-recipe');
ok(!!card, 'the card still appears on a real denial');
ok(/App info|Allow notifications/.test(card.textContent) && /Alert/.test(card.textContent), 'and gives Android settings on Android');
ok(!/Notification Cent|Banner style/.test(card.textContent), 'never iPhone settings on Android');
p.w.document.getElementById('p3-done').dispatchEvent(new p.w.Event('click', { bubbles: true }));
ok(!p.w.document.getElementById('p3-recipe'), 'dismissing it closes it');
p.w.p3ShowRecipe();
ok(!p.w.document.getElementById('p3-recipe'), 'and it never smothers the app a second time');
ok(p.logged.some(l => l.e === 'n9_recipe_suppressed'), 'the suppression is recorded');
p = permWorld('Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)');
p.w.p3ShowRecipe();
ok(/Notification Centre/.test(p.w.document.getElementById('p3-recipe').textContent), 'iPhone still gets iPhone settings');

/* ---------- N10: the outbound call ---------- */
function callWorld() {
  const dom = new JSDOM('<body><div id="scr-room"></div></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
  const w = dom.window; const logged = []; const sent = [];
  w.log = (e, d) => logged.push({ e, d });
  w.relaySend = m => sent.push(m);
  w.activeRoom = () => ({ id: 'r1', partnerName: 'Sally' });
  w.RING = { on: false, start() { this.on = true; }, stop() { this.on = false; } };
  w.CALL = {
    active: false, caller: false, micOn: true, startTs: 0, micToggles: 0,
    toggleMic() { this.micOn = !this.micOn; this.micToggles++; },
    async start(kind) { this.active = true; this.caller = true; this.kind = kind; this.startTs = Date.now(); this.origStart = true; },
    onAccepted(room, d) { this.acceptedSeen = [room, d]; },
    async accept() { this.active = true; this.caller = false; this.startTs = Date.now(); },
    teardown() { this.active = false; this.toreDown = true; },
  };
  w.eval(n10);
  return { w, logged, sent };
}
let c = callWorld();
await new Promise(r => { if (c.w.document.readyState !== 'loading') r(); else c.w.document.addEventListener('DOMContentLoaded', r); });
const CALL = c.w.CALL;
await CALL.start('voice');
ok(CALL.origStart === true, 'the frozen call logic still runs (wrapped, not replaced)');
ok(CALL.micOn === false, 'the caller microphone is muted while it rings');
ok(c.w.document.getElementById('n10-out').classList.contains('show'), 'the caller sees a call screen');
ok(c.w.RING.on === true, 'the caller hears a ring-back');
ok(/Sally/.test(c.w.document.getElementById('n10-name').textContent), 'it names who is being called');
const dialedAt = CALL.startTs;
await new Promise(r => setTimeout(r, 60));
CALL.onAccepted({ role: 'creator' }, { type: 'call-accept' });
ok(Array.isArray(CALL.acceptedSeen), 'the frozen answer handler still runs with its arguments');
ok(CALL.micOn === true, 'the microphone goes live the moment they answer');
ok(!c.w.document.getElementById('n10-out').classList.contains('show') && c.w.RING.on === false, 'call screen and ring-back stop on answer');
ok(CALL.startTs > dialedAt, 'the caller clock starts at the ANSWER, not the dial (B-8a)');
c = callWorld(); await new Promise(r => setTimeout(r, 10));
const C2 = c.w.CALL; const t0 = Date.now();
await C2.accept(); await new Promise(r => setTimeout(r, 20));
ok(C2.startTs >= t0 && C2.caller === false, 'the answering side starts its clock at the same answer');
ok(c.logged.some(l => l.e === 'n10_accept_anchor'), 'both anchors are recorded in the log');
c = callWorld(); await new Promise(r => setTimeout(r, 10));
await c.w.CALL.start('video');
c.w.document.getElementById('n10-cancel').dispatchEvent(new c.w.Event('click', { bubbles: true }));
ok(c.sent.some(m => m.type === 'call-end'), 'cancelling tells the other side');
ok(c.w.CALL.toreDown === true && c.w.RING.on === false, 'cancelling tears the call down and stops the ring-back');
console.log(fail === 0 ? 'N9/N10 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
