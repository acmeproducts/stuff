#!/usr/bin/env node
import fs from 'fs';
const src = fs.readFileSync(process.argv[2] || 'talkbridge/worker-talk.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
ok(src.includes('payload.web_push = 8030;'), 'declarative magic key present (Apple path)');
ok(/payload\.notification = \{ title:.*TalkBridge/.test(src), 'notification.title mirrors banner scheme');
ok(src.includes("navigate: DECL_APP_URL + '#ev='"), 'navigate carries the event');
ok(/Content-Type': \(\/\\\.push\\\.apple\\\.com\//.test(src), 'Content-Type declarative ONLY for Apple endpoints');
ok(src.includes("const isApple = /\\.push\\.apple\\.com/i.test(endpoint);"), 'endpoint split present');
ok(/if \(isApple\) \{\s*payload\.web_push = 8030;/.test(src), 'declarative envelope added only for Apple');
ok(src.includes("r.pushMode = isApple ? 'declarative' : 'classic';"), 'push mode logged per send');
ok(src.includes("t: 'tb-ev', id: ev.id, room: sessionId"), 'legacy tb-ev fields unchanged for the SW path');
ok(src.includes('silent: false'), 'sound not suppressed');
console.log(fail === 0 ? 'N1-RELAY GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
