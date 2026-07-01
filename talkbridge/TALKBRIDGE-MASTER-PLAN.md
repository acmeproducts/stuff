# TALKBRIDGE MASTER PLAN
**Version: 3.5 | 2026-07-01 | Governing document. Repo: github.com/acmeproducts/stuff, path: talkbridge/TALKBRIDGE-MASTER-PLAN.md**

---

# PART 0 — WHAT WE'RE BUILDING AND WHERE WE ARE

## The product
TalkBridge is a WhatsApp-style bilingual video call app with real-time speech-to-text, translation, and a curated phrasebook. Two people — one English speaker, one Thai speaker — open the app, join a room, talk, see each other's words translated in real time, and use a shared phrasebook to clarify things that don't translate well. It installs to the home screen, works when the app is closed (push notifications), and is configurable end-to-end without a code rebuild.

## What exists today
- `bridge-turn06-post-ship.html` (v5.6.4, banked) — the working call engine with STT, translation, and 17 dormant modules. This is the floor for all future work.
- `test.html` — the shell architecture reference (room list, thread, async chat, multi-room).
- `phrase-desk.html` — the phrasebook card layout authority.
- `talkbridge/fixtures/` — norm, query, render fixtures (authored in Turn 06).

## The road to done
```
Turn 07  PB activation — phrasebook working end-to-end on the phone
Turn 08  Shell merge + PWA — bridge engine inside test.html shell, installable
Turn 09  Single translation path — chat and call use one pipeline
Turn 10  Token identity + multi-device
Turn 11  Presence, waiting, room disposal
Turn 12  Design system + pilot readiness → DONE
```

## Where we are right now
**CURRENT STAGE:** Turn 07 / Base — PB-DATA activation (pre-base is DONE; base is NOT STARTED)

See Part 1 for the doer protocol. See Part 3 for the Turn 07 spec.

---

# PART 1 — DOER PROTOCOL

You are the DOER. You build exactly ONE stage of this plan, then STOP.

## Before you touch any code

1. Read this entire document.
2. Read the graveyard: `https://raw.githubusercontent.com/acmeproducts/stuff/main/talkbridge/TALKBRIDGE-GRAVEYARD.md`
3. Confirm the CURRENT STAGE above. Confirm the prior stage is BANKED in the Status Ledger (Part 2). If it is not banked, STOP — you are not authorized to build the next stage.
4. Fetch the input baseline fresh from GitHub (path in the stage spec). Verify its sha256 and line count against the RUN HISTORY entry for that banked stage. Mismatch → STOP.

## The mandatory five-stage structure

Every turn has exactly five stages in this order:

```
Pre-base → Base → Pre-ship → Ship → Post-ship
```

**This is the ONLY permitted structure. No turn skips any stage. No exceptions.**

**Pre-base** is fed by a copy of the previous turn's Post-ship file, byte-for-byte. That copy IS the Pre-base artifact. The doer verifies sha256 and line count match the prior Post-ship ledger entry, then banks it.

**Base** is derived from Pre-base (typically identical or with a defined freeze step). It is the verified floor for all Pre-ship work. Bank it before Pre-ship starts.

**Pre-ship, Ship, Post-ship** are the build stages. Each starts only from the previous banked stage.

The chain across turns:
```
Turn N Post-ship → copy → Turn N+1 Pre-base → Base → Pre-ship → Ship → Post-ship
                                                                         ↓
                                                            Turn N+2 Pre-base → ...
```

A doer that begins Pre-ship without a banked Base has produced an unverifiable artifact and must stop immediately.

## The workflow for every change (§WF)

Execute these steps in order. Never skip one. Never reorder.

1. **READ** — quote the relevant Part 4 contract verbatim.
2. **COMPREHENSION** — answer the comprehension questions for this module. Wrong answer → re-read, do not build.
3. **GRAVEYARD SCAN** — does this approach match any buried entry? Match → STOP, report.
4. **CHECKSUM BEFORE** — record the sha12 of the region being changed or `n/a-new` for new code.
5. **PREDICT AFTER** — state expected sha12 and line delta before writing anything.
6. **INSERT** — drop in the atomic module block (format in §AF). Never edit a live function body.
7. **VERIFY** — compute actual sha12. If it does not match predicted → REVERT. Do not adjust and continue.
8. **BUILD LOG** — record module name, before sha, predicted after sha, actual after sha, PASS/FAIL.
9. **PRE-DEVICE GATE** — run the full machine check (§PDG). All-green is required before the phone is touched.
10. **DEVICE TEST** — user runs the numbered test table. Red → §EXIT.

## Exit condition (§EXIT)

After a red device test:
- Re-fetch the last banked file from GitHub. Re-run §WF from step 1. This is the one permitted retry.
- If retry is also red → EXIT. Emit: which stage failed, which step, what diverged, what device case went red, graveyard match result. Explicit language: "Exit triggered. No further attempts." Do not patch forward. The last banked file is the floor.

