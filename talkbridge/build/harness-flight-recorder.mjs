#!/usr/bin/env node
/* R10.2-OBS1 recorder gate. Static contract plus a live durable-object trace
   query. This gate proves recorder safety/shape; it does not claim OS delivery. */
import { readFileSync } from 'fs';
const [builtP, swP, relayP, partP] = process.argv.slice(2);
const built=readFileSync(builtP,'utf8'), sw=readFileSync(swP,'utf8'), relay=readFileSync(relayP,'utf8'), part=readFileSync(partP,'utf8');
let pass=0,fail=0;
const A=(c,m)=>{if(!c)throw new Error(m);};
const T=async(n,f)=>{try{await f();pass++;console.log('  ok  '+n);}catch(e){fail++;console.log('FAIL  '+n+' — '+(e&&e.message||e));}};

console.log('F · recorder contract');
await T('F1 immutable candidate identity appears in app, worker and relay',()=>{
  for(const [n,s] of [['app',built],['worker',sw],['relay',relay]])A(s.includes('R10.2-OBS1'),n+' build id missing');
  A(built.includes('obs1-app/1')&&sw.includes('obs1-sw/1')&&relay.includes('obs1-relay/1'),'layer versions missing');
});
await T('F2 P7 is assembled exactly once after the protected ship',()=>{
  A((built.match(/R10 PART · P7-flight-recorder/g)||[]).length===1,'P7 count');
  A(built.indexOf('R10 PART · P7-flight-recorder')>built.indexOf('R10 PART · P6-threads'),'P7 order');
});
await T('F3 canonical record has nullable IDs, clocks, versions, subject, state, detail, redactions and error',()=>{
  for(const k of ['schemaVersion','recordId','testRunId','traceId','eventId','callId','eventKind','action','outcome','time','versions','subject','state','detail','redactions','error'])A(part.includes(k),'missing '+k);
  A(part.includes("action:event+'_'+phase"),'canonical action assignment missing');
});
await T('F4 state provenance does not pretend the app can observe a lock',()=>{
  A(part.includes("provenance: 'test_supplied'")&&part.includes("testConditionProvenance:run?'test_supplied':'unknown'"),'condition provenance missing');
  A(!/locked[^\n]{0,100}provenance:\s*['"]observed/.test(part),'locked labeled observed');
});
await T('F5 test setup is enumerated and contains no free-text run note',()=>{
  A(part.includes('tbfr-condition')&&part.includes('tbfr-scenario')&&part.includes('tbfr-receiver'),'selectors missing');
  const panel=part.slice(part.indexOf("modal.innerHTML="),part.indexOf("document.body.appendChild(modal)"));
  A(!/<input|textarea/i.test(panel),'free-text test input present');
});
await T('F6 diagnostics is reachable from home and room without replacing either surface',()=>{
  A(part.includes("querySelector('#scr-s1 .ribbon')")&&part.includes("getElementById('room-ribbon')"),'two entry points missing');
  A(part.includes("appendChild(button('tbfr-open'))")&&part.includes("appendChild(button('tbfr-room'))"),'controls not additive');
});
await T('F7 device storage is shared by app/worker, durable, bounded and pruned in batches ≤100',()=>{
  for(const s of [part,sw]){A(s.includes("tb-flight-recorder"),'db missing');for(const st of ['records','runs','meta'])A(s.includes("'"+st+"'"),'store '+st+' missing');A(/\b5000\b/.test(s)&&(s.includes('7 * 86400000')||s.includes('7*86400000')),'retention missing');A(s.includes('slice(0, 100)')||s.includes('slice(0,100)'),'prune batch missing');}
  A(/memory\.length\s*>\s*200(?!0)/.test(part),'memory bound missing');
});
await T('F8 room/device identifiers are salted; cross-layer trace is one-way and stable',()=>{
  A(part.includes("salt() + '|'")&&part.includes("'tbfr-tr|'"),'app hash domains wrong');
  A(sw.includes("'tbfr-tr|'")&&relay.includes("'tbfr-tr|'")&&relay.includes('FR_SALT'),'cross-layer hash or relay salt missing');
  A(!part.includes('roomId: roomId, deviceId:'),'raw identifiers serialized');
});
await T('F9 detail is allow-listed instead of opportunistically serialized',()=>{
  A(part.includes('if (!allowed[k]) return')&&relay.includes('if (!allow.has(k)) continue'),'allow-list missing');
  for(const forbidden of ['srcText:1','tgtText:1','endpoint:1','token:1','name:1','url:1'])A(!part.includes(forbidden),'forbidden detail allow '+forbidden);
});
await T('F10 JSONL and human report consume the same run snapshot',()=>{
  A(part.includes('function exportBoth()')&&part.includes("fetchRelay().then(recordsForRun)")&&part.includes("canonical(rows)")&&part.includes("human(rows)")&&part.includes('tbfr-both'),'export snapshot parity missing');
});
await T('F11 mixed worker/relay versions visibly invalidate the run',()=>{
  A(part.includes('VERSION MISMATCH · INVALID RUN')&&part.includes("v.sw !== 'obs1-sw/1'")&&part.includes("v.relay !== 'obs1-relay/1'"),'version block missing');
});
await T('F12 worker records push, classification, notification result and tap/open/focus',()=>{
  for(const token of ["frRecord('push','arrival'","frRecord('push','classified'","frRecord('notification','show_request'","frRecord('notification','show_result'","frRecord('notification_tap','received'","'focus_request'","'open_window_result'"])A(sw.includes(token),token+' missing');
});
await T('F13 notification behavior fields remain the R10.2 fields',()=>{
  for(const token of ["var tag = 'tb-' + (roomId || 'unknown')","renotify: true","title = 'TalkBridge'","journal('shown'","journal('failed'"])A(sw.includes(token),token+' changed');
});
await T('F14 cold-open navigation reconciles from the worker record without changing the target URL',()=>{
  A(part.includes('function reconcileRecentColdOpen(')&&part.includes("phase==='open_window_result'"),'cold reconciliation missing');
  A(sw.includes("openWindow(data.url || self.registration.scope)"),'product target changed');
});
await T('F15 relay ring is 2,000/24h and trace query is bounded to 500',()=>{
  A(/FR_MAX\s*=\s*2000\b/.test(relay)&&relay.includes('FR_AGE_MS = 24 * 60 * 60 * 1000'),'relay retention');
  A(relay.includes('Math.min(500,')&&relay.includes("body.type === 'diag-trace'"),'query bound');
});
await T('F16 relay instruments receive, socket delivery, recipient decision, push request/response and subscription',()=>{
  for(const token of ["'relay_receive'","'socket_delivery'","'wake_decision'","'push_attempt'","'push_service'","'subscription'"])A(relay.includes(token),token+' missing');
});
await T('F17 recorder wrappers call the product first and return its result',()=>{
  for(const token of ["var ok = _send.apply(this, arguments); record","var r=_handle.apply(this,arguments); record","var r=_listenHandle.apply(this,arguments); record","var r=_notify.apply(this,arguments); record"])A(part.includes(token),token+' call-through missing');
});

console.log('R · live relay trace query');
function mkSession(){
  const pre=relay.slice(0,relay.indexOf('export default'));
  const S=new Function(pre+relay.slice(relay.indexOf('export class TalkSession')).replace('export class','return class'))();
  const storage={data:new Map(),get:async k=>{const m=new Map();(Array.isArray(k)?k:[k]).forEach(x=>m.set(x,storage.data.get(x)));return Array.isArray(k)?m:storage.data.get(k);},put:async o=>{for(const [k,v] of Object.entries(o))storage.data.set(k,v);}};
  const sockets=[];const state={storage,blockConcurrencyWhile:f=>f(),getWebSockets:()=>sockets,acceptWebSocket(){}};
  return {s:new S(state,{}),sockets,storage};
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
{
  const {s,sockets}=mkSession();await s.ready;s.sessionId='room-a';
  s.subs.receiver={sub:{endpoint:'https://push.invalid/SECRET_ENDPOINT',keys:{p256dh:'p',auth:'a'}},at:Date.now()};
  s._pushOne=async()=>{};
  const receiver={deserializeAttachment:()=>({clientId:'receiver'}),send(){}};
  const sender={deserializeAttachment:()=>({clientId:'sender'}),send(){}};sockets.push(receiver,sender);
  await s.webSocketMessage(sender,JSON.stringify({type:'chat-msg',session:'room-a',chatId:'event-1',srcText:'TOP_SECRET_CANARY',senderName:'PRIVATE_NAME'}));
  await delay(30);
  const before={seq:s.seq,messages:JSON.stringify(s.messages),subs:Object.keys(s.subs).join(',')};
  const req=id=>new Request('https://relay.invalid/signal?app=x&session=room-a&client='+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'diag-trace',since:0,limit:9999})});
  const denied=await s.fetch(req('stranger'));
  await T('R1 unrelated client cannot read a room trace',()=>A(denied.status===403,'status='+denied.status));
  const res=await s.fetch(req('receiver')),body=await res.json(),serialized=JSON.stringify(body);
  await T('R2 related client receives a versioned, bounded, redacted slice',()=>{
    A(res.status===200&&body.version==='obs1-relay/1'&&body.schemaVersion==='tbfr/1.0','manifest wrong');
    A(Array.isArray(body.records)&&body.records.length>0&&body.records.length<=500,'record bound');
    for(const bad of ['TOP_SECRET_CANARY','PRIVATE_NAME','SECRET_ENDPOINT','_roomKey','_clientKey'])A(!serialized.includes(bad),'leaked '+bad);
  });
  await T('R3 trace query is read-only for history, sequence and subscriptions',()=>{
    A(s.seq===before.seq&&JSON.stringify(s.messages)===before.messages&&Object.keys(s.subs).join(',')===before.subs,'product state changed');
  });
  await T('R4 receiver slice contains the room-shared receive stage and receiver delivery stage',()=>{
    A(body.records.some(r=>r.event==='relay_receive'),'receive missing');A(body.records.some(r=>r.event==='socket_delivery'),'delivery missing');
  });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
