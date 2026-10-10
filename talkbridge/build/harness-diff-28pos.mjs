#!/usr/bin/env node
/* 28·post-ship DIFFERENTIAL harness (§7.16 M3, clusters 4 and 5: render and
   the shallow sweep) — the 28·ship c1 bytes and the flattened candidate boot
   side by side in identical rigs and are driven through the same script: the
   whole relay, call and room-lifecycle scripts of 28·ship, then the render
   path — the left panel built as boot builds it and rendered with rooms of
   every shape (live, muted with waiting counts, deleted, carrying a thread
   invite, send-locked), a burst of three renders collapsed by the latch, the
   bin opened, a room restored, one deleted for good, a card tapped, a room
   soft-deleted from its card, a thread asked for, an invite accepted and one
   declined, the home screen rendered and a home card dismissed by tapping it,
   the room head rendered and its name popup toggled, and a transcript of
   every entry kind painted live and in bulk (typed with markdown, spoken in a
   voice call and a video call and plain, from the phrasebook, with an
   attachment, failed, read, delivered, carrying what was said) under all
   three meta layouts. Every phone's ordered log, wire, sockets, rooms,
   transcript, the create sheet, the invite links, the lifecycle state, the
   rendered panel / home / head / transcript are compared. Structural sections
   prove the removal and the contract. Every gate is mutation-tested by
   build/mutate-28pos.mjs.

   Usage: node harness-diff-28pos.mjs [candidate.html]
     TB_PARTS_OVERRIDE=fl4   TB_KEEP=fixture,...   TB_DUMP=1 */

import { readFileSync } from 'fs';
import { BASE_FILE, PARTS, SYMBOLS, CAPTURED, ADDED_MARKERS, DEAD_MARKERS, assembleFlat, removals } from './assemble-28pos.mjs';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';

/* the candidate of THIS harness is the flat build — the fixes stage (D-11, D-14, D-15, T-4, X-4) is judged by harness-fixes-28pos against it */
const candP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const accepted = readFileSync(BASE_FILE, 'utf8');
const parts = PARTS.map((p, i) => process.env.TB_PARTS_OVERRIDE ? readFileSync(process.env.TB_PARTS_OVERRIDE.split(',')[i], 'utf8') : readFileSync(p, 'utf8'));
const [fl4, fl5] = parts;
const KEEP = process.env.TB_KEEP ? process.env.TB_KEEP.split(',') : [];
const cand = candP ? readFileSync(candP, 'utf8') : assembleFlat({ parts, keepRemovals: KEEP });
const N_LAYERS = 97;

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const TA = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const inline = (html) => html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)[1];

/* ── M1 · THE REMOVAL IS EXACTLY THE DECLARED ONE ────────────────────────── */
console.log('M1 · candidate === 28·ship c1 − declared layers + FL-4 + FL-5, nothing else');
T('M1.1 candidate is the flat assembly for these parts (every removal by its banked bytes)', () => assert(cand === assembleFlat({ parts, keepRemovals: KEEP }), 'candidate is not accepted − removals + parts'));
T('M1.2 every removed layer is banked and was present exactly once in the base bytes', () => {
  const rs = removals(); assert(rs.length === N_LAYERS, 'expected ' + N_LAYERS + ' banked layers, got ' + rs.length);
  for (const r of rs) { assert(accepted.split(r.text).length - 1 === 1, r.file + ' not exactly once in accepted'); if (!KEEP.includes(r.file)) assert(cand.indexOf(r.text) === -1, r.file + ' still in candidate'); }
});
T('M1.3 the parts declare exactly the eight render symbols and the thirty-two sweep symbols, no wraps', () => {
  const c4 = fl4.slice(fl4.indexOf('@contract'), fl4.indexOf('*/', fl4.indexOf('@contract')));
  assert(/replaces:\s*renderPanel, renderHome, renderTranscript, renderRoomHead, appendMsgDom, msgHtml, roomCardHtml, wireRoomCards/.test(c4) && /wraps:\s*\(none\)/.test(c4), 'FL-4 contract mismatch');
  const c5 = fl5.slice(fl5.indexOf('@contract'), fl5.indexOf('*/', fl5.indexOf('@contract')));
  const declared = (c5.match(/replaces:\s*([^\n]+)/) || [])[1].split(',').map((x) => x.trim());
  assert(declared.length === 32 && SYMBOLS.slice(8).every((x) => declared.includes(x)) && /wraps:\s*\(none\)/.test(c5), 'FL-5 contract mismatch: ' + declared.join(','));
});