## Delivery

- Produce a COMPLETE single-file HTML. No fragments. Ever.
- Push the file to repo under the name specified in the stage spec.
- Do not overwrite any banked file.
- Update the Status Ledger (Part 2): overwrite CURRENT RUN, append to RUN HISTORY.
- Return the complete file + build log + §RTR report. Then STOP.

## If anything is ambiguous

STOP. List the exact gap with the section it should have appeared in. Do not fill gaps with guesses.

---

# PART 2 — STATUS LEDGER

The doer writes here after every run. The manager reads here. The tester never relays status.

## CURRENT RUN
- STAGE: Turn 07 / Pre-ship / PB Engine Activation
- ATTEMPT: (none yet)
- DISPOSITION: NOT STARTED
- READY-TO-TEST REPORT: (none yet)
- NOTES / GAPS / EXIT REASON: (none yet)

## RUN HISTORY (append-only, newest first)
- 2026-06-30 Turn 07 / Pre-base — DONE. bridge-turn07-pre-base.html = bridge-turn06-post-ship.html byte-identical. 4780 lines, sha prefix a73aecbf. Negative test pass (T06 post-ship behavior confirmed unchanged).
- 2026-06-30 Turn 06 / Post-ship — BANKED. All 17 modules present dormant. v5.6.4, sha prefix a73aecbf. 4780 lines. Deterministic gate green; device gate pass.
- 2026-06-30 Turn 06 / Ship — BANKED. 7 modules dormant. v5.6.3. +310 lines additive. 21/21 immutables. Fixtures pass. Device gate pass.
- 2026-06-30 Turn 06 / Pre-ship — BANKED. 9 engine modules dormant. v5.6.2. 21/21 immutables (setupPC async prefix confirmed). Device gate pass.

---

# PART 3 — TURN SPECS

## ⛔ Rules that apply to every turn

- **Base is always first.** No exceptions. The Base sha must be in the ledger before Pre-ship starts.
- **One stage banks before the next starts.** Never build ahead.
- **Version stamp:** every stage increments the patch version. Output version = input patch + 1. A build showing the input version is not certifiable.
- **21 immutable functions** (Part 5 §IMM) stay byte-identical through every turn. Any mismatch = reject.
- **Highest-sequence file rule** (PB-SYNC): phrasebook files are named `phrasebook-{src}-{tgt}-{NNNN>=1000}.json`. On pull, list the directory, sort descending, fetch the highest. On writeBack, increment by 1 from the current highest.
- **writeBack is conditional:** only fires when dirty flag is set. If clean, logs `pbsync_skipped_no_changes` and returns. Never writes unconditionally.

---

## TURN 07 — PB Activation
Input: bridge-turn06-post-ship.html (4780 lines, sha prefix a73aecbf).

