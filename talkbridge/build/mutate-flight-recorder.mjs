#!/usr/bin/env node
/* OBS1 plant-and-catch gate. Every mutation must make the recorder harness red. */
import {readFileSync,writeFileSync,mkdtempSync} from 'fs';
import {tmpdir} from 'os';import {join} from 'path';import {spawnSync} from 'child_process';
const [builtP,swP,relayP,partP]=process.argv.slice(2);
const base={built:readFileSync(builtP,'utf8'),sw:readFileSync(swP,'utf8'),relay:readFileSync(relayP,'utf8'),part:readFileSync(partP,'utf8')};
const mutations=[
  ['app build identity disappears','app',s=>s.replaceAll('R10.2-OBS1','R10.2-BROKEN')],
  ['canonical action disappears','app',s=>s.replace("action:event+'_'+phase","operation:event+'_'+phase")],
  ['locked state is falsely observed','part',s=>s.replace("locked:1, muted_room:1","locked:1, muted_room:1, locked_provenance:'observed'")],
  ['free-text run note returns','part',s=>s.replace('<select id="tbfr-condition">','<input id="tbfr-note"><select id="tbfr-condition">')],
  ['room recorder control disappears','part',s=>s.replace("if (room) room.appendChild(button('tbfr-room'));",';')],
  ['device record cap becomes unbounded','app',s=>s.replaceAll('MAX_RECORDS = 5000','MAX_RECORDS = 50000').replaceAll('rows.length-5000','rows.length-50000')],
  ['retention expands beyond seven days','app',s=>s.replaceAll('7 * 86400000','70 * 86400000').replaceAll('7*86400000','70*86400000')],
  ['prune batch exceeds 100','app',s=>s.replaceAll('slice(0, 100)','slice(0, 1000)').replaceAll('slice(0,100)','slice(0,1000)')],
  ['memory fallback exceeds 200','part',s=>s.replace('memory.length > 200','memory.length > 2000')],
  ['message text enters detail allow-list','part',s=>s.replace('sourceSeq:1','sourceSeq:1, srcText:1')],
  ['identifier salt disappears','part',s=>s.replace("(shared ? 'tbfr-tr|' : salt() + '|')","(shared ? 'tbfr-tr|' : 'public|')")],
  ['version mismatch no longer blocks','part',s=>s.replace("bad ? 'VERSION MISMATCH · INVALID RUN'","bad ? 'OBS1 · valid'")],
  ['cold-open reconciliation disappears','part',s=>s.replace('function reconcileRecentColdOpen','function missingRecentColdOpen')],
  ['send wrapper stops calling the product','part',s=>s.replace("var ok = _send.apply(this, arguments); record","var ok; record")],
  ['export snapshots diverge','part',s=>s.replaceAll('fetchRelay().then(recordsForRun)','fetchRelay().then(allRecords)')],
  ['worker version changes alone','sw',s=>s.replace("FR_VERSION = 'obs1-sw/1'","FR_VERSION = 'obs1-sw/broken'")],
  ['worker push arrival vanishes','sw',s=>s.replace("frRecord('push','arrival'","frRecord('push_lost','arrival'")],
  ['worker display result vanishes','sw',s=>s.replaceAll("frRecord('notification','show_result'","frRecord('notification','result_lost'")],
  ['worker cold-open target changes','sw',s=>s.replace('openWindow(data.url || self.registration.scope)','openWindow(self.registration.scope + "wrong.html")')],
  ['notification tag becomes global','sw',s=>s.replace("var tag = 'tb-' + (roomId || 'unknown');","var tag = 'tb-all';")],
  ['worker writes a different database','sw',s=>s.replace("FR_DB = 'tb-flight-recorder'","FR_DB = 'tb-other'")],
  ['relay version changes alone','relay',s=>s.replace("FR_VERSION = 'obs1-relay/1'","FR_VERSION = 'obs1-relay/broken'")],
  ['relay ring cap expands','relay',s=>s.replace('FR_MAX = 2000','FR_MAX = 20000')],
  ['relay retention expands','relay',s=>s.replace('FR_AGE_MS = 24 * 60 * 60 * 1000','FR_AGE_MS = 240 * 60 * 60 * 1000')],
  ['relay query limit expands','relay',s=>s.replace('Math.min(500','Math.min(5000')],
  ['relay relationship check is bypassed','relay',s=>s.replace("const related = this._connectedIds().has(clientId) || !!this.subs[clientId];","const related = true;")],
  ['relay exports raw payload','relay',s=>s.replace("provenance:'observed', detail:safe, redactions", "provenance:'observed', detail:safe, payload:message, redactions")],
  ['relay internal scope keys leak','relay',s=>s.replace('delete o._roomKey; delete o._clientKey;',';')],
  ['relay query mutates sequence','relay',s=>s.replace("if (body && body.type === 'diag-trace') {","if (body && body.type === 'diag-trace') { this.seq++;")],
  ['relay receive stage disappears','relay',s=>s.replace("'relay_receive', 'websocket'","'receive_lost', 'websocket'")],
  ['relay trace hash domain diverges','relay',s=>s.replace("'tbfr-tr|' : `tbfr-id|${FR_SALT}|`","'tbfr-other|' : `tbfr-id|${FR_SALT}|`")]
];
const dir=mkdtempSync(join(tmpdir(),'tbfr-mut-'));
let caught=0,total=0;
for(const [name,layer,fn] of mutations){
  const x={...base};
  if(layer==='app'){x.part=fn(x.part);x.built=fn(x.built);}else x[layer]=fn(x[layer]);
  total++;
  if(x.built===base.built&&x.sw===base.sw&&x.relay===base.relay&&x.part===base.part){console.log('NO-OP    '+name);continue;}
  for(const k of Object.keys(x))writeFileSync(join(dir,k+(k==='built'?'.html':'.js')),x[k]);
  const r=spawnSync(process.execPath,[new URL('./harness-flight-recorder.mjs',import.meta.url).pathname,join(dir,'built.html'),join(dir,'sw.js'),join(dir,'relay.js'),join(dir,'part.js')],{encoding:'utf8'});
  if(r.status!==0){caught++;console.log('  caught  '+name);}else console.log('ESCAPED  '+name);
}
console.log(`\n${caught}/${total} recorder mutations caught`);
process.exit(caught===total?0:1);
