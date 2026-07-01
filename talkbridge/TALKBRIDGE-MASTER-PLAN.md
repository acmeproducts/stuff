# TALKBRIDGE MASTER PLAN
**Version: 4.1 | 2026-07-01 | Governing document. Repo: github.com/acmeproducts/stuff, path: talkbridge/TALKBRIDGE-MASTER-PLAN.md**

---

# PART 0 — WHAT WE'RE BUILDING AND WHERE WE ARE

## The product
TalkBridge is a WhatsApp-style bilingual communication app. Two people — one who speaks English, one who speaks Thai — create a room, share a link, and can chat asynchronously and call with real-time translation when both are around. A shared phrasebook builds up over time per room. It installs to the home screen and reaches people even when closed.

## The macro use case (check every design decision against this)
I open the app. I tap to start a room. I don't enter the other person's name — the room doesn't require it. I decide right then what kind of room: chat-only, or chat + call. I get a link and a QR code. I send the link however is convenient — text, email, in person.

I don't have to stay in the room. The other person can open the link, land in the room, and leave me a message whenever they get to it. I see it when I next open the room. Neither of us needed an account.

If I made a chat+call room, either of us can start a call from inside it once we're both around. If I made chat-only, that's all it ever does — if I want calling later, I make a new room, I don't retrofit this one.

Eventually I have several rooms — one per relationship, each with its own phrasebook building up over time.

**The test against every UI decision:** does this still feel like "I made a room, here's a link, they'll get to it" — or does it start feeling like setting up an account on yet another app.

## UX philosophy — few choices, mostly non-destructive
- **Room creation has exactly one consequential choice: capability.** Chat-only or chat+call. No name entry, no settings, no setup screen before you get your link/QR.
- **Everything else is reversible or harmless.** The only two destructive actions in the whole app — disposing a room and hard-deleting a phrasebook card — are the only places a confirmation step belongs.
- **The call button is a single tap.** No call-setup screen. If a room allows calling, one button from the thread escalates.
- **No screen the person didn't ask for.** Never interrupt with a decision gate before letting them continue looking.

## Initiator / joiner asymmetry — core to how this works
- The **initiator** creates a room and distributes the link. They see a Room List of all rooms they've created.
- The **joiner** receives a link and lands in that single room's Thread. They never see the initiator's Room List or any other room.
- A joiner cannot create rooms from inside a joined session. To create rooms, a person must open the app fresh on their own and become an initiator.
- This asymmetry is enforced at the data/routing layer — a joiner's session cannot run a query that returns other rooms. Not just a hidden button.

## Room capability model
- Capability is set once at creation: **chat-only** or **chat+call**.
- It cannot be changed later. If you want calling and made a chat-only room, make a new room.
- In a chat-only room, the call button is **absent from the DOM entirely** — not hidden, not grayed out.
- A chat-only room never negotiates WebRTC at all.

## Room disposal policy
- Unjoined rooms expire after 30 days and are purged relay-side.
- Joined/active rooms never expire silently — only explicit initiator-driven disposal removes them.
- Disposal is a real relay-side cleanup: token retired, waiting flag cleared, room record purged. Not just hidden client-side.

## The five screens — no more, no fewer
1. **Room List** — initiator's home. Never shown to a joiner.
2. **Room Creation** — one choice: chat-only or chat+call. Immediate link+QR. No other setup.
3. **Thread** — chat, used by both. Call button present only in chat+call rooms. Joiner lands here directly.
4. **Call Screen** — bridge engine, reached only from a chat+call Thread.
5. **Room Info / Dispose** — read-only info + one destructive action with one confirmation.

## What exists today
- `bridge-turn06-post-ship.html` (v5.6.4) — working call engine, STT, translation, 17 dormant modules. The floor.
- `test.html` — shell architecture authority (room list, thread, async chat).
- `phrase-desk.html` — phrasebook card layout authority.
- `talkbridge/fixtures/` — norm, query, render fixtures.

## Road to done
```
Turn 07  PB activation — phrasebook working end-to-end on the phone
Turn 08  Shell merge + PWA — bridge engine inside test.html shell, installable, push notifications
Turn 09  Single translation path — chat and call share one normalization function
Turn 10  Token identity + multi-device — token is sole identity, two devices join same room
Turn 11  Presence + design + pilot — waiting indicator, disposal, design system, full regression → DONE
```