/* ── M2 · NOTHING NEW, NOTHING LEFT BEHIND ───────────────────────────────── */
console.log('M2 · nothing new, nothing left behind');
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
T('M2.1 the set of log markers in the candidate equals the accepted set (no marker added or lost)', () => {
  const a = markers(inline(accepted)), c = markers(inline(cand));
  const added = [...c].filter((x) => !a.has(x) && !ADDED_MARKERS.includes(x)), lost = [...a].filter((x) => !c.has(x) && !DEAD_MARKERS[x]);
  assert(added.length === 0 && lost.length === 0, 'added: ' + added.join(',') + ' lost: ' + lost.join(','));
  /* a marker may leave only with a dead layer: it occurs nowhere in the accepted source but inside that banked layer, and either the layer's declaration is shadowed by a later declaration of the same name, or a named later layer replaced the symbol by assignment without ever calling the captured previous one */
  for (const m of Object.keys(DEAD_MARKERS)) {
    const dm = DEAD_MARKERS[m];
    const fx = removals().filter((r) => r.file === dm.layer)[0]; assert(fx, 'dead marker ' + m + ' names no banked layer');
    const inFx = (fx.text.match(new RegExp("'" + m + "'", 'g')) || []).length, inAll = (code(inline(accepted)).match(new RegExp("'" + m + "'", 'g')) || []).length;
    assert(inFx >= 1 && inFx === inAll, 'dead marker ' + m + ' lives outside its dead layer (' + inAll + ' vs ' + inFx + ')');
    const name = (fx.text.match(/^function ([A-Za-z_$][\w$]*)\(/m) || [])[1]; assert(name, 'dead layer declares no function');
    if (dm.by === 'shadow') assert((code(inline(accepted)).match(new RegExp('^function ' + name + '\\(', 'mg')) || []).length === 2, 'the dead layer\'s ' + name + ' is not shadowed by a later declaration');
    else {
      const by = removals().filter((r) => r.file === dm.by)[0]; assert(by, 'replacing layer not banked: ' + dm.by);
      assert(new RegExp('(^|[^\\w$.])' + name + ' = function').test(by.text) && !/\.(apply|call)\(/.test(by.text) && !new RegExp('\\b' + name + '\\(').test(by.text), 'layer ' + dm.by + ' does not replace ' + name + ' without calling through');
      assert(accepted.indexOf(fx.text) < accepted.indexOf(by.text), 'the replacing layer must come after the replaced one');
    }
  }
});
T('M2.2 no wrapper of a flattened symbol survives; each of the forty symbols is declared exactly once; no captured previous-layer reference, stash or latch assignment remains', () => {
  const js = code(inline(cand));
  for (const s of SYMBOLS) {
    const decl = (js.match(new RegExp('^(?:async )?function ' + s + '\\(', 'mg')) || []).length;
    let assigns = 0; { const re = new RegExp('(^|[^\\w$.])' + s + '\\s*=(?!=)', 'g'); let m; while ((m = re.exec(js))) { if (!/(?:var|let|const)\s*$/.test(js.slice(Math.max(0, m.index - 6), m.index + m[1].length))) assigns++; } }
    assert(decl === 1 && assigns === 0, s + ': ' + decl + ' declaration(s) + ' + assigns + ' assignment(s)');
  }
  const left = CAPTURED.filter((v) => new RegExp('(^|[^\\w$])' + v + '(?![\\w$])').test(js));
  assert(left.length === 0 && !/latch\('/.test(js), 'a captured previous-layer reference or the T1 latch survives: ' + left.join(','));
  for (const v of ['x3Pending', 'X3_PENDING_MS', 'x3PendingIn', '_n16Q', '_t2Limited', '_k2LastErr', '_k1Prefix', 'x3Ico']) assert((js.match(new RegExp('(^|[^\\w$.])var ' + v + '\\b', 'g')) || []).length === 1, v + ' must be declared exactly once (moved whole)');
  assert(!/window\.x3Pending = function/.test(js), 'X3\'s accessor over the moved record survives');
});
T('M2.3 nothing new on the wire or in the credential path (G19/G20): FL-4 and FL-5 add no message type, no endpoint, no credential path; every network or credential line in FL-5 is a line the accepted build had', () => {
  const c = code(fl4) + '\n' + code(fl5);
  const SENSITIVE = /fetch\(|https?:\/\/|credentials\/generate|iceServers|transport=tcp|turns?:|tb_gh_pat|tb_dg_key|Authorization|ghHeaders\(|new WebSocket\(/;
  assert(!SENSITIVE.test(code(fl4)), 'FL-4 has a network or credential path');
  const acc = code(inline(accepted)).split('\n').map((l) => l.trim());
  const RENAMED = { g1Gcode: 'gcode', g1Keep: 'keep', _n16Dev: 'DEV', _n16Q: 'Q', _n16Sending: 'SENDING', n16Base: 'base', n16Flush: 'flush', translateWithRetryCore: '_translateWithRetry' };   /* the declared renames of moved closure state; a network line must match the accepted modulo these */
  const unrename = (l) => Object.keys(RENAMED).reduce((t, k) => t.replace(new RegExp('\\b' + k + '\\b', 'g'), RENAMED[k]), l);
  const lines = code(fl5).split('\n').filter((l) => SENSITIVE.test(l)).map((l) => unrename(l.trim()));
  assert(lines.length >= 4, 'FL-5 lost its network lines (the device log upload, the Google endpoint, the phrasebook write-back, the transcription socket)');
  for (const l of lines) assert(acc.includes(l), 'FL-5 network/credential line is not one the accepted build had: ' + l.slice(0, 90));
  const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };
  const base = types(code(inline(accepted))); const added = [...types(c)].filter((t) => !base.has(t)); assert(added.length === 0, 'new message type: ' + added.join(','));
});

/* ── M3 · DIFFERENTIAL ───────────────────────────────────────────────────── */
console.log('M3 · differential: same script, same phones, same everything');
const { RA, RC, snapA, snapC } = await runBoth(accepted, cand);

T('M3.0 the script exercised every absorbed layer: every headline marker fired on the base build', () => {
  if (process.env.TB_DUMP) console.log('    render: ' + JSON.stringify({ ...snapA.X.render, panel: (snapA.X.render.panel || '').slice(0, 200), home: (snapA.X.render.home || '').slice(0, 120), afterBin: undefined, afterCards: undefined, homeAlone: undefined, homeAfter: snapA.X.render.homeAfter && { ...snapA.X.render.homeAfter, html: undefined }, doms: snapA.X.render.doms.map((d) => d.length) }) + '\n    said: ' + JSON.stringify(snapA.X.render.saidIds) + '\n    hk: ' + JSON.stringify(snapA.X.housekeeping));
  const evs = new Set([...snapA.X.log, ...snapA.Y.log].map((l) => l.ev));
  if (process.env.TB_DUMP) console.log('    ids: ' + [...RA.X.w.document.querySelectorAll('#transcript [data-id]')].map((n) => n.getAttribute('data-id') + ':' + n.className).join(' '));
  if (process.env.TB_DUMP) console.log('    s3: ' + JSON.stringify(snapA.X.s3.map((x) => ({ show: x.show, myname: x.myname, my: x.my, their: x.their, hasName: /id="s3-name"/.test(x.html), hasMyname: /id="s3-myname"/.test(x.html) }))) + '\n    created: ' + JSON.stringify(snapA.X.created) + '\n    errs: ' + JSON.stringify(snapA.X.errs) + '\n    lc: ' + JSON.stringify(snapA.X.log.filter((l) => /^lc_|^b8c|^room_enter|^joiner_/.test(l.ev)).map((l) => l.ev + ':' + JSON.stringify(l.d))));
  if (process.env.TB_DUMP) console.log('    X events: ' + [...new Set(snapA.X.log.map((l) => l.ev))].join(',') + '\n    Y events: ' + [...new Set(snapA.Y.log.map((l) => l.ev))].join(',') + '\n    X wire: ' + snapA.X.wire.map((m) => m.type).join(',') + '\n    Y wire: ' + snapA.Y.wire.map((m) => m.type).join(',') + '\n    errors: ' + JSON.stringify(snapA.X.errors.concat(snapA.Y.errors)) + '\n    pcs: ' + JSON.stringify(snapA.X.pcs) + JSON.stringify(snapA.Y.pcs) + '\n    n10: ' + JSON.stringify(snapA.X.n10) + '\n    keys: ' + JSON.stringify(snapA.X.keys) + '\n    ring: ' + JSON.stringify(snapA.Y.ring) + JSON.stringify(snapA.Y.ring2));
  const need = ['room_enter', 'gen_bump', 'pr2_declared', 'lc_create_fields_captured', 'lc_room_created', 'lc_invite_built', 'lc_joined_plain', 'lc_grant_accepted', 'w1_welcome', 'joiner_entered', 'cr3_leave_lane', 'b8c_room_name_set', 'call_start', 'call_ring', 'call_accept', 'call_end', 'n10_caller_screen', 'n10_answered', 'n10_accept_anchor', 'n10_caller_cancelled', 'n18_anchor', 'r8_call_timer', 'rtc_answered', 'rtc_got_answer', 'net_mic_toggled', 'net_cam_toggled', 'rm_transcription_stopped_for_mute', 'rm_transcription_resuming_after_mute', 'c3_restart_requested', 'c3_restart_served', 'c3_restart_answered', 'c3_restart_ignored', 'rtc_glare_ignored', 'c2_stalled', 'c2_resumed', 'rtc_video_stalled', 'rtc_recovery', 'f1_sender_kept', 'cr3_grant_keys_used', 'cr3_ring_deferred_hidden', 'c1_queued', 'v2_retry', 'pr3_dot', 'bg_chat_rx', 'rm_rename_received', 'rc_room_hard_deleted', 'rc_home_dismissed', 'lc_room_restored', 'lc_room_soft_deleted', 'p6_invite_accepted', 'p6_invite_declined', 'rm_name_popup', 'said_kept', 'joiner_create_control', 'speech_added', 'transcript_collision', 'r8_speech_suppressed', 'r8_speech_kind', 'dg_final_stale_gen', 'rm_transcription_suppressed_muted', 'dg_no_key', 'dg_stopped', 'rm_rename_blocked_empty', 'rm_drawer_close_blocked_empty_name', 'cr3_os_notify_owned_by_relay', 'rm_receipt_popup', 'k4_rename_stale', 'rm_rename_received', 'pb_merge_err', 'pb_writeback_err', 'trans_ok', 'lc_send_blocked', 'joiner_send_direction', 'r8_dismiss_threshold_reset', 'cr3_recover', 'd10_refocus', 'net_dg_reopen', 'cr3_bump_ignored'];
  const missing = need.filter((e) => !evs.has(e));
  assert(missing.length === 0, 'never fired on the base build: ' + missing.join(',') + '\n      saw: ' + [...evs].join(','));
  assert(snapA.X.pcs.length >= 1 && snapA.Y.pcs.length >= 1 && snapA.X.n10.length === 5 && snapA.X.n10[0].show === true && snapA.X.n10[1].show === false && snapA.X.n10[3].show === true && snapA.X.n10[4].show === false, 'the caller screen did not show/hide as scripted: ' + JSON.stringify(snapA.X.n10));
  assert(snapA.X.keys.length === 5 && snapA.X.keys[2].dg === 'dg-grant' && snapA.X.keys[1].dg === 'dg-mem' && snapA.X.keys[4].dg === '', 'keys did not merge: ' + JSON.stringify(snapA.X.keys));
  assert(snapA.X.flip[0] === 1 && snapA.X.flip[2] === true, 'the tagged sender was not kept: ' + JSON.stringify(snapA.X.flip));
  assert(snapA.X.created && snapA.X.created.title === 'Picnic' && snapA.X.created.myName === 'Annie' && snapA.X.inv.length === 3 && snapA.X.inv.every((u) => /#j=/.test(u)) && snapA.X.inv[2] !== snapA.X.inv[0], 'the create / invite script did not run on the accepted build: ' + JSON.stringify([snapA.X.created, snapA.X.inv.map((u) => u.slice(0, 40))]));
  assert(snapA.Y.join && snapA.Y.join.err === 'block' && snapA.Y.rooms.some((r) => r.id === 'inv-plain') && snapA.Y.rooms.some((r) => r.id === 'inv-grant') && snapA.Y.lifecycle.grant[1] === 'tb_grant_dg=dg-granted', 'the join script did not run on the accepted build: ' + JSON.stringify([snapA.Y.join, snapA.Y.lifecycle.grant]));
  assert(snapA.Y.ring && snapA.Y.ring.pending === 'voice' && snapA.Y.ring2 && snapA.Y.ring2.active === false && snapA.Y.ring2.pending === false, 'ring states: ' + JSON.stringify([snapA.Y.ring, snapA.Y.ring2]));
  const rd = snapA.X.render;
  assert(rd && rd.burstSync === 1 && rd.trailing === true && rd.coalesced === 1, 'the latch did not collapse the burst as T1 does (1 sync, 1 trailing, 1 coalesced): ' + JSON.stringify([rd && rd.burstSync, rd && rd.trailing, rd && rd.coalesced]));
  assert(snapA.X.housekeeping.t1_coalesced && snapA.X.housekeeping.md1_rendered && snapA.X.housekeeping.rc_panel_rendered && snapA.X.housekeeping.rc_home_rendered, 'render housekeeping markers never fired: ' + JSON.stringify(snapA.X.housekeeping));
  assert(/rc2-plus/.test(rd.panel) && /bin-sec/.test(rd.panel) && /p6-inv/.test(rd.panel) && /rc2-bell/.test(rd.panel) && !/data-thread="rm-locked"/.test(rd.panel), 'the panel did not render every card shape: ' + rd.panel.slice(0, 300));
  assert(rd.npOnRender === 1, 'the password sweep did not run once, synchronously, on a redraw: ' + rd.npOnRender);
  assert(rd.home && /home-sum/.test(rd.home) && /data-where="home"/.test(rd.home) && rd.homeCard === 'bg-room' && rd.homeAfter.roomId === 'bg-room' && evs.has('r8_dismiss_threshold_reset'), 'the home screen did not render / dismiss / open the room (R8 resets the dismissal on entry): ' + JSON.stringify([rd.homeCard, rd.homeAfter]));
  assert(rd.threadModal[0] && rd.threadModal[2] === 'rm-inv' && rd.binOpen[0] === true && rd.afterCards.roomId === 'rm-muted' && rd.afterCards.panelOpen === false, 'the panel controls did not act: ' + JSON.stringify([rd.threadModal, rd.binOpen, rd.afterCards.roomId, rd.afterCards.panelOpen]));
  assert(rd.head[0].wired === '1' && rd.head[1].pop === true && rd.head[2].pop === false && /Last seen/.test(rd.head[0].title), 'the room head did not wire / toggle its popup: ' + JSON.stringify(rd.head));
  const want = { bold: /<strong>bold<\/strong>/, link: /<a href="https:\/\/example.org"/, image: /att-img/, failed: /fail-badge/, read: /receipt read/, delivered: /receipt delivered/, list: /<ul><li>/, pill: /class="pill"/, voiceMark: /origin-mark/ };
  const miss = Object.keys(want).filter((k) => !want[k].test(rd.doms[0] || ''));
  assert(rd.doms.length === 3 && miss.length === 0 && /bottom-head/.test(rd.doms[1]) && !/tr-head/.test(rd.doms[2]), 'the transcript did not paint every entry kind: missing ' + miss.join(',') + '; bottom=' + /bottom-head/.test(rd.doms[1] || '') + ' off=' + !/tr-head/.test(rd.doms[2] || ''));
  assert(rd.saidIds.length === 1 && /hola amigo:es$/.test(rd.saidIds[0]), 'the partner\'s said was not kept: ' + JSON.stringify(rd.saidIds));
  const sw = snapA.X.sweep;
  if (process.env.TB_DUMP) console.log('    sweep: ' + JSON.stringify({ ...sw, pb: sw.pb && { list: (sw.pb.list || '').length, cards: sw.pb.cards.length }, links: sw.links.map((u) => u.slice(0, 30)) }));
  assert(sw.spoken.length >= 4 && sw.spoken[1][0] === 'Say this and that' && sw.spoken[0] === 'cancel', 'speech was not stripped of markdown and spoken: ' + JSON.stringify(sw.spoken));
  assert(/\.tr-head\{background:#ABCDEF\}/.test(sw.theme[0]) && String(sw.theme[1]).toLowerCase() === '#abcdef', 'the header colour was not applied: ' + JSON.stringify(sw.theme));
  assert(sw.links.length === 2 && sw.links.every((u) => /#j=/.test(u)) && sw.ids.length === 2 && /^[a-z0-9]{8}-/.test(sw.ids[0]), 'links / ids: ' + JSON.stringify([sw.links.map((u) => u.slice(0, 20)), sw.ids]));
  assert(sw.drawer[0] === 'drawer open' && sw.drawer[1] === 'drawer' && sw.drawer[2] === 'Annika', 'the drawer did not block then close / rename: ' + JSON.stringify(sw.drawer));
  assert(sw.partnerState === true && sw.receipt === true && sw.receiptPop && sw.receiptPop[0] === 'block' && /Message status/.test(sw.receiptPop[2] || ''), 'receipt popup / partner state: ' + JSON.stringify([sw.partnerState, sw.receipt, sw.receiptPop]));
  assert(sw.titles[0] !== 'Old' && sw.titles[1] === 'Newer' && sw.titles[2] === 'N', 'rename last-write-wins: ' + JSON.stringify(sw.titles));
  assert(sw.unreadAfterHidden === 0 && sw.bumpsAfterHidden === 1 && sw.ownSaid === 'ขอบคุณมาก' && snapA.Y.log.some((l) => l.ev === 'said_kept' && l.d.who === 'partner' && l.d.lang === 'th'), 'the hidden chat / the own normalized line did not run: ' + JSON.stringify([sw.unreadAfterHidden, sw.bumpsAfterHidden, sw.ownSaid]));
  assert(sw.pb.forms === 1 && sw.formsAfterList === 1, 'the open tag field was not dressed in a form: ' + JSON.stringify([sw.formsAfterList, sw.pb.forms]));
  assert(sw.card && sw.pb.cards[0] && sw.pb.cards[0].tags.includes('greeting') && sw.pb.cards[0].target === 'สวัสดีตอนเช้าครับ' && sw.pb.cards[0].source === 'good morning!' && sw.wb.length === 4 && sw.wb[0] === 'no-pat' && sw.wb[1] === 'pending' && sw.wb[2] === 'pending', 'phrasebook ops: ' + JSON.stringify([sw.card, sw.pb.cards[0] && sw.pb.cards[0].tags, sw.wb]));
});
for (const who of ['X', 'Y']) for (const key of KEYS) {
  
  T('M3 ' + who + '.' + key + ' identical on both builds', () => { const out = []; diff(snapA[who][key], snapC[who][key], who + '.' + key, out); if (out.length && key === 'log') { const first = out.map((l) => (l.match(/^[XY]\.log\[(\d+)\]/) || [])[1]).filter((x) => x != null)[0]; const i = Math.max(0, (Number(first) || 0) - 6); out.push('A: ' + snapA[who].log.slice(i, i + 14).map((l) => l.ev).join(' ')); out.push('C: ' + snapC[who].log.slice(i, i + 14).map((l) => l.ev).join(' ')); } assert(out.length === 0, '\n      ' + out.join('\n      ')); });
}
T('M3 X.room identical on both builds', () => { const out = []; diff(snapA.X.room, snapC.X.room, 'X.room', out); assert(out.length === 0, '\n      ' + out.join('\n      ')); });
T('M3 X.dom/Y.dom: the check button (X-3) is present on both builds alike', () => {
  for (const inst of [RA.X, RC.X]) { const t = inst.w.document.getElementById('transcript'); assert(t.querySelectorAll('.msg .head-acts').length === t.querySelectorAll('.head-acts [data-hact=check]').length, 'check buttons differ from headers'); }
});

RA.X.dom.window.close(); RA.Y.dom.window.close(); RC.X.dom.window.close(); RC.Y.dom.window.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
