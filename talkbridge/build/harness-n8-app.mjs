#!/usr/bin/env node
/* Second-pass audit of the one appended app part: it must answer ev-alive and
   pass EVERYTHING else through untouched, on both the room socket and a listen
   lane. */
import fs from 'fs'; import { JSDOM } from 'jsdom';
const part = fs.readFileSync('talkbridge/parts/n8-alive.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const dom = new JSDOM('<body></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
const w = dom.window;
const seenByApp = []; const sent = []; const seenByListen = [];
w.S = { roomId: 'r1' };
w.log = () => {};
w.cr3Send = (room, m) => sent.push({ room, m });
w.handleRelay = d => { seenByApp.push(d); return 'orig'; };
w.LISTEN = { handle: (room, d) => { seenByListen.push({ room, d }); return 'orig'; } };
w.eval(part);
const passthrough = [
  { type: 'chat', chatId: 'x1' }, { type: 'hello' }, { type: 'ping' },
  { type: 'ev-proj', proj: {} }, { type: 'ev-reply', of: 'ev-state' },
  { type: 'call-offer', callId: 'c1' }, { type: 'webrtc-signal' }, { type: 'chat-read', ids: ['x1'] },
];
passthrough.forEach(m => w.handleRelay(m));
ok(seenByApp.length === passthrough.length, 'every accepted message still reaches the original handler');
ok(seenByApp.map(d => d.type).join() === passthrough.map(d => d.type).join(), 'in the same order, unchanged');
ok(sent.length === 0, 'nothing is answered that should not be');
const before = seenByApp.length;
w.handleRelay({ type: 'ev-alive', token: 'tok1' });
ok(seenByApp.length === before, 'the liveness challenge is not passed on as app traffic');
ok(sent.length === 1 && sent[0].m.type === 'ev-alive-ack' && sent[0].m.token === 'tok1', 'it is answered with the matching token');
ok(sent[0].m.transient === true, 'the answer is transient — never persisted, never history');
ok(sent[0].room === 'r1', 'answered on the room lane it arrived on');
w.LISTEN.handle('r2', { type: 'chat', chatId: 'y1' });
ok(seenByListen.length === 1, 'listen lane still passes accepted traffic through');
w.LISTEN.handle('r2', { type: 'ev-alive', token: 'tok2' });
ok(seenByListen.length === 1 && sent.length === 2 && sent[1].room === 'r2' && sent[1].m.token === 'tok2', 'listen lane answers its own challenge');
console.log(fail === 0 ? 'N8-APP GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
