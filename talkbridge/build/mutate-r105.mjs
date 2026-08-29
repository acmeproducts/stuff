#!/usr/bin/env node
/* R10.5 plant-and-catch gate. Each defect must make its owning harness red. */
import {readFileSync,writeFileSync,mkdtempSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import {spawn} from 'child_process';

const [shipP,builtP,swP,relayP,partP,workflowP]=process.argv.slice(2);
const base={ship:readFileSync(shipP,'utf8'),built:readFileSync(builtP,'utf8'),sw:readFileSync(swP,'utf8'),relay:readFileSync(relayP,'utf8'),part:readFileSync(partP,'utf8'),workflow:readFileSync(workflowP,'utf8')};
const app=[
  ['permission answer regains veto authority',s=>s.replace("return answer.then(function () { return reg.pushManager.getSubscription(); })","return answer.then(function (a) { if (a === 'denied') throw new Error('denied'); return reg.pushManager.getSubscription(); })")],
  ['hidden page may claim foreground ownership',s=>s.replace("return !document.hidden && focus;","return true;")],
  ['OS-owned call is allowed to auto-ring late',s=>s.replace("if (msg.type === 'call-start' && owner !== 'in_app') return true;","if (false) return true;")],
  ['active notification tap no longer mounts call screen',s=>s.replace("e.state === 'started'","e.state === 'never-started'")],
  ['muted room is hidden from the home record',s=>s.replace("return S.rooms.filter(function (room) {\n      if (room.deletedAt) return false;","return S.rooms.filter(function (room) {\n      if (room.deletedAt || room.muted) return false;")],
  ['page OS notification helper is re-enabled',s=>s.replace("osNotify = function () { p4Log('page_notification_blocked', {}, 'ok'); return false; };","osNotify = _p4OsNotify;")]
];
const worker=[
  ['worker event dedupe is bypassed',s=>s.replace("if (dup) { frRecord('notification','deduped'","if (false) { frRecord('notification','deduped'")],
  ['worker tap drops the event URL',s=>s.replace("openWindow(data.url || self.registration.scope)","openWindow(self.registration.scope)")],
  ['worker notifications collapse to one global tag',s=>s.replace("var tag = note.tag || ('tb-' + (tb.roomId || 'unknown'));","var tag = 'tb-all';")]
];
const relay=[
  ['presentation owner is not durable',s=>s.replace("await this.state.storage.put({ presentation: this.presentation });","await Promise.resolve();")],
  ['late foreground response reverses the committed owner',s=>s.replace("this._commitOwner(clientId, msg.presentationMeta || { eventId: msg.eventId }, prior.owner, prior.reason, false);","delete this.presentation[key]; this._commitOwner(clientId, msg.presentationMeta || { eventId: msg.eventId }, 'in_app', 'late-bug', false);")],
  ['mute no longer suppresses presentation',s=>s.replace("if (this.mute[clientId]) { this._commitOwner","if (false) { this._commitOwner")],
  ['chat burst no longer suppresses later alerts',s=>s.replace("if (!eligible) { this._commitOwner","if (false) { this._commitOwner")],
  ['terminal call no longer cancels its pending alert',s=>s.replace("await this._resolveTerminalCall(callId, rec.state);",";")],
  ['event retry is persisted again',s=>s.replace("if (duplicateEvent) return;","if (false) return;")],
  ['global wake topic returns',s=>s.replace("const topic = meta.type === 'call-start' ? topicSafe('c' + (meta.callId || meta.eventId)) : topicSafe('m' + this.sessionName);","const topic = 'tb-wake';")],
  ['cursor can regress',s=>s.replace("Math.max(Number(this.cursors[clientId]) || 0, l)","l")],
  ['ledger resets with short chat history',s=>s.replace("this.messages = [];\n      await this.state.storage.put({ seq: 0, messages: [], lastActivity: now });","this.messages = []; this.ledger = []; this.lseq = 0;\n      await this.state.storage.put({ seq: 0, messages: [], lastActivity: now });")],
  ['missed call is misclassified as canceled',s=>s.replace("? 'timed_out' : 'canceled'","? 'canceled' : 'canceled'")],
  ['event URL loses its exact event identifier',s=>s.replace("u.searchParams.set('tbEvent', meta.eventId);",";")],
  ['payload leaks a content-shaped field',s=>s.replace("tb: { v: 2,","tb: { srcText: 'leak', v: 2,")],
  ['recorder salt is generated at module scope',s=>s.replace('let FR_SALT = null;', 'let FR_SALT = crypto.randomUUID();')],
  ['connected socket becomes a presence suppression heuristic',s=>s.replace("for (const clientId of recipients) {\n      const rec", "for (const clientId of recipients) {\n      if (this._connectedIds().has(clientId)) continue;\n      const rec")],
  ['push can run before the owner is committed',s=>s.replace("const rec = this.presentation[key] = { owner, reason, state: meta.state || null, at: Date.now() };","const rec = { owner, reason, state: meta.state || null, at: Date.now() };")]
];
const deploy=[
  ['deployment accepts the rollback manifest',s=>s.replace("d.v!=='5.1'", "d.v!=='4.2'")],
  ['deployment stops requiring foreground ownership',s=>s.replace("grep -qx 'foreground-owner=ok' /tmp/ws-check.txt", ": # foreground owner unchecked")],
  ['deployment stops requiring the live recorder',s=>s.replace("grep -qx 'recorder=ok' /tmp/ws-check.txt", ": # recorder unchecked")]
];
const recorder=[
  ['app recorder build identity diverges','app',s=>s.replaceAll('R10.5','R10.5-BROKEN')],
  ['worker recorder version diverges','worker',s=>s.replace("FR_VERSION = 'r10.5-sw/1'","FR_VERSION = 'r10.5-sw/broken'")],
  ['relay recorder version diverges','relay',s=>s.replace("FR_VERSION = 'r10.5-relay/1'","FR_VERSION = 'r10.5-relay/broken'")],
  ['device retention becomes unbounded','app',s=>s.replace('MAX_RECORDS = 5000','MAX_RECORDS = 50000')],
  ['message text enters the app detail allow-list','app',s=>s.replace('sourceSeq:1,','sourceSeq:1, srcText:1,')],
  ['diagnostics control becomes normal UI','app',s=>s.replace("if (new URL(location.href).searchParams.get('tbDiagnostics') !== '1') return;","if (false) return;")],
  ['unrelated client can read relay traces','relay',s=>s.replace("const related = this._connectedIds().has(clientId) || !!this.subs[clientId];","const related = true;")]
];

let caught=0,total=0;
const jobs=[];
function enqueue(name,kind,fn){ jobs.push({name,kind,fn}); }
async function run({name,kind,fn}){
  let x={...base};
  if(kind==='app'){x.built=fn(x.built);}
  if(kind==='worker'){x.sw=fn(x.sw);}
  if(kind==='relay'){x.relay=fn(x.relay);}
  if(kind==='deploy'){x.workflow=fn(x.workflow);}
  if(kind==='rec-app'){x.built=fn(x.built);x.part=fn(x.part);}
  if(kind==='rec-worker'){x.sw=fn(x.sw);}
  if(kind==='rec-relay'){x.relay=fn(x.relay);}
  total++;
  if(x.built===base.built&&x.sw===base.sw&&x.relay===base.relay&&x.part===base.part&&x.workflow===base.workflow){console.log('NO-OP    '+name);return;}
  const dir=mkdtempSync(join(tmpdir(),'tbr105-mut-'));
  for(const [k,v] of Object.entries(x))writeFileSync(join(dir,k+(k==='built'?'.html':k==='ship'?'.html':k==='workflow'?'.yml':'.js')),v);
  let args;
  if(kind==='app'||kind==='worker')args=[new URL('./harness-r105.mjs',import.meta.url).pathname,join(dir,'ship.html'),join(dir,'built.html'),join(dir,'sw.js'),join(dir,'relay.js')];
  else if(kind==='relay'||kind==='deploy')args=[new URL('./harness-relay-v51.mjs',import.meta.url).pathname,join(dir,'relay.js'),join(dir,'workflow.yml')];
  else args=[new URL('./harness-flight-recorder-r105.mjs',import.meta.url).pathname,join(dir,'built.html'),join(dir,'sw.js'),join(dir,'relay.js'),join(dir,'part.js')];
  const status=await new Promise(resolve=>{
    const child=spawn(process.execPath,args,{stdio:'ignore',env:{...process.env,FAIL_FAST:'1'}});
    let settled=false;
    const finish=code=>{if(settled)return;settled=true;clearTimeout(timer);resolve(code);};
    const timer=setTimeout(()=>{child.kill('SIGKILL');finish(124);},60000);
    child.on('error',()=>finish(125));child.on('exit',code=>finish(code));
  });
  if(status!==0){caught++;console.log('  caught  '+name);}else console.log('ESCAPED  '+name);
}
for(const [n,f] of app)enqueue(n,'app',f);
for(const [n,f] of worker)enqueue(n,'worker',f);
for(const [n,f] of relay)enqueue(n,'relay',f);
for(const [n,f] of deploy)enqueue(n,'deploy',f);
for(const [n,k,f] of recorder)enqueue(n,'rec-'+k,f);
let next=0;
async function runSlot(){while(next<jobs.length){const i=next++;await run(jobs[i]);}}
await Promise.all(Array.from({length:Math.min(6,jobs.length)},runSlot));
console.log(`\n${caught}/${total} mutations caught`);
process.exit(caught===total?0:1);
