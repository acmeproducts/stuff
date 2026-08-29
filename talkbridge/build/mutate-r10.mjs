#!/usr/bin/env node
/* Fresh mutation gate for the plan v19.5.0 build — every planted defect must fail the harness.
   Usage: node mutate-r10.mjs <ship> <post-ship> <tb-sw.js> <worker-talk.js> */
import { readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
const [shipP, builtP, swP, relayP] = process.argv.slice(2);
const built = readFileSync(builtP, 'utf8'), sw = readFileSync(swP, 'utf8');
const app = [
 ['the gate never renders — a browser tab runs the app',
  s => s.replace("if (p2IsStandalone()) { p2Log('standalone', {}, 'ok'); return boot(); }\n  p2ShowGate();", "return boot();")],
 ['the gate shows but the app still boots beneath it (relay activity in a tab)',
  s => s.replace("  p2ShowGate();\n}", "  p2ShowGate(); boot();\n}")],
 ['a name field leaks into the gate (browser-side name entry returns)',
  s => s.replace("'<div class=\"p2-lead\">", "'<input id=\"p2-name\"><div class=\"p2-lead\">")],
 ['the gate loses the room name',
  s => s.replace("(roomName ? '<div class=\"p2-room\">' + esc(roomName) + '</div>' : '')", "''")],
 ['the open-time subscription attempt never runs',
  s => s.replace("if (p3LiveRooms().length) p3Attempt(false);", ";")],
 ['the worker is never registered',
  s => s.replace("return navigator.serviceWorker.register('./tb-sw.js')", "return Promise.resolve({ pushManager: { getSubscription: function(){ return Promise.resolve(null); }, subscribe: function(){ return Promise.resolve({ endpoint: 'x', toJSON: function(){ return {}; } }); } } })")],
 ['the permission answer regains veto over subscribe',
  s => s.replace("return answer.then(function () { return reg.pushManager.getSubscription(); })", "return answer.then(function (a) { if (a === 'denied') throw new Error('denied'); return reg.pushManager.getSubscription(); })")],
 ['NotAllowedError loses its classification (no device recipe)',
  s => s.replace("if (name === 'NotAllowedError') {", "if (false) {")],
 ['a gesture-less refusal shows the recipe (fresh phones told they are broken)',
  s => s.replace("      if (inGesture) p3ShowRecipe();\n      else p3ArmGesture();", "      p3ShowRecipe();")],
 ['permission is asked after the awaits, not synchronously in the tap',
  s => s.replace("var asked; try { asked = Promise.resolve(Notification.requestPermission()); } catch (e0) { asked = Promise.reject(e0); }", "var asked = Promise.resolve().then(function(){ return Notification.requestPermission(); });").replace("A(w.__askCalls === 1", "A(w.__askCalls === 1")],
 ['only the first room registers with the relay',
  s => s.replace("if (!p3State.sub || !roomId) return Promise.resolve(false);", "if (!p3State.sub || !roomId || roomId !== p3LiveRooms()[0].id) return Promise.resolve(false);")],
  ['a muted room stays subscribed at the relay',
  s => s.replace("var room = roomById(roomId), want = !(room && room.muted);", "var room = roomById(roomId), want = true;")],
    ['the ring screen no longer closes the stale lock-screen notification (the observed double)',
  s => s.replace("try { if (this.ringPending && room && this.ringPending.roomId === room.id) p4PresentedClose(room.id); } catch (_) {}", ";")],
 ['the active room stops closing the banner for what it shows',
  s => s.replace("try { if (d && d.from !== deviceId && p4IsPushWorthy(d) && !document.hidden && S.roomId) p4PresentedClose(S.roomId); }", ";")],
 ['the delayed second close vanishes (late banners survive)',
  s => s.replace("setTimeout(function () { p4CloseTag(roomId); }, 2500);", ";")],
 ['a hidden app raises a surface beside the push',
  s => s.replace("if (document.hidden) return;                                                        /* hidden: the push is the alert (ALWAYS-PUSH) */", ";")],
 ['a notification stacks beside the ring screen',
  s => s.replace("if (CALL.ringPending && CALL.ringPending.roomId === roomId) return;                 /* the ring screen IS the alert */", ";")],
 ['notifications lose their per-room tag (stack, never replace)',
  s => s.replace("tag: 'tb-' + roomId, renotify: true, data: { roomId: roomId, url: location.href.split('#')[0] }", "tag: 'tb-' + roomId + '-' + Date.now(), renotify: true, data: { roomId: roomId }")],
 ['opening a room leaves its stale notifications up',
  s => s.replace("try { p4CloseTag(id); } catch (_) {}", ";")],
 ['answering a call leaves its notification up',
  s => s.replace("try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}", ";")],
 ['the receipt drain goes silent',
  s => s.replace("p4Log('sw_drained', { n: rows.length }, 'ok');", ";")],
 ['the + control vanishes from room cards',
  s => s.replace("if (h && r && !r.sendLocked) h = h.replace('</div><div class=\"rc2-flags\">',", "if (false) h = h.replace('</div><div class=\"rc2-flags\">',")],
 ['tapping + opens the room instead of naming a thread',
  s => s.replace("el.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); p6AskName(el.dataset.thread); });", "el.addEventListener('click', function (ev) { p6AskName(el.dataset.thread); });")],
 ['the invite never leaves for the relay',
  s => s.replace("var sent = (S.roomId === parentId) ? relaySend(p6InviteMsg(parent, { id: t.id, name: name })) : LISTEN.send(parentId, p6InviteMsg(parent, { id: t.id, name: name }));", "var sent = false;")],
 ['a pending invite is not re-sent when the partner reappears',
  s => s.replace("    if (o.status !== 'pending') return;\n    var ok =", "    if (o.status !== 'never') return;\n    var ok =")],
 ['the thread appears for Alice WITHOUT consent (invite auto-accepts)',
  s => s.replace("  parent.threadInvites.push({ id: d.threadId,", "  S.rooms.push(p6ThreadRoom(parent, d.threadId, d.name)); parent.threadInvites.push({ id: d.threadId,")],
 ['duplicate invites stack as duplicate cards',
  s => s.replace("if (parent.threadInvites.some(function (i) { return i.id === d.threadId; })) return false;", ";")],
 ['the decision is no longer stamped into the parent transcript',
  s => s.replace("  p6Stamp(parentId, me + (accepted ? ' accepted ' : ' declined ')", "  (function(){})(parentId, me + (accepted ? ' accepted ' : ' declined ')")],
 ['a decline creates the room anyway',
  s => s.replace("if (accepted) { S.rooms.push(p6ThreadRoom(parent, threadId, inv.name)); }", "S.rooms.push(p6ThreadRoom(parent, threadId, inv.name));")],
 ['the partner\'s answer never closes the offer (invites re-sent forever)',
  s => s.replace("else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(roomId, d);", ";")],
 ['a declined invite re-surfaces when re-sent',
  s => s.replace("if ((parent.threadsAnswered || []).indexOf(d.threadId) >= 0) return false;", ";")],
 ['ship interior altered (P5 broken)',
  s => s.replace("function boot(){", "function boot(){ /* mutated */")],
];
const worker = [
 ['a visible app on Android is shouted over (skip-when-visible removed)',
  s => s.replace("if (vc && !isIOS()) {", "if (false) {")],
 ['a visible app on iOS gets a silent handler (Apple revokes)',
  s => s.replace("return /iPhone|iPad|iPod/.test(self.navigator.userAgent)", "return false && /iPhone|iPad|iPod/.test(self.navigator.userAgent)")],
 ['the worker goes silent on a push (Apple revokes the subscription)',
  s => s.replace("return self.registration.showNotification(title, { body: body, tag: tag, renotify: true, data: { roomId: roomId, url: appUrl, kind: kind, tbfrTraceId:traceId } })", "return Promise.resolve()")],
 ['the worker stops journaling shown',
  s => s.replace(".then(function () { frRecord('notification','show_result','accepted',{traceKey:traceKey,eventType:kind,detail:{accepted:true}}); return journal('shown', { room: roomId, kind: kind }); },", ".then(function () { return Promise.resolve(); },")],
 ['a tap opens a second copy instead of focusing the app',
  s => s.replace("if (app) { try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null, tbfrTraceId:tapTrace }); } catch (_) {} var p=app.focus ? app.focus() : null; frRecord('notification_tap','focus_request','accepted',{traceId:tapTrace,detail:{target:data.roomId?'event_room':'home'}}); return p; }", ";")],
 ['the room tag collapses to one global tag',
  s => s.replace("var tag = 'tb-' + (roomId || 'unknown');", "var tag = 'tb-all';")],
];
let caught = 0, total = 0;
function run(name, appText, swText) {
  writeFileSync('/tmp/mut-app.html', appText); writeFileSync('/tmp/mut-sw.js', swText);
  const r = spawnSync('node', [new URL('./harness-r10.mjs', import.meta.url).pathname, shipP, '/tmp/mut-app.html', '/tmp/mut-sw.js', relayP], { encoding: 'utf8' });
  total++;
  if (r.status !== 0) { caught++; console.log('  caught  ' + name); }
  else console.log('ESCAPED  ' + name);
}
const ONLY = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null;
const WORKER_ONLY = process.env.WORKER_ONLY === '1', RELAY_ONLY = process.env.RELAY_ONLY === '1';
const WORKER_INDEX = process.env.WORKER_INDEX === undefined ? null : Number(process.env.WORKER_INDEX);
const RELAY_INDEX = process.env.RELAY_INDEX === undefined ? null : Number(process.env.RELAY_INDEX);
for (const [i, [name, fn]] of app.entries()) { if (WORKER_ONLY || RELAY_ONLY || (ONLY && !ONLY.includes(i))) continue; const m = fn(built); if (m === built) { console.log('NO-OP    ' + name + ' (mutation did not apply)'); total++; continue; } run(name, m, sw); }
for (const [i, [name, fn]] of worker.entries()) { if (ONLY || RELAY_ONLY || (WORKER_INDEX !== null && i !== WORKER_INDEX)) continue; const m = fn(sw); if (m === sw) { console.log('NO-OP    ' + name + ' (mutation did not apply)'); total++; continue; } run(name, built, m); }
const relayMuts = [
 ['the presence guess returns (connected devices skipped)',
  s => s.replace("      jobs.push(this._pushOne(clientId, rec, msg));", "      if (!this._connectedIds().has(clientId)) jobs.push(this._pushOne(clientId, rec, msg));")],
 ['a wake timer returns (the 1s race)',
  s => s.replace("      jobs.push(this._pushOne(clientId, rec, msg));", "      setTimeout(() => this._pushOne(clientId, rec, msg), 1000);")],
 ['the sender starts waking itself',
  s => s.replace("if (clientId === senderId) { frRecord(this.sessionId || msg.session, clientId, msg, 'wake_decision', 'recipient', 'sender_skipped', { worthy:true, attempted:false }); continue; }", ";")],
 ['non-worthy types start waking phones',
  s => s.replace("if (!PUSH_WORTHY.has(msg.type)) { frRecord(this.sessionId || msg.session, senderId, msg, 'wake_decision', 'event_class', 'not_worthy', { worthy:false }, true); return; }", ";")],
];
const relaySrc = readFileSync(relayP, 'utf8');
for (const [i, [name, fn]] of relayMuts.entries()) {
  if (ONLY || WORKER_ONLY || (RELAY_INDEX !== null && i !== RELAY_INDEX)) continue;
  const m = fn(relaySrc); total++;
  if (m === relaySrc) { console.log('NO-OP    ' + name); continue; }
  writeFileSync('/tmp/mut-relay.js', m);
  const r = spawnSync('node', [new URL('./harness-relay-v42.mjs', import.meta.url).pathname, '/tmp/mut-relay.js'], { encoding: 'utf8' });
  if (r.status !== 0) { caught++; console.log('  caught  ' + name); } else console.log('ESCAPED  ' + name);
}
console.log(`\n${caught}/${total} mutations caught`);
process.exit(caught === total ? 0 : 1);