### Pre-base — Status: DONE
**Deliver:** bridge-turn07-pre-base.html
**Work:** Copy bridge-turn06-post-ship.html byte-for-byte. No code changes.
**Test:** Open on phone. Identical to T06 post-ship — call connects, transcript works, PB overlay opens. Any difference → stop.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn07-base.html, v5.7.0
**Work:** Activate PB-DATA. Wire old storage functions (pbGetCards, pbSaveCards, pbNorm) to redirect into PB-DATA so all existing callers receive cards in the new canonical schema. Old fields (catalogIds, intentId, fingerprint, relatedIntents, confidence, semanticRelationships, parentCategory, primaryTag) stripped on load. pbBubbleHtml (old card renderer) stays live — PB-RENDER not active yet.
**References:** Part 4 §4M.12 (canonical schema). Part 5 §IMM (21 immutables untouched).
**Test:** Open on phone. Overlay opens, cards display via old renderer. Debug log shows PB-DATA.norm:in/out firing for each card. Card objects in log show categories[] not catalogIds. Call and transcript unaffected.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn07-pre-ship.html, v5.7.1
**Work:** Activate PB-SYNC and PB-USAGE.
- Wire PB-SYNC.pull(myLang, theirLang) into enterCall — fetches highest-versioned phrasebook-{src}-{tgt}-{NNNN>=1000}.json from GitHub /phrasebook/, replaces cache wholesale, no merge. Flag use.PB_SYNC → true.
- Wire PB-SYNC.writeBack() into hangUp and dirty overlay-close — conditional on dirty flag only. Clean → log pbsync_skipped_no_changes, do nothing.
- Wire PB-USAGE.recordUse(cardId) into pb-use action. Flag use.PB_USAGE → true.
- No PAT → {status:'no-pat'}, call connects. No file → toast "No shared phrasebook yet", call connects. Network error → pbsync_pull_err logged, call connects.
- writeBack dirty path: list /phrasebook/, next version = highest + 1, PUT phrasebook-{src}-{tgt}-{NNNN+1}.json, log pbsync_upload_completed. Error → pbsync_push_err.
**References:** Part 4 §4M.13 (PB-SYNC), §4M.16 (PB-USAGE). Part 6 G1–G6.
**Test:**
- G1: enter en-th call, file exists → pbsync_pulled in log; cards visible in overlay.
- G2: no file → toast "No shared phrasebook yet"; call connects.
- G3: no changes, hang up → pbsync_skipped_no_changes in log.
- G4: edit card, hang up → pbsync_upload_completed in log; new versioned file in GitHub.
- G5: edit card, close overlay → write-back fires immediately.
- G6: edit card, hang up offline → pbsync_upload_pending in log; restore network → pbsync_upload_completed.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn07-ship.html, v5.7.2
**Work:** Activate PB-QUERY, PB-RENDER, COMPOSE-SEAM.
- PB-RENDER.renderCard replaces pbBubbleHtml. pbBubbleHtml removed.
- PB-RENDER.renderRow renders search result rows in overlay and compose drawer.
- PB-QUERY.query drives all search — one engine for both surfaces.
- COMPOSE-SEAM wired at one call site: / and .. open slide-up search drawer. Guard on BOTH Enter AND send button — predicate never reaches transcript.
**References:** Part 4 §4M.14 (PB-QUERY), §4M.15 (PB-RENDER). phrase-desk.html (card layout authority). Part 6 A1–G6, E1–E8.
**Test:**
- Overlay cards show source, target, back-translate, verdict pills, footer icons, tag drawer, clarify drawer per phrase-desk.html layout.
- Type in overlay search → rows appear filtered; clear → full cards return.
- Type /bank + Enter in chat → NOT sent; overlay opens searching "bank".
- Type /bank + tap Send → NOT sent.
- Normal message + Enter → sends to transcript.
- All A1–G6 pass.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn07-post-ship.html, v5.7.3
**Work:** pbAddCard wired; duplicate save check (F1); all edge cases closed.
**Test:** Full A1–G6 + G1–G6 on device. Input to Turn 08 pre-base.

---

## TURN 08 — Shell Merge + PWA
Input: bridge-turn07-post-ship.html.

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn08-pre-base.html
**Work:** Copy bridge-turn07-post-ship.html byte-for-byte.
**Test:** Identical to T07 post-ship — PB works, call works, nothing changed.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn08-base.html, v5.8.0
**Work:** Activate the nine engine modules — CONFIG, LOG, STORE, RELAY, RTC, STT, TRANSLATE, LANGDETECT, NORMALIZE — in one pass. Old hardcoded paths removed. Service worker registered; app installable to home screen.
**References:** Part 4 §4M.1–§4M.8. Part 5 §IMM.
**Test:** Call connects, transcript appears, translation correct — same behavior, now through modules. Debug log shows module events (CONFIG.get:out, RELAY.connect:out, STT.start:out). App installs to home screen.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn08-pre-ship.html, v5.8.1
**Work:** test.html shell merged. Five surfaces live: Room List (initiator only), Room Creation (chat-only vs chat+call, immediate share link+QR), Thread (call button in DOM only for chat+call rooms), Call (bridge engine mounted from Thread), Room Info/Dispose (one confirmation). Joiner lands in Thread directly. Hang-up → CALL.unmount → Thread + "call ended" marker.
**References:** Part 7 (all five surface element maps). test.html, 2vid.html.
**Test:** Initiator creates chat+call room → call connects → hang up → Thread shows "call ended". Chat-only room → no call button in DOM. Joiner lands in Thread, cannot reach Room List. PB works inside call.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn08-ship.html, v5.8.2
**Work:** Push notifications wired to correct room. Dispose flow complete. Two-device regression.
**Test:** App backgrounded → notification opens correct Thread. Dispose → one confirmation → room gone. Two-device: Galaxy + iPhone, call with translation + PB.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn08-post-ship.html, v5.8.3
**Work:** Full regression. All T07 cases pass inside merged app. Edge cases closed.
**Test:** Full two-device regression all surfaces. Input to Turn 09 pre-base.

---

## TURN 09 — Single Translation Path
Input: bridge-turn08-post-ship.html.

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn09-pre-base.html
**Work:** Copy bridge-turn08-post-ship.html byte-for-byte.
**Test:** Identical to T08 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn09-base.html, v5.9.0
**Work:** NORMALIZE is sole translation entry for chat AND call. Z→X→Y enforced at one place. Dead parallel routes removed.
**Test:** Speak → correct. Type → correct. Type in third language → routes through your preferred language first, then partner's. Original never shown. One log event per translation.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn09-pre-ship.html, v5.9.1
**Work:** PB card send, use, search all route through NORMALIZE. No duplicate translation events.
**Test:** Send PB card → one translation event in log. Chat and call translation log shape identical.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn09-ship.html, v5.9.2
**Work:** All remaining dead routes removed. Full regression.
**Test:** Full A1–G6 + G1–G6. Every translation → exactly one log event through NORMALIZE.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn09-post-ship.html, v5.9.3
**Work:** Edge cases and cleanup.
**Test:** Full two-device regression. Input to Turn 10 pre-base.

