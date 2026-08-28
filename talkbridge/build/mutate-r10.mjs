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
  s => s.replace("var asked; try { asked = Promise.resolve(Notification.requestPermission()); } catch (e0) { asked = Promise.reject(e0); }", "var asked = Promise.resolve().then(function(){ return Notification.requestPermission(); });")],
 ['only the first room registers with the relay',
  s => s.replace("if (!p3State.sub || !roomId) return Promise.resolve(false);", "if (!p3State.sub || !roomId || roomId !== p3LiveRooms()[0].id) return Promise.resolve(false);")],
 ['the subscription loses its navigate target (declarative tap-through dies)',
  s => s.replace(", navigate: location.href.split('#')[0] }", " }")],
 ['the mute UI claims muted before the relay acknowledges (review §4.3 inverted)',
  s => s.replace("    p3MutePost(r.id, want).then(function () {\n      r.muted = want; saveRooms();", "    r.muted = want; saveRooms();\n    p3MutePost(r.id, want).then(function () {")],
 ['a hidden app starts acknowledging presentation (locked phones fall silent)',
  s => s.replace("  if (!eventId || document.hidden) return false;", "  if (!eventId) return false;")],
 ['presented loses its exact event (an empty ack for everything)',
  s => s.replace("var m = { type: 'presented', eventId: eventId, transient: true };", "var m = { type: 'presented', transient: true };")],
 ['call words lose their stable identity',
  s => s.replace("if (m.type === 'call-start') { m.callId = m.callId || p4State.callId || ('cl-' + uid()); p4State.callId = m.callId; m.eventId = m.callId + ':start'; }", ";")],
 ['live events are no longer marked counted (socket + ledger double-count)',
  s => s.replace("function p4MarkCounted(roomId, eventId) {\n  if (!eventId) return;", "function p4MarkCounted(roomId, eventId) {\n  return;\n  if (!eventId) return;")],
 ['the ledger stops typing missed calls (video counted as nothing)',
  s => s.replace("if (e.type === 'call-start' && e.state === 'timed_out') { var k = e.kind === 'video' ? 'video' : 'voice'; bumpWaiting(room, k); bumped[k]++; }", ";")],
 ['the ledger sync stops advancing the cursor (counts replay forever)',
  s => s.replace("    return p4AdvanceCursor(room.id, maxL);", "    return Promise.resolve();")],
 ['worker receipts start feeding the counters (review §7.3 forbidden)',
  s => s.replace("    rows.forEach(function (en) { p4Log('sw_receipt',", "    rows.forEach(function (en) { try { var rr = roomById(en.room); if (rr) bumpWaiting(rr, 'chat'); } catch (_) {} p4Log('sw_receipt',")],
 ['opening a room leaves its stale notifications up',
  s => s.replace("      p4CloseTag(id);", ";")],
 ['answering a call leaves its notification up',
  s => s.replace("    try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}", ";")],
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
 ['the worker goes silent on a push',
  s => s.replace("return self.registration.showNotification(title, { body: body, tag: tag, renotify: false, data: data })", "return Promise.resolve()")],
 ['eventId dedupe dies (every replayed push displays again)',
  s => s.replace("    if (list.indexOf(eventId) >= 0) return true;", "    if (false) return true;")],
 ['the envelope is ignored (bare generic banner, no tap-through room)',
  s => s.replace("var tb = (env && env.tb) || {};", "var tb = {};")],
 ['the worker stops journaling shown',
  s => s.replace(".then(function () { return journal('shown', { eventId: tb.eventId, room: tb.roomId, kind: tb.type }); },", ".then(function () { return Promise.resolve(); },")],
 ['a tap opens a second copy instead of focusing the app',
  s => s.replace("      if (app) { try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null }); } catch (_) {} return app.focus ? app.focus() : null; }", ";")],
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
for (const [i, [name, fn]] of app.entries()) { if (ONLY && !ONLY.includes(i)) continue; const m = fn(built); if (m === built) { console.log('NO-OP    ' + name + ' (mutation did not apply)'); total++; continue; } run(name, m, sw); }
for (const [name, fn] of worker) { if (ONLY) continue; const m = fn(sw); if (m === sw) { console.log('NO-OP    ' + name + ' (mutation did not apply)'); total++; continue; } run(name, built, m); }
const relayMuts = [
 ['ANY inbound word cancels every pending push (presence inference returns)',
  s => s.replace("    if (msg.type === 'presented' && msg.eventId && clientId) {\n      const key = clientId + '|' + msg.eventId;\n      const t = this.pendingPush.get(key);\n      if (t) { clearTimeout(t); this.pendingPush.delete(key);", "    if (clientId) {\n      for (const k of [...this.pendingPush.keys()]) if (k.startsWith(clientId + '|')) { clearTimeout(this.pendingPush.get(k)); this.pendingPush.delete(k); }\n      const t = null;\n      if (t) {")],
 ['the burst rule vanishes (a push per chat, the forbidden flurry)',
  s => s.replace("        if (!eligible) { this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'burst-suppressed', status: -1, at: now }); continue; }", ";")],
 ['mute is ignored at the relay (muted phones ding)',
  s => s.replace("      if (this.mute[clientId]) { this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'muted', status: -1, at: now }); continue; }", ";")],
 ['a terminal call state stops cancelling the stale ring',
  s => s.replace("      if (rec.state !== 'started') {\n        for (const key of [...this.pendingPush.keys()]) {", "      if (false) {\n        for (const key of [...this.pendingPush.keys()]) {")],
 ['the ledger stops deduplicating retries (double counts)',
  s => s.replace("      const dup = this.ledger.some((e) => e.eventId === msg.eventId && e.type === msg.type);", "      const dup = false;")],
 ['the cursor loses monotonicity (consumed events resurrect)',
  s => s.replace("        this.cursors[clientId] = Math.max(Number(this.cursors[clientId]) || 0, l);", "        this.cursors[clientId] = l;")],
 ['the session reset takes the ledger with it (counts die at 12 minutes)',
  s => s.replace("      this.seq = 0;\n      this.messages = [];\n      await this.state.storage.put({ seq: 0, messages: [], lastActivity: now });", "      this.seq = 0;\n      this.messages = [];\n      this.ledger = []; this.lseq = 0;\n      await this.state.storage.put({ seq: 0, messages: [], lastActivity: now, ledger: [], lseq: 0 });")],
 ['the sender starts waking itself',
  s => s.replace("      if (clientId === senderId) continue;", ";")],
 ['the global wake topic returns',
  s => s.replace("const topic = meta.type === 'call-start' ? topicSafe('c' + (meta.callId || meta.eventId)) : topicSafe('m' + this.sessionName);", "const topic = 'tb-wake';")],
 ['history-sync becomes an alert (history-guessing wake returns)',
  s => s.replace("const ALERT_TYPES = new Set(['chat-msg', 'sys-pill', 'call-start', 'thread-invite']);", "const ALERT_TYPES = new Set(['chat-msg', 'sys-pill', 'call-start', 'thread-invite', 'history-sync']);")],
];
const relaySrc = readFileSync(relayP, 'utf8');
for (const [name, fn] of relayMuts) {
  if (ONLY) continue;
  const m = fn(relaySrc); total++;
  if (m === relaySrc) { console.log('NO-OP    ' + name); continue; }
  writeFileSync('/tmp/mut-relay.js', m);
  const r = spawnSync('node', [new URL('./harness-relay-v5.mjs', import.meta.url).pathname, '/tmp/mut-relay.js'], { encoding: 'utf8' });
  if (r.status !== 0) { caught++; console.log('  caught  ' + name); } else console.log('ESCAPED  ' + name);
}
console.log(`\n${caught}/${total} mutations caught`);
process.exit(caught === total ? 0 : 1);
