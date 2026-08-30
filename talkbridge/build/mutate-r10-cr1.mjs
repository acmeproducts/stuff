#!/usr/bin/env node
/* R10-CR1 mutation gate (plan v20.9.0 §4.11.5): every scenario row has a paired
   planted defect proving the assertion can fail. Each mutation reintroduces a
   real buried failure into a COPY of the relay; the harness must go red. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORKER = path.join(here, '../worker-talk.js');
const HARNESS = path.join(here, 'harness-r10-cr1.mjs');
const RELAY_HARNESS = path.join(here, 'harness-relay-r10-cr1.mjs');
const src = fs.readFileSync(WORKER, 'utf8');

const MUTATIONS = [
  {
    name: 'G18 · seen inferred from replay: history GET marks every event seen',
    find: "      const since = Number(url.searchParams.get('since') || 0);",
    replace: "      const since = Number(url.searchParams.get('since') || 0);\n      for (const rec of Object.values(this.events)) { if (rec.rcp[clientId]) { rec.rcp[clientId].s = 1; } }"
  },
  {
    name: "G19 · harness-word missed: bare call-end maps to canceled unless reason==='missed'",
    find: "      const rec = this.activeCall && this.events[this.activeCall];\n      if (rec && !rec.ended) {\n        this._closeCall(rec);",
    replace: "      const rec = this.activeCall && this.events[this.activeCall];\n      if (rec && !rec.ended) {\n        if (msg.reason === 'missed') this._closeCall(rec); else { rec.ended = true; }"
  },
  {
    name: 'double-count · every call-end mints a second missed record (dual authority)',
    find: "      if (rec && !rec.ended) {\n        this._closeCall(rec);\n        msg._evtId = rec.id;\n      }",
    replace: "      if (rec) {\n        this._closeCall(rec);\n        msg._evtId = rec.id;\n      }\n      const dupId = 'callend:' + (msg.ts || Date.now());\n      const dup = this._newRecord(dupId, (rec && rec.kind) || 'voice', senderId, msg.ts);\n      this._closeCall(dup);"
  },
  {
    name: 'outcome-not-separate · a decline is recorded as missed',
    find: "        rec.rcp[senderId].o = 'declined'; rec.rcp[senderId].s = 1; rec.rcp[senderId].st = Date.now();",
    replace: "        rec.rcp[senderId].o = 'missed'; rec.rcp[senderId].s = 0;"
  },
  {
    name: 'restart-amnesia · events are not restored from durable storage',
    find: "      this.events = stored.get('events') || {};",
    replace: "      this.events = {};"
  },
  {
    name: 'burst-erasure · suppressed burst members are not recorded at all',
    find: "        if (now - last < 10000) {\n          this._setPresentation(evt.id, clientId, 'suppressed');\n          continue;\n        }",
    replace: "        if (now - last < 10000) {\n          delete this.events[evt.id];\n          continue;\n        }"
  }
];

let bad = 0;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-cr1-mut-'));
for (const m of MUTATIONS) {
  if (!src.includes(m.find)) { console.log('FAIL  ' + m.name + '  — anchor missing (mutation cannot be planted)'); bad += 1; continue; }
  const mutated = src.replace(m.find, m.replace);
  const file = path.join(tmp, 'worker-' + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(file, mutated);
  let caught = false;
  try {
    execFileSync(process.execPath, [RELAY_HARNESS], { env: Object.assign({}, process.env, { TB_WORKER: file }), stdio: 'pipe' });
  } catch (_) { caught = true; }
  console.log((caught ? 'PASS' : 'FAIL') + '  ' + m.name + (caught ? '  — harness went red as required' : '  — HARNESS STAYED GREEN WITH THE DEFECT PLANTED'));
  if (!caught) bad += 1;
}

/* App-side mutations: planted against the assembled candidate by the app harness itself. */
if (fs.existsSync(HARNESS)) {
  try {
    execFileSync(process.execPath, [HARNESS, '--mutations'], { stdio: 'inherit' });
  } catch (_) { bad += 1; }
}

if (bad) { console.error(bad + ' mutation(s) not caught'); process.exit(1); }
console.log('mutation gate: every planted defect was caught');