---

## TURN 10 — Token Identity + Multi-device
Input: bridge-turn09-post-ship.html.

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn10-pre-base.html
**Work:** Copy bridge-turn09-post-ship.html byte-for-byte.
**Test:** Identical to T09 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn10-base.html, v5.10.0
**Work:** Token is sole identity. All name-derived identity removed. Room ownership, joiner recognition, routing all keyed on token only.
**Test:** Create room on Galaxy, open join link on iPhone → recognized as joiner by token alone. Debug log shows no name-derived routing.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn10-pre-ship.html, v5.10.1
**Work:** Two-device chat sync. Messages from either device appear in the other's Thread in real time.
**Test:** Galaxy sends → appears on iPhone. iPhone sends → appears on Galaxy. Both show speaker-centric layout.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn10-ship.html, v5.10.2
**Work:** Two-device call. Ring on second device. Cross-device answer.
**Test:** Galaxy in room → iPhone joins → Galaxy calls → iPhone rings → iPhone answers → call connects with translation.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn10-post-ship.html, v5.10.3
**Work:** Drop mid-call, rejoin, re-create edge cases.
**Test:** Full regression. Input to Turn 11 pre-base.

---

## TURN 11 — Presence + Design + Pilot
Input: bridge-turn10-post-ship.html.

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn11-pre-base.html
**Work:** Copy bridge-turn10-post-ship.html byte-for-byte.
**Test:** Identical to T10 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn11-base.html, v5.11.0
**Work:** Relay presence contract live. Disposal policy enforced (unjoined 30-day expiry, joined never silent, dispose retires token + purges relay). Waiting indicator in Thread for initiator pre-join, survives app backgrounding.
**Test:** Create room → "waiting for them to join" in Thread. Background app → return → still showing. Joiner joins → clears. Dispose → join link returns error. Debug log shows presence events.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn11-pre-ship.html, v5.11.1
**Work:** All hardcoded color/size/spacing → CONFIG token keys. Two independent persisted axes: font scale and theme preset.
**Test:** Change font size → all surfaces larger. Change theme → all surfaces recolor. Reset one → other unchanged. Close and reopen → both persist. Default settings look identical to previous release.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn11-ship.html, v5.11.2
**Work:** Push notifications when app fully closed. Unread counts + last-message preview in Room List. Design consistent across all five surfaces and PB.
**Test:** Force-close app. Send message from other device. Notification arrives → tap → correct room Thread opens. Unread dot visible → read → clears. All surfaces visually coherent.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn11-post-ship.html, v5.11.3
**Work:** Full regression T07–T11 on Galaxy and iPhone. Configurability proof: change theme/font/labels/capability via CONFIG, no code rebuild.
**Test:** Every test from every prior turn passes. CONFIG change reshapes app without touching code. DONE.


---

# PART 4 — MODULE CONTRACTS

Every module exposes only its listed methods. Inputs and outputs are fixed. Every public method has exactly three log points: `MODULE.method:in`, `MODULE.method:out`, `MODULE.method:err`. Nothing is swallowed silently. A module never reads another module's internals or page globals.

## 4M.1 CONFIG
Owns all configurable parameters. Every other module reads from it, never from hardcoded values.
- `get(key)→value` | `getAll()→object` | `set(key,value)` | `subscribe(fn)` for live updates.
- Owns: relay constants, storage key names, theme tokens (54 hex colors from base), font scale (default 1.0), theme preset (default 'dark'), feature flags (`use.MODULE` booleans, all default false), room capability defaults, labels.
- Frozen keys: `relay.base`, `relay.ws`, `relay.app`, `tb_cf_tid`, `tb_cf_tok`, `tb_dev`, `tb_dg_key`, `tb_gh_pat`, `tb_my_lang`, `tb_their_lang`, `say_cards`.

## 4M.2 STORE
Sole owner of persistence.
- `get(key)→value` | `set(key,value)` | `remove(key)`. Namespaced.
- No other module touches localStorage directly once STORE is active.

## 4M.3 RELAY
Signaling transport.
- `send(msg)` | `onMessage(fn)` | `connect()` | `close()` | `status()`.
- Wraps the frozen relay functions; never rewrites them.

## 4M.4 RTC
WebRTC engine.
- `start(roomCtx)` | `stop()` | `onState(fn)`.
- Wraps `setupPC` and `teardownSession`; frozen functions stay byte-identical.

