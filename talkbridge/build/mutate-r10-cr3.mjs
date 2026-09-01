#!/usr/bin/env node
/* R10-CR3 mutation gate (plan v20.9.0 §4.11.5): every scenario assertion must
   be able to fail. Each planted defect below is reintroduced into a copy of
   the relay and the relay harness must go red. Then the app harness plants
   its own defects. Exit 1 if any planted defect stays green. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const RELAY = path.resolve('talkbridge/worker-talk.js');
const RELAY_HARNESS = path.resolve('talkbridge/build/harness-relay-r10-cr3.mjs');
const APP_HARNESS = path.resolve('talkbridge/build/harness-r10-cr3.mjs');
const src = fs.readFileSync(RELAY, 'utf8');

const MUTATIONS = [
  { name: 'replay-seen · history replay marks events seen',
    find: "      return json(msgs);\n    }",
    replace: "      for (const ev of Object.values(this.events)) { const r = ev.rcp[clientId]; if (r) r.s = 'seen'; }\n      return json(msgs);\n    }" },
  { name: 'fake-missed-word · missed requires a harness reason instead of the bare hang-up',
    find: "      if (clientId === ev.from || !r) {\n        ev.ended = true; ev.endedAt = Date.now();\n        for (const [cid, rr] of Object.entries(ev.rcp)) { if (rr.o === 'offered') rr.o = 'missed'; else if (rr.o === 'accepted') rr.o = 'ended'; }",
    replace: "      if (clientId === ev.from || !r) {\n        ev.ended = true; ev.endedAt = Date.now();\n        for (const [cid, rr] of Object.entries(ev.rcp)) { if (rr.o === 'offered' && msg.reason === 'missed') rr.o = 'missed'; else if (rr.o === 'accepted') rr.o = 'ended'; }" },
  { name: 'double-count · a repeated call-end re-misses the call under a fresh record',
    find: "    const ev = (msg.callId && this._openCall(String(msg.callId))) || this._latestOpenCallFrom(clientId);\n    if (!ev) return;",
    replace: "    const ev = (msg.callId && this.events[String(msg.callId)]) || this._latestOpenCallFrom(clientId);\n    if (!ev) return;\n    if (msg.type === 'call-end' && ev.ended) { const dupId = ev.id + '-again-' + Object.keys(this.events).length; const dup = JSON.parse(JSON.stringify(ev)); dup.id = dupId; for (const rr of Object.values(dup.rcp)) { if (rr.o === 'missed') rr.s = 'unseen'; } this.events[dupId] = dup; await this._saveEvents(); for (const cid of Object.keys(ev.rcp)) this._pushProjection(cid); return; }" },
  { name: 'decline-as-missed · a declined receiver becomes missed at call-end',
    find: "for (const [cid, rr] of Object.entries(ev.rcp)) { if (rr.o === 'offered') rr.o = 'missed';",
    replace: "for (const [cid, rr] of Object.entries(ev.rcp)) { if (rr.o === 'offered' || rr.o === 'declined') rr.o = 'missed';" },
  { name: 'restart-amnesia · records are not reloaded from storage',
    find: "      this.events = stored.get('events') || {};",
    replace: "      this.events = {};" },
  { name: 'burst-erasure · suppressed burst members are not recorded',
    find: "      const p = this._decide(ev, cid, now);\n      ev.rcp[cid] =",
    replace: "      const p = this._decide(ev, cid, now);\n      if (p === 'suppressed') continue;\n      ev.rcp[cid] =" },
  { name: 'stale-state · a visible state reported long ago is trusted forever',
    find: "    if (Date.now() - st.at > STATE_FRESH_MS) return null;",
    replace: "    /* stale states trusted */" },
  { name: 'muted-as-os · a muted device is pushed anyway',
    find: "    if (st && st.muted) return 'muted';",
    replace: "    if (st && st.muted) return 'os_requested';" },
  { name: 'visible-pushed · a visible receiver is pushed beside its in-app surface',
    find: "    if (st && st.visible && this._isConnected(clientId)) return 'in_app';",
    replace: "    if (st && st.visible && this._isConnected(clientId)) return 'os_requested';" },
  { name: 'retry-double-push · a resent event pushes again',
    find: "      if (r.p !== 'os_requested' || r.push !== 'not_requested') continue;",
    replace: "      if (r.p !== 'os_requested') continue;" },
  { name: 'accept-not-separate · accepting does not change the receiver outcome',
    find: "    if (msg.type === 'call-accept') { if (r && r.o === 'offered') { r.o = 'accepted';",
    replace: "    if (msg.type === 'call-accept') { if (false) { r.o = 'accepted';" }
];

let bad = 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-cr3-mut-'));
for (const m of MUTATIONS) {
  if (!src.includes(m.find)) { console.log('FAIL  ' + m.name + '  — anchor missing (mutation cannot be planted)'); bad += 1; continue; }
  const file = path.join(tmp, 'worker-' + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(file, src.replace(m.find, m.replace));
  let caught = false;
  try { execFileSync(process.execPath, [RELAY_HARNESS, '--quiet'], { env: Object.assign({}, process.env, { TB_WORKER: file }), stdio: 'pipe' }); }
  catch (_) { caught = true; }
  console.log((caught ? 'PASS' : 'FAIL') + '  relay · ' + m.name + (caught ? '  — harness went red as required' : '  — HARNESS STAYED GREEN WITH THE DEFECT PLANTED'));
  if (!caught) bad += 1;
}

const SW_HARNESS = path.resolve('talkbridge/build/harness-sw-r10-cr3.mjs');
if (fs.existsSync(SW_HARNESS)) {
  try { execFileSync(process.execPath, [SW_HARNESS, '--mutations'], { stdio: 'inherit' }); }
  catch (_) { bad += 1; }
}
if (fs.existsSync(APP_HARNESS)) {
  try { execFileSync(process.execPath, [APP_HARNESS, '--mutations'], { stdio: 'inherit' }); }
  catch (_) { bad += 1; }
}

if (bad) { console.error(bad + ' planted defect(s) not caught'); process.exit(1); }
console.log('mutation gate: every planted defect was caught');
