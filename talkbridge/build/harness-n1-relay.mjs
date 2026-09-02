#!/usr/bin/env node
import fs from 'fs';
const src = fs.readFileSync(process.argv[2] || 'talkbridge/worker-talk.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
ok(src.includes('web_push: 8030'), 'declarative magic key present');
ok(/notification: \{ title:.*TalkBridge/.test(src), 'notification.title mirrors banner scheme');
ok(src.includes("navigate: DECL_APP_URL + '#ev='"), 'navigate carries the event');
ok(src.includes("'Content-Type': 'application/notification+json'"), 'declarative Content-Type set');
ok(src.includes("t: 'tb-ev', id: ev.id, room: sessionId"), 'legacy tb-ev fields unchanged for the SW path');
ok(src.includes('silent: false'), 'sound not suppressed');
console.log(fail === 0 ? 'N1-RELAY GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