## 4M.5 STT
Deepgram.
- `start()` | `stop()` | `onFinal(fn)` | `reconcile(reason)`.
- Wraps `startDeepgram`, `stopDeepgram`, `reconcileDeepgramState`; all frozen.

## 4M.6 TRANSLATE
MyMemory + retry.
- `translate(text,src,tgt)→Promise<text>` | `backtranslate(text,src,tgt)→Promise<text>`.
- One shared path for chat and call. Wraps `translate`, `translateWithRetry`; both frozen.

## 4M.7 LANGDETECT
fastText language detection.
- `detect(text)→Promise<lang>`.
- Wraps `_detectLangAsync`, `_loadFastText`; both frozen.

## 4M.8 NORMALIZE
The Z→X→Y rule. Single entry point for all translation normalization.
- `normalize(text, userPref, partnerLang)→{display, sent}`. Original Z is never surfaced.

## 4M.9 ROOM
Room lifecycle.
- `create(capability)→room` (capability: 'chat' | 'chatcall') | `join(token)→roomView` | `dispose(id)` | `listForOwner()→rooms` | `get(id)→room`.
- Capability is fixed at creation. Owner-scoped: a joiner cannot enumerate other rooms.

## 4M.10 THREAD
Chat thread.
- `render(roomId)→elements` | `append(msg)→msg` | `postSystem(roomId, marker)→msg`.
- Speaker-centric display. System markers (e.g. "call ended") via postSystem.

## 4M.11 CALL
Call surface. Present only for chat+call rooms.
- `mount(roomCtx)→{mounted,roomId}` | `unmount()→{unmounted,roomId}`.
- On unmount: posts "call ended" marker via THREAD, returns control to Thread surface.

## 4M.12 PB-DATA
Sole owner of phrasebook card data.
- `getCards()` | `getLive()` | `byId(id)` | `save(cards)` | `norm(raw)→Card`.
- **Canonical schema:** `id, source, target, sourceLang, targetLang, categories[] (default ['unassigned']), createdBy, updatedBy, createdAt, updatedAt, lastUsed, usage (default 0), backtranslate{sourceLang, targetLang, inputText, resultText, verdict (default 'pending'), contentHash, updatedAt}, clarifyChain[]`.
- **Drops from old schema:** catalogIds, confidence, semanticRelationships, parentCategory, primaryTag, relatedIntents, intentId, fingerprint.
- `save()` REPLACES the cache. No merge. GitHub is source of truth.

## 4M.13 PB-SYNC
Versioned GitHub pull/push.
- `pull(src,tgt)→Promise<{status,version,cards}>` | `writeBack()→Promise<{status}>` | `markDirty()` | `isDirty()`.
- **File naming:** `phrasebook-{src}-{tgt}-{NNNN>=1000}.json`.
- **Highest-sequence rule:** on pull, list the `/phrasebook/` directory, filter for `phrasebook-{src}-{tgt}-{NNNN>=1000}.json`, sort descending by NNNN, fetch the highest. On writeBack, increment by 1.
- **Conditional writeBack:** only fires when `isDirty()` true. If clean, logs `pbsync_skipped_no_changes`, returns `{status:'skipped'}`.
- **pull return values:** `{status:'ok',version:N,cards:[]}` on success | `{status:'no-pat'}` if no token (no throw) | `{status:'no-pair-file'}` if no matching file | `{status:'error'}` on network/parse failure.
- **Log events (frozen):** `pbsync_pulled` | `pbsync_skipped_no_changes` | `pbsync_upload_completed` | `pbsync_upload_pending` | `pbsync_pull_err` | `pbsync_push_err`.

## 4M.14 PB-QUERY
Search and filter. One engine for both the inline search drawer and the PB overlay.
- `query({text,pair,cards})→{cards,total}`.
- Text supports `-exclude` prefix. Searches source, target, and categories fields.

## 4M.15 PB-RENDER
Pure card-to-DOM. No storage. No globals.
- `renderRow(card)→element` — compact row for search results.
- `renderCard(card)→element` — full card per phrase-desk.html layout authority.
- IDs generated: `pbb-{id}`, `pbsrc-{id}`, `pbtgt-{id}`, `pb-bt-text-{id}`, `vg-{id}`, `vf-{id}`, `pbtags-{id}`, `pb-ti-{id}`, `pb-ts-{id}`, `drawer-tags-{id}`, `drawer-clarify-{id}`, `pb-cc-{id}`, `pb-ci-{id}`.

## 4M.16 PB-USAGE
Usage tracking. Core — not optional.
- `recordUse(cardId)→{cardId,usage,lastUsed}` — sets lastUsed, increments usage, sets updatedBy, calls PB-SYNC.markDirty().
- `getUsage(cardId)→{lastUsed,usage}`.
- Usage is what ranks cards and tells the PB/XL curation teams which phrases matter.