## Where we are right now
**CURRENT STAGE: Turn 07 / Base — PB-DATA activation**
T07 Pre-base: DONE. T07 Base: DONE, awaiting device test (bridge-turn07-base.html, v5.7.1, sha256 prefix 9b416c8597d7). T07 Pre-ship: NOT STARTED.

---

# PART 1 — DOER PROTOCOL

You build exactly ONE release, then STOP.

## Before you write any code
1. Read this entire document and the graveyard at `talkbridge/TALKBRIDGE-GRAVEYARD.md`.
2. Confirm the CURRENT STAGE in Part 0 and that the prior release is DONE in Part 2 STATUS LEDGER. If not DONE, stop.
3. Fetch the input file fresh from GitHub. Verify sha256 prefix and line count against the ledger. Mismatch → stop.

## Five-stage version numbering
Every turn N has five stages numbered v5.N.0 through v5.N.4:
- v5.N.0 = Pre-base (copy only, negative test)
- v5.N.1 = Base (foundational work, positive test)
- v5.N.2 = Pre-ship
- v5.N.3 = Ship
- v5.N.4 = Post-ship

Examples: T07 Pre-base=v5.7.0 (DONE), T07 Base=v5.7.1, T07 Pre-ship=v5.7.2, T07 Ship=v5.7.3, T07 Post-ship=v5.7.4. T08 Pre-base=v5.8.0, T08 Base=v5.8.1, etc.

No stage starts until the prior stage is confirmed on the phone and marked DONE in the ledger.

## §WF — Workflow (execute in order, never skip)
1. READ — quote the relevant Part 4 contract verbatim.
2. COMPREHENSION — answer: what does this module return on error? what does it log? what does it never do? Wrong answer → re-read, do not build.
3. GRAVEYARD SCAN — match → stop, report.
4. CHECKSUM BEFORE — sha12 of region being changed, or n/a-new.
5. PREDICT AFTER — state expected sha12 and line delta before writing.
6. INSERT — atomic module block (Part 5 §AF). Never edit a live function body.
7. VERIFY — actual sha12 must match predicted. Mismatch → revert, do not adjust.
8. BUILD LOG — module, before sha, predicted sha, actual sha, PASS/FAIL.
9. PRE-DEVICE GATE — Part 5 §PDG, all green before phone is touched.
10. DEVICE TEST — numbered test table from release spec. Red → §EXIT.

## §EXIT — Exit condition
Re-fetch last DONE file, re-run §WF from step 1. One retry only. Second red → EXIT. State what failed. Do not patch forward.

## Delivery
Push complete single-file HTML to repo root. Do not overwrite any DONE file. Update Part 2 STATUS LEDGER. Return file + build log + §RTR report. STOP.

If anything is ambiguous: stop, name the gap, name the section it belongs in.

---

# PART 2 — STATUS LEDGER

## CURRENT RUN
- RELEASE: Turn 07 / Base / PB-DATA activation
- STATUS: DONE — AWAITING DEVICE TEST
- OUTPUT: bridge-turn07-base.html, 4812 lines, sha256 prefix 9b416c8597d7, v5.7.1
- RTR REPORT: 21/21 immutables pass, lint clean, log points pass, switch wiring pass, +32 lines additive
- NOTES: Pre-base was missing from repo despite ledger saying DONE — doer banked it first. Doer retained legacy fields (relatedIntents, fingerprint, catalogIds etc) as load-bearing for existing features (O-Ring, Translation Memory, catalog filtering) rather than dropping them per the literal Base spec — those features have no migration stage yet in Turns 07-11. Version stamp corrected from v5.7.0 to v5.7.1 and pushed; verified by read-back against commit sha 34f338c77406f5ed60562e8461dd1a02d956ba2d.

## RUN HISTORY (append-only, newest first)
- 2026-07-01 T07 Base — DONE pending device test. bridge-turn07-base.html, 4812 lines, sha prefix 9b416c8597d7, v5.7.1. PB-DATA active, legacy fields retained as load-bearing, 21/21 immutables, lint clean.
- 2026-07-01 T07 Pre-base — DONE. bridge-turn07-pre-base.html = bridge-turn06-post-ship.html byte-identical. 4780 lines, sha prefix a73aecbf. Negative test pass.
- 2026-06-30 T06 Post-ship — DONE. v5.6.4, sha prefix a73aecbf, 4780 lines. Device gate pass.
- 2026-06-30 T06 Ship — DONE. v5.6.3. 21/21 immutables. Fixtures pass. Device gate pass.
- 2026-06-30 T06 Pre-ship — DONE. v5.6.2. 21/21 immutables. Device gate pass.




