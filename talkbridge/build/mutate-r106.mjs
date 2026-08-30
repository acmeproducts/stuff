#!/usr/bin/env node
/* Plant independent defects; every one must make an owning R10.6 gate red. */
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';
const [shipP, builtP, swP, relayP] = process.argv.slice(2);
const base = { ship: readFileSync(shipP, 'utf8'), built: readFileSync(builtP, 'utf8'), sw: readFileSync(swP, 'utf8'), relay: readFileSync(relayP, 'utf8') };
const defects = [
  ['relay', 'bare caller hang-up no longer means recipient missed', s => s.replace("msg.type === 'call-end' && clientId === call.senderId", "msg.type === 'call-end' && clientId !== call.senderId")],
  ['relay', 'mute no longer suppresses attention', s => s.replace("if (sub.muted === true) return this._commit", "if (false) return this._commit")],
  ['relay', 'chat burst no longer suppresses later messages', s => s.replace("if (Date.now() - last < CHAT_BURST_MS) return", "if (false) return")],
  ['relay', 'accepted call is typed missed', s => s.replace("msg.type === 'call-accept' ? 'accepted' : 'declined'", "msg.type === 'call-accept' ? 'missed' : 'declined'")],
  ['relay', 'declined call is typed missed', s => s.replace("msg.type === 'call-accept' ? 'accepted' : 'declined'", "msg.type === 'call-accept' ? 'accepted' : 'missed'")],
  ['relay', 'surface render can no longer mark seen', s => s.replace("rec.seen = true; rec.seenAt", "rec.seen = false; rec.seenAt")],
  ['relay', 'recipient ledger is not persisted', s => s.replace("recipientEvents: this.recipientEvents, lseq: this.lseq", "recipientEvents: {}, lseq: this.lseq")],
  ['relay', 'one-time invitation can be replayed', s => s.replace("!invite || invite.usedAt || invite.expiresAt <= now", "!invite || invite.expiresAt <= now")],
  ['relay', 'authorization loses device binding', s => s.replace("deviceId: rec.deviceId, rooms", "deviceId: 'wrong-device', rooms")],
  ['relay', 'global push topic returns', s => s.replace("Topic: topicSafe(rec.eventId)", "Topic: 'tb-wake'")],
  ['relay', 'late exact readiness can reverse the durable owner', s => s
    .replace("if (rec.presentation !== 'pending') {", "if (false) {")
    .replace("if (rec.presentation === 'pending' && this.pendingPresentation[this._presentationKey(clientId, msg.eventId)])", "if (rec)")],
  ['relay', 'stable retry guard is removed', s => s.replace('if (duplicate) return;', 'if (false && duplicate) return;')],
  ['relay', 'service accepts an authorization stolen from another device', s => s.replace('data.record.deviceId !== deviceId', 'false')],
  ['app', 'QR metadata regains a Deepgram key', s => s.replace("r: room.id, ld:", "k: localStorage.getItem('tb_dg_key'), r: room.id, ld:")],
  ['app', 'legacy Deepgram secret is retained', s => s.replace("localStorage.removeItem(keys[i]);", "if (keys[i] !== 'tb_dg_key') localStorage.removeItem(keys[i]);")],
  ['app', 'provider service request drops opaque authorization', s => s.replace("headers['X-TalkBridge-Auth'] = auth.token", "headers['X-TalkBridge-Auth'] = ''")],
  ['app', 'provider service request drops device binding', s => s.replace("headers['X-TalkBridge-Device'] = deviceId", "headers['X-TalkBridge-Device'] = ''")],
  ['app', 'temporary TURN is falsely reported missing', s => s.replace("ev === 'turn_unavailable'", "ev === 'turn_never_matches'")],
  ['app', 'push subscription self-heal loses single-flight ownership', s => s.replace('if (r106Push.pending) return r106Push.pending;', 'if (false) return r106Push.pending;')],
  ['app', 'OS-owned call may mount a page ring', s => s.replace("else if (ev.type === 'call-start' && attention)", "else if (ev.type === 'call-start')")],
  ['app', 'in-app call grant no longer mounts the call surface', s => s.replace("else if (ev.type === 'call-start' && attention) r106ApplyMessage", "else if (false) r106ApplyMessage")],
  ['app', 'browser install gate boots the product behind it', s => s.replace("if (!r106Standalone()) { r106InstallGate(); return; }", "if (!r106Standalone()) { r106InstallGate(); boot(); return; }")],
  ['worker', 'worker stable-ID dedupe is bypassed', s => s.replace("return r106Journal('push_arrived', tb, { payload: !!env }).then(function () { return r106SeenBefore(tb.eventId); })", "return r106Journal('push_arrived', tb, { payload: !!env }).then(function () { return Promise.resolve(false); })")],
  ['worker', 'cold notification tap drops the event URL', s => s.replace("self.clients.openWindow(data.url || self.registration.scope)", "self.clients.openWindow(self.registration.scope)")],
  ['worker', 'warm notification tap drops the event identifier', s => s.replace("eventId: data.eventId, roomId: data.roomId", "eventId: null, roomId: data.roomId")],
  ['worker', 'history-guessing machinery returns', s => s + "\nfunction resolveRoom(){ return fetch('?since=0'); }\n"]
];

async function run(defect) {
  const [kind, name, mutate] = defect, files = { ...base }; files[kind === 'worker' ? 'sw' : kind === 'relay' ? 'relay' : 'built'] = mutate(files[kind === 'worker' ? 'sw' : kind === 'relay' ? 'relay' : 'built']);
  const changed = files.built !== base.built || files.sw !== base.sw || files.relay !== base.relay;
  if (!changed) return { name, caught: false, note: 'NO-OP' };
  const dir = mkdtempSync(join(tmpdir(), 'tbr106-mut-'));
  for (const [key, value] of Object.entries(files)) writeFileSync(join(dir, key + (key === 'ship' || key === 'built' ? '.html' : '.js')), value);
  const script = kind === 'relay' ? new URL('./harness-relay-r106.mjs', import.meta.url).pathname : new URL('./harness-r106.mjs', import.meta.url).pathname;
  const args = kind === 'relay' ? [script, join(dir, 'relay.js')] : [script, join(dir, 'ship.html'), join(dir, 'built.html'), join(dir, 'sw.js'), join(dir, 'relay.js')];
  const status = await new Promise(resolve => {
    const child = spawn(process.execPath, args, { stdio: 'ignore' }); let done = false;
    const finish = code => { if (done) return; done = true; clearTimeout(timer); resolve(code); };
    const timer = setTimeout(() => { child.kill('SIGKILL'); finish(124); }, 45000);
    child.on('error', () => finish(125)); child.on('exit', finish);
  });
  return { name, caught: status !== 0, note: status };
}
let next = 0, results = [];
async function slot() { while (next < defects.length) { const i = next++; results[i] = await run(defects[i]); } }
await Promise.all(Array.from({ length: 6 }, slot));
let caught = 0;
for (const result of results) { if (result.caught) { caught++; console.log('  caught  ' + result.name); } else console.log('ESCAPED  ' + result.name + ' (' + result.note + ')'); }
console.log('\n' + caught + '/' + defects.length + ' mutations caught');
process.exit(caught === defects.length ? 0 : 1);