## 4M.17 LOG
Debug canary.
- `log(ev,d,l)` → appends to `#log-body`. `open()` | `copy()` | `clear()`.
- Every module logs through LOG. Event vocabulary is frozen (§LOGD).

---

# PART 5 — VERIFICATION RULES

## §IMM — 21 Immutable Functions
These 21 functions are byte-frozen. Never rewrite them. Wrap them behind module contracts if needed but the function body must remain byte-identical to bridge-turn06-base.html.

**Checksum method (exact — any variation produces a different hash):**
- Start: if async, segment begins at `async ` (include the prefix). If not async, begins at `function`. No leading whitespace.
- End: matching closing brace `}`, inclusive. No trailing characters.
- Encoding: UTF-8, LF line endings.
- Hash: sha256, first 12 hex chars.
- `setupPC` is async — its segment MUST begin `async function setupPC(`. This is the one most likely to be computed wrong.

| Function | sha12 | lines |
|---|---|---|
| startDeepgram | 3e7d074881ee | 121 |
| stopDeepgram | 0d613db74bd6 | 4 |
| reconcileDeepgramState | 547d58f9856a | 6 |
| translateWithRetry | 10bd043d9b5d | 30 |
| translate | f9bc542ee9bd | 17 |
| handleChatMsg | 5d52a117de0f | 29 |
| onDGFinal | d1febfbade02 | 52 |
| _loadFastText | f319ccd82033 | 42 |
| _detectLangAsync | 2cb5c7c20ba7 | 26 |
| getMicConstraints | 67f5f24d1cb5 | 3 |
| setCallPhase | b63d5239eb81 | 4 |
| bumpSessionEpoch | 653a51f24a8b | 5 |
| connectRelay | 1c773f9bdcf6 | 24 |
| relaySend | 74bf6900dfdd | 1 |
| resetRecoveryState | 22e933620913 | 7 |
| armConnectTimeout | 01f0aa37f1cf | 6 |
| setupPC | 5470a4ebb5b7 | 73 |
| rejoinCall | ff64962e7175 | 11 |
| showThankYou | 1908909747a1 | 17 |
| cleanUp | 099e2e7dbb66 | 17 |
| speakText | 4c90d18bbadb | 1 |

Tier-2 (may change ONLY at one named insertion point): `enterCall`, `hangUp`, `joinerProceed`, `createRoom`. Never wrap `enterCall` in async. One `<script>` block only.

## §AF — Atomic Module Format
No grep-and-replace. No editing live function bodies. Every module is a self-contained drop-in block:

```
/* ===== #new module: MODULE ===== */
/* checksum-before: <sha12 or 'n/a-new'> */
/* predict-after: <sha12>  delta: <±N lines> */

var MODULE = (function(){
  return {
    method: function(args){
      LOG.log('MODULE.method:in',{args});
      try{
        var out = /* body */;
        LOG.log('MODULE.method:out',{out:out});
        return out;
      }catch(e){
        LOG.log('MODULE.method:err',{in:{args},e:String(e)},'warn');
        return ERROR_SHAPE;
      }
    }
  };
})();

/* actual-after: <sha12> == predict? PASS/FAIL */
/* ===== #end module: MODULE ===== */
```

For replacing existing code: mark the old block with `#existing module`, checksum it, insert the new module beside it behind a CONFIG flag. Only after the device gate banks does the old marked block get stripped as a whole unit.

## §PDG — Pre-Device Gate (all must pass before phone is touched)
Run this script before any device test. All items must be green:

1. **Lint:** extract `<script>` block, run `node --check`. Must pass.
2. **Immutables:** recompute all 21 sha12 values. Must match §IMM table exactly.
3. **Log points:** for every public method, grep for `:in`, `:out`, `:err`. Each must appear.
4. **Switch wiring:** `grep -c "CONFIG.get('use.MODULE')"` == 1 per activated module.
5. **Called-but-missing:** every function called exists in the file.
6. **Line delta:** additive stages must not reduce line count.
7. **Fixtures:** norm.json, query.json, render.json deep-equal against live executed code.
8. **Version stamp:** internal version == this stage's declared output version.

## §RTR — Ready-to-Test Report
The doer emits this report before any device test. If any item is not PASS, the device test does not happen.

```
Stage: [name]
Version stamp: [version] — PASS/FAIL
Lint: PASS/FAIL
21 immutables: [list each, expected vs actual] — ALL PASS / [which failed]
Log points (all methods): PASS/FAIL
Switch wiring: PASS/FAIL
Line delta: expected [±N] actual [±N] — PASS/FAIL
Fixtures: norm PASS/FAIL | query PASS/FAIL | render PASS/FAIL
Version stamp: PASS/FAIL
OVERALL: CERTIFIED READY / NOT READY — [what failed]
```