# PART 3 — TURN SPECS

## Rules that apply to every turn
- **Five stages, always, in order:** Pre-base → Base → Pre-ship → Ship → Post-ship.
- **Pre-base** = copy of prior turn's Post-ship, byte-for-byte. Negative test only.
- **Base** = foundational work for this turn. Everything else builds on it.
- **Each stage must have a testable gate.** Positive test where behavior changes; negative test where it must not.
- **No stage starts until the prior stage is confirmed working on the phone.**
- **Version stamp:** every stage increments the patch version. Input patch + 1 = output patch.
- **21 immutable functions** (Part 5 §IMM) stay byte-identical through every turn.
- **Highest-sequence file rule** (PB-SYNC): files named `phrasebook-{src}-{tgt}-{NNNN>=1000}.json`. Pull = fetch highest NNNN. WriteBack = highest + 1.
- **WriteBack is conditional:** only when dirty flag is set. If clean → log `pbsync_skipped_no_changes`, do nothing.

---

## TURN 07 — PB Activation
Input: bridge-turn06-post-ship.html (4780 lines, sha prefix a73aecbf).

### Pre-base — Status: DONE
**Deliver:** bridge-turn07-pre-base.html
**Work:** Copy bridge-turn06-post-ship.html byte-for-byte. No code changes.
**Test (negative):** Open on phone. Call connects, transcript works, PB overlay opens — identical to T06 post-ship. Any difference → stop.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn07-base.html, v5.7.1
**Work:** Activate PB-DATA. Wire old storage functions (pbGetCards, pbSaveCards, pbNorm) to redirect into PB-DATA. All callers now receive cards in the new canonical schema. Old fields stripped on load: catalogIds, intentId, fingerprint, relatedIntents, confidence, semanticRelationships, parentCategory, primaryTag. pbBubbleHtml (old renderer) stays live — PB-RENDER not active yet.
**References:** Part 4 §4M.12 (canonical schema). Part 5 §IMM.
**Test (positive):** Open on phone. Overlay shows cards via old renderer. Debug log shows PB-DATA.norm:in/out for each card. Card objects in log show categories[] not catalogIds. Call and transcript unaffected.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn07-pre-ship.html, v5.7.2
**Work:** Activate PB-SYNC and PB-USAGE.
- Wire PB-SYNC.pull(myLang, theirLang) into enterCall — fetches highest-versioned phrasebook-{src}-{tgt}-{NNNN>=1000}.json, replaces cache wholesale, no merge. Flag use.PB_SYNC → true.
- Wire PB-SYNC.writeBack() into hangUp and dirty overlay-close — conditional on dirty flag only. Clean → log pbsync_skipped_no_changes, do nothing.
- Wire PB-USAGE.recordUse(cardId) into pb-use action. Flag use.PB_USAGE → true.
- No PAT → {status:'no-pat'}, call connects. No file → toast "No shared phrasebook yet", call connects. Error → pbsync_pull_err, call connects.
- writeBack dirty: list /phrasebook/, next = highest + 1, PUT phrasebook-{src}-{tgt}-{NNNN+1}.json, log pbsync_upload_completed. Error → pbsync_push_err.
**References:** Part 4 §4M.13, §4M.16. Part 6 G1–G6.
**Test (positive — all six must pass):**
- G1: enter en-th call, file exists → pbsync_pulled in log; cards visible in overlay.
- G2: no file → toast "No shared phrasebook yet"; call connects.
- G3: no changes, hang up → pbsync_skipped_no_changes in log.
- G4: edit card, hang up → pbsync_upload_completed in log; new versioned file in GitHub.
- G5: edit card, close overlay → write-back fires immediately.
- G6: edit card, hang up offline → pbsync_upload_pending; restore network → pbsync_upload_completed.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn07-ship.html, v5.7.3
**Work:** Activate PB-QUERY, PB-RENDER, COMPOSE-SEAM. PB-RENDER.renderCard replaces pbBubbleHtml (removed). PB-RENDER.renderRow for search rows. PB-QUERY drives all search — one engine for both overlay and compose drawer. COMPOSE-SEAM: / and .. open slide-up drawer, guarded on BOTH Enter AND send button.
**References:** Part 4 §4M.14, §4M.15. phrase-desk.html. Part 6 A1–G6, E1–E8.
**Test (positive):**
- Cards show source, target, back-translate, verdict pills, footer icons, tag drawer, clarify drawer per phrase-desk.html.
- Overlay search → rows; clear → cards return.
- /bank + Enter in chat → NOT sent; overlay opens searching "bank".
- /bank + tap Send → NOT sent.
- Normal message → sends normally.
- All A1–G6 pass.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn07-post-ship.html, v5.7.4
**Work:** pbAddCard wired; duplicate save (F1); all edge cases closed.
**Test:** Full A1–G6 + G1–G6 on device. Input to Turn 08 Pre-base.

