#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const n17 = fs.readFileSync('talkbridge/parts/n17-presence.js', 'utf8');
const n18 = fs.readFileSync('talkbridge/parts/n18-timer.js', 'utf8');

/* presence */
const dom = new JSDOM('<body></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
const w = dom.window; const states = []; const passed = [];
w.log = () => {};
w.setPresence = on => states.push(on);
w.handleRelay = d => { passed.push(d); };
w.LISTEN = { handle: (r, d) => passed.push(d) };
w.eval(n17);
w.handleRelay({ type: 'peer', others: 1 });
ok(states[states.length - 1] === true, 'the dot lights when the relay says someone else is attached');
w.handleRelay({ type: 'peer', others: 0 });
ok(states[states.length - 1] === true, 'a momentary drop does not blink the dot (N20)');
w.handleRelay({ type: 'peer', others: 1 });
await new Promise(r => setTimeout(r, 7000));
ok(states[states.length - 1] === true, 'a reconnect within the grace keeps it lit');
w.handleRelay({ type: 'peer', others: 0 });
await new Promise(r => setTimeout(r, 7000));
ok(states[states.length - 1] === false, 'a real departure does go dark, after the grace');
w.handleRelay({ type: 'chat', id: 'c1' });
ok(passed.length === 1 && passed[0].type === 'chat', 'every other message still reaches the app untouched');
const relay = fs.readFileSync('talkbridge/worker-talk.js', 'utf8');
ok(relay.includes('_announcePeers()'), 'the relay announces who is attached');
ok(/acceptWebSocket\(pair\[1\]\);\n[\s\S]{0,400}?this\._announcePeers\(\)/.test(relay), 'on every join');
ok(/webSocketClose\(ws, code, reason\) \{ try \{ this\._announcePeers\(\)/.test(relay), 'and on every leave');
ok(relay.includes("type: 'peer', transient: true, others"), 'as a transient message that is never stored');

/* timers */
const d2 = new JSDOM('<body><span id="rz-timer"></span></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
const w2 = d2.window; const restarts = []; const stops = [];
w2.log = () => {};
w2.$ = id => w2.document.getElementById(id);
w2.callDuration = ts => '0:00';
w2.startCallTimer = () => restarts.push(Date.now());
w2.stopCallTimer = () => stops.push(1);
w2.CALL = { active: true, caller: true, startTs: 1000,
  onAccepted() { this.sawAccepted = true; },
  async accept() { this.active = true; this.caller = false; } };
w2.eval(n18);
const dialAnchor = w2.CALL.startTs;
w2.CALL.onAccepted({}, {});
ok(w2.CALL.sawAccepted === true, 'the frozen answer handler still runs');
ok(w2.CALL.startTs > dialAnchor, 'the caller clock moves from the DIAL to the ANSWER');
ok(stops.length === 1 && restarts.length === 1, 'and the on-screen clock is restarted there, not left running from the dial');
const before = restarts.length;
await w2.CALL.accept(); await new Promise(r => setTimeout(r, 20));
ok(restarts.length === before + 1, 'the answering side anchors and restarts at the same event');
const skew = Math.abs(w2.CALL.startTs - Date.now());
ok(skew < 200, 'both sides anchor to the same moment, so the two phones agree');
console.log(fail === 0 ? 'N17/N18 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