## §LOGD — Log Event Dictionary (frozen)
Base emits 114 events (preserved, none renamed). New module events follow one pattern: `MODULE.method:in|out|err`. PB sync lifecycle (frozen exactly): `pbsync_pulled` | `pbsync_skipped_no_changes` | `pbsync_upload_completed` | `pbsync_upload_pending` | `pbsync_pull_err` | `pbsync_push_err`. Any event string not in the dictionary = reject.

## §CM — Change Manifest
Every stage ships a manifest: list of functions byte-identical to input (with sha12), functions new (with sha12), exact call sites changed (line, old→new). A function changed but not declared in the manifest = reject.

---

# PART 6 — BEHAVIORAL CASES A1–G6

These are the cases the user runs on the phone. Turn 07 Post-ship gate = all pass.

**A. Enter-in-source** (KEYDOWN, not onblur — onblur alone never fires on Enter)
- A1: type new source, Enter → target + BT populate, keyboard stays up.
- A2: Shift+Enter → newline, no commit.
- A3: edit existing source, Enter → re-translates target+BT, verdict resets per B rules.
- A4: blur without Enter → commit fires.

**B. Verdict reset** (conditional — only if text changed; never log pending→pending)
- B1: source changed, was good → pending; clarify gets "Was:<old>" + "good → pending" (2 entries).
- B2: source changed, was flag → pending; "Was:<old>" + "flag → pending" (2 entries).
- B3: source changed, was pending → stays pending; "Was:<old>" only (1 entry).
- B4: source NOT changed, was good → nothing (0 entries).
- B5: source NOT changed, was pending → nothing (0 entries).
- B6: tap Sounds Good → good; "pending → good" logged (1 entry).
- B7: tap Flag → flag; "<prev> → flag" logged (1 entry).

**C. Clarify input** (handler must end with el.focus() — missing = looks dead)
- C1: type note, Enter → entry appears "TB · time", input clears, cursor stays.
- C2: Shift+Enter → newline, no commit.
- C3: empty + Enter → nothing.
- C4: author shows "TB" capitalized.
- C5: × removes an entry.

**D. Tags**
- D1: type tag, Enter → pill with ×, input clears, focus retained.
- D2: tag logged to clarifyChain.
- D3: × removes pill, logs remove.
- D4: autocomplete from existing tags.

**E. Compose strip** (guard BOTH Enter AND send button — missing the send guard is the recurring regressor)
- E1: type text → × appears inside field's right edge.
- E2: clear → × gone.
- E3: type "/" → inline drawer opens on keystroke.
- E4: type ".." → becomes "/", same drawer.
- E5: type "/bank" + Enter → NOT sent; overlay opens searching "bank".
- E6: type "/bank" + tap SEND → NOT sent (send has same guard as Enter).
- E7: × during search → clears, closes drawer, refocuses.
- E8: normal chat + Enter/send → sends normally.

**F. Duplicate save**
- F1: save source+target+langs matching existing → no dup; toast "Already saved"; usage increments; lastUsed/updatedAt refresh.

**G. Sync lifecycle** (observable in debug log)
- G1: enter en-th call, file exists → `pbsync_pulled` in log; cards visible.
- G2: no file → toast "No shared phrasebook yet"; call connects.
- G3: no changes, hang up → `pbsync_skipped_no_changes` in log.
- G4: edit card, hang up → `pbsync_upload_completed` in log; new versioned file in GitHub.
- G5: close overlay while dirty → write-back fires immediately.
- G6: upload fails → `pbsync_upload_pending`; retries on reconnect → `pbsync_upload_completed`.

---

# PART 7 — UI ELEMENT MAP

Every element by surface. IDs marked NEW are created in the build turn noted. IDs in plain text already exist in base. A doer builds exactly these elements — no more, no fewer. An element not in this map = reject. A map element missing from the build = reject.

## Surface 1 — Room List `#room-list` (Turn 08 Ship; initiator only)
- `#rl-header` — app name. Static.
- `#rl-new-btn` — "+ New room". → Room Creation.
- `#rl-cards` — one card per `ROOM.listForOwner()`. Empty state: "Create your first room" + button.
- Per room card `#rlc-{roomId}`: name `#rlc-name-{roomId}` | last-message `#rlc-prev-{roomId}` | capability icon `#rlc-cap-{roomId}` | unread dot `#rlc-badge-{roomId}`. Tap → Thread. Long-press / ⋯ → Room Info.

## Surface 2 — Room Creation `#room-create` (Turn 08 Ship)
- `#rc-title` — "New room".
- `#rc-choice-chat` — "Chat only". → `ROOM.create('chat')`.
- `#rc-choice-call` — "Chat + Call". → `ROOM.create('chatcall')`.
- No name field. No language picker. Language comes from first-run setup only.
- `#rc-share`, `#rc-link`, `#rc-qr`, `#rc-copy` — appear immediately after choice. → system share.