---

## TURN 08 — Shell Merge + PWA
Input: bridge-turn07-post-ship.html.

The merge approach (from GT-WA v2.3 §7.7):
1. test.html becomes the base file — the shell that hosts everything.
2. Bridge's call engine is extracted as a self-contained module: WebRTC setup/teardown, recovery state machine, call-screen UI, phrasebook overlay. Bridge's lobby/goodbye screens are discarded — the shell's Room List and Thread replace those roles.
3. Both shell and call engine share one translation path (reconciled here, formalized in Turn 09).
4. Bridge's old pairKey name-concatenation is deleted. Room/token from the shell is the single identity.
5. Two distinct views built off one room data model: Room List (owner only) and Thread (owner + joiner). Routing enforced at data layer — joiner session cannot query other rooms.
6. Call button → mount call module → hang up → unmount → return to Thread with "call ended" marker.
7. Room capability flag is a real gate, not styling. Call module conditionally absent from DOM in chat-only rooms.

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn08-pre-base.html
**Work:** Copy bridge-turn07-post-ship.html byte-for-byte.
**Test (negative):** Identical to T07 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn08-base.html, v5.8.0
**Work:** Activate the nine engine modules — CONFIG, LOG, STORE, RELAY, RTC, STT, TRANSLATE, LANGDETECT, NORMALIZE — in one pass. Old hardcoded paths removed. Service worker registered; app installable.
**References:** Part 4 §4M.1–§4M.8. Part 5 §IMM.
**Test (positive):** Call connects, transcript appears, translation correct — now through modules. Debug log shows module events. App installs to home screen.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn08-pre-ship.html, v5.8.1
**Work:** Shell merged. Five screens live per the five-screen inventory (Part 0). Initiator → Room List. Joiner → Thread directly, no Room List visible, no path to Room Creation. Room capability gates call button presence in DOM. Hang-up → Thread + "call ended" marker.
**References:** Part 7 (UI element map). test.html, 2vid.html.
**Test (positive — GT-WA §7.8 acceptance criteria):**
- Create chat-only room → link/QR immediately → Thread has no call button anywhere in DOM.
- Create chat+call room → link/QR immediately → Thread has visible call button.
- Joiner opens link → lands in Thread directly, no setup, message history visible.
- Joiner cannot reach Room List or Room Creation by any means (URL editing, back button, navigation).
- Initiator opens app fresh → Room List shows all created rooms.
- Call in chat+call room → connects → hang up → Thread shows "call ended" marker, not goodbye screen.
- PB works inside call.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn08-ship.html, v5.8.2
**Work:** Push notifications wired to correct room Thread. Dispose flow: confirmation → relay-side cleanup (token retired, waiting flag cleared, room purged — not just hidden). Room Info screen complete.
**Test (positive):**
- App backgrounded → notification → opens correct Thread.
- Dispose → one confirmation → room gone from Room List, relay cleaned up, join link returns error.
- Two-device full call: Galaxy initiator + iPhone joiner, translation + PB both work.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn08-post-ship.html, v5.8.3
**Work:** Full regression. All T07 A1–G6 + G1–G6 pass inside merged app. Edge cases.
**Test:** Full two-device regression all surfaces. Input to Turn 09 Pre-base.

---

