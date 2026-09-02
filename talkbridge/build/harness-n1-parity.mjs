#!/usr/bin/env node
import fs from 'fs'; import crypto from 'crypto';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const preBase = fs.readFileSync('bridge-turn25-pre-base.html', 'utf8');
const accepted = fs.readFileSync('bridge-turn24-post-ship.html', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
ok(sha(preBase) === sha(accepted), '25·pre-base still byte-identical to accepted 24·post-ship (rule 0c)');
// reconstruct expected artifact
const r11 = fs.readFileSync('talkbridge/parts/r11-0-log-fidelity.js', 'utf8');
const n1 = fs.readFileSync('talkbridge/parts/n1-app-join-thread.js', 'utf8');
let exp = preBase;
const firstNl = exp.indexOf('\n');
exp = '<!-- 25·base · R11.0 log fidelity · bridge-turn25-base.html · frozen 25·pre-base bytes ' + sha(preBase).slice(0, 12) + ' + talkbridge/parts/r11-0-log-fidelity.js · pair: tb-sw.js + relay v6.2 unchanged -->' + exp.slice(firstNl);
const tail = '\n</script>\n</body>\n</html>';
exp = exp.slice(0, -tail.length) + '\n\n' + r11 + tail;
exp = exp.replace("return navigator.serviceWorker.register('./tb-sw.js').then(function (reg) {",
                  "return navigator.serviceWorker.register('./tb-sw-25b.js').then(function (reg) {");
exp = exp.slice(0, -tail.length) + '\n\n' + n1 + tail;
const got = fs.readFileSync('bridge-turn25-base.html', 'utf8');
ok(got === exp, 'artifact = frozen bytes + R11.0 part + ONE declared line + N1 part, nothing else');
// worker parity
const swBase = fs.readFileSync('tb-sw.js');
const swPart = fs.readFileSync('talkbridge/parts/n1-sw-alerts.js');
const swGot = fs.readFileSync('tb-sw-25b.js');
ok(Buffer.compare(Buffer.concat([swBase, Buffer.from('\n'), swPart]), swGot) === 0, 'tb-sw-25b = frozen tb-sw.js bytes + N1 part; tb-sw.js untouched');
console.log(fail === 0 ? 'N1-PARITY GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