## Surface 3 — Thread `#thread` (Turn 08 Ship)
- `#th-header`: other-party name `#th-name` | info `#th-info-btn` | call button `#th-call-btn` (chat+call rooms only — ABSENT from DOM in chat-only rooms).
- `#th-waiting` — initiator only, pre-join. Removed once joiner joins.
- `#th-msgs` — bubbles via THREAD. Speaker-centric. System markers via THREAD.postSystem.
- `#th-compose`: attach `#th-attach` | input `#th-input` | clear `#th-clear` | send `#th-send`. Plain chat only — no `/` PB-search behavior in Thread compose (that's Call surface only).

## Surface 4 — Call Screen (bridge engine, Turn 08 Ship)
Reuses base IDs verbatim. Not rebuilt:
- `#remote-video` | `#local-video` | control bar (mute, share, phrasebook `pbOpenOverlay`, camera, hang up `hangUp`) | transcript area | compose strip with `/` PB-search seam.
- **Hang-up change (Turn 08):** `hangUp` → `CALL.unmount()` → `THREAD.render(roomId)` + `THREAD.postSystem("call ended")`. Not `showThankYou`. (`showThankYou` stays byte-frozen; CALL.unmount owns the return route.)

### Phrasebook Overlay `#pb-overlay` (Turn 07 activation)
- Ribbon: pair label `#pb-ov-pair` | add `#pb-ov-add` | save `#pb-ov-save` | sync dot `#pb-ov-sync` | close `#pb-ov-close` | search `#pb-ov-search` + clear `#pb-ov-search-x`.
- Cards host `#pb-ov-cards` — zero state: full cards via PB-RENDER.renderCard; active search: rows via PB-RENDER.renderRow.
- Full card (per phrase-desk.html): `pbb-{id}`, `pbsrc-{id}` (editable, KEYDOWN→translate+BT), `pbtgt-{id}`, USE+TTS per side, `pb-bt-text-{id}` (always visible), verdict (Sounds Good / Flag), footer 3 icons (tags / clarify / trash), tag drawer `pbtags-{id}` / `pb-ti-{id}` / `pb-ts-{id}`, clarify drawer `pb-cc-{id}` / `pb-ci-{id}` (Enter commits + el.focus()).
- Row (search): source + TTS + ▶send | target + TTS + ▶send.

## Surface 5 — Room Info / Dispose `#room-info` (Turn 08 Ship)
- `#ri-created` | `#ri-cap` | `#ri-name` — read-only.
- `#ri-dispose` — destructive. → `#ri-confirm` (one confirmation) → `ROOM.dispose(id)`.

## Shared surfaces (base IDs, not rebuilt)
- Debug Log `#log-overlay` — header, Copy, Clear, Close, `#log-body`.
- Joiner landing `#joiner-landing` — lang pill, room name, flags, join button → `joinerProceed` (routes to Thread in Turn 08, not old call lobby).
- First-run setup — language, Deepgram key, TURN credentials. Only place these are entered.
- `#create-room-backdrop` — retired in Turn 08 Ship, replaced by Surface 2.

---

# PART 8 — FILE MAP AND INFRASTRUCTURE

## Repo paths
- Plan: `talkbridge/TALKBRIDGE-MASTER-PLAN.md`
- Graveyard: `talkbridge/TALKBRIDGE-GRAVEYARD.md`
- Fixtures: `talkbridge/fixtures/norm.json`, `query.json`, `render.json`
- Baselines: repo root (bridge-turn06-base.html, bridge-turn06-post-ship.html, etc.)
- Layout authorities: `phrase-desk.html` (PB cards), `test.html` (shell), `2vid.html` (shell reference)

## Fetch pattern
Always via GitHub Contents API (not raw URL — CDN can lag):
```
https://api.github.com/repos/acmeproducts/stuff/contents/{path}?ref=main
```
Base64-decode the `content` field. Verify sha256 and line count against ledger before proceeding.

## Infrastructure (never change)
- Relay: `wss://talk-signal.myacctfortracking.workers.dev/signal` (app: `talk-say-v1`)
- Cloudflare TURN token ID: `6ae776dc0b1df1b7ced8e6c4c6747e56`
- Deepgram STT key: `tb_dg_key` in localStorage
- GitHub PAT: `tb_gh_pat` in localStorage

## Version stamp rule
Every stage bumps the internal version string inside the HTML at two locations (comment + visible span). Input patch + 1 = output patch. Turn 07: v5.7.0 (base) → v5.7.1 (pre-ship) → v5.7.2 (ship) → v5.7.3 (post-ship). A build still showing the input version is not certifiable.