## TURN 09 — Single Translation Path
Input: bridge-turn08-post-ship.html. (GT-WA v2.3 §Turn 08 — language normalization in the call path.)

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn09-pre-base.html. Copy T08 post-ship byte-for-byte.
**Test (negative):** Identical to T08 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn09-base.html, v5.9.0
**Work:** NORMALIZE is sole translation entry for chat AND call. Z→X→Y at one shared place. Dead parallel routes removed.
**Test (positive):** Speak → correct. Type → correct. Third language → routes through your preferred language first. Original never shown. One log event per translation.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn09-pre-ship.html, v5.9.1
**Work:** PB card send, use, search all through NORMALIZE. No duplicate events.
**Test (positive):** Send PB card → one translation event in log. Chat and call translation log shape identical.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn09-ship.html, v5.9.2
**Work:** All dead routes removed. Full regression.
**Test:** Full A1–G6 + G1–G6. Every translation → exactly one event through NORMALIZE.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn09-post-ship.html, v5.9.3
**Work:** Edge cases. Input to Turn 10 Pre-base.

---

## TURN 10 — Token Identity + Multi-device
Input: bridge-turn09-post-ship.html. (GT-WA v2.3 §Turn 09/10.)

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn10-pre-base.html. Copy T09 post-ship byte-for-byte.
**Test (negative):** Identical to T09 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn10-base.html, v5.10.0
**Work:** Token is sole identity. pairKey name-concatenation fully removed. Room ownership, joiner recognition, routing all keyed on token only.
**Test (positive):** Create room on Galaxy, open join link on iPhone → recognized as joiner by token. Debug log shows no name-derived routing anywhere.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn10-pre-ship.html, v5.10.1
**Work:** Two-device chat sync. Messages from either device appear on both Threads in real time.
**Test (positive):** Galaxy sends → iPhone sees it. iPhone sends → Galaxy sees it. Both speaker-centric.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn10-ship.html, v5.10.2
**Work:** Cross-device call. Ring on second device. Answer from either.
**Test (positive):** Galaxy in room → iPhone joins → Galaxy calls → iPhone rings → answer → call connects with translation both directions.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn10-post-ship.html, v5.10.3
**Work:** Drop mid-call, rejoin, re-create edge cases. Full regression. Input to Turn 11 Pre-base.

---

## TURN 11 — Presence + Design + Pilot
Input: bridge-turn10-post-ship.html. (GT-WA v2.3 §Turn 11 + §Turn 12/13/14.)

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn11-pre-base.html. Copy T10 post-ship byte-for-byte.
**Test (negative):** Identical to T10 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn11-base.html, v5.11.0
**Work:** Relay presence contract live. Disposal policy: unjoined rooms expire 30 days, joined rooms never silently expire, dispose retires token + purges relay. Waiting indicator in Thread for initiator pre-join, survives backgrounding.
**Test (positive — GT-WA §Turn 11 acceptance criteria):**
- A messages B while B offline → waiting flag set relay-side.
- B opens app → flag retrieved and cleared.
- Room created, never joined, window elapses (test with shortened window) → purged from relay.
- Active joined room, long idle → persists, no silent expiry.
- Dispose → confirmation → token retired, no orphaned relay state, join link returns error.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn11-pre-ship.html, v5.11.1
**Work:** All hardcoded color/size/spacing → CONFIG token keys. Two independent persisted axes: font scale and theme preset.
**Test (positive):** Change font size → all surfaces larger. Change theme → all surfaces recolor. Reset one → other unchanged. Close and reopen → both persist. Default settings look identical to prior release.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn11-ship.html, v5.11.2
**Work:** Push notifications when app fully closed. Unread counts + last-message preview in Room List live. Design consistent across all five surfaces and PB.
**Test (positive):** Force-close app. Message arrives. Notification → correct Thread opens. Unread dot → read → clears. All surfaces visually coherent.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn11-post-ship.html, v5.11.3
**Work:** Full regression T07–T11, Galaxy + iPhone. GT-WA §Turn 14 pilot criteria: full lifecycle (create → capability → invite → joiner lands → async message → call if applicable → second device → closed → notified → reopened). Configurability proof: change theme/font/labels/capability via CONFIG, no code rebuild.
**Test (positive — GT-WA §Turn 14 acceptance criteria):**
- Every step of full lifecycle holds on real devices.
- Chat-only room: no call affordance anywhere in that room's UI.
- All T07–T11 test suites pass cumulatively.
- CONFIG change reshapes app without touching code. **DONE.**


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
Every stage bumps the internal version string inside the HTML at two locations (comment + visible span). Input patch + 1 = output patch. Turn 07: v5.7.0 (pre-base) → v5.7.1 (base) → v5.7.2 (pre-ship) → v5.7.3 (ship) → v5.7.4 (post-ship). A build still showing the input version is not certifiable.

