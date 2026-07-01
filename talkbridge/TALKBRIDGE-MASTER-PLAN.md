# TALKBRIDGE — BUILD PLAN: STAGES × MODULES × SURFACES
## turn06-base → finished configurable WhatsApp-with-translation. Every stage names the module contracts it builds and the user-facing behavior it delivers.
**Version: 2.7 | 2026-06-30 | Master build plan. Source of truth in GitHub: raw.githubusercontent.com/acmeproducts/stuff/main/talkbridge/TALKBRIDGE-MASTER-PLAN.md**

---

# START HERE — DOER PROTOCOL (read this first; this link is your entire instruction)

You are the DOER. You build exactly ONE stage of this plan, then STOP. You do not manage scope, you do not improvise, you do not grep. Everything you need is in THIS document — if something is genuinely not here, STOP and name the gap; do not fill it with a guess.

## CURRENT STAGE (the only thing to build right now)
**Turn 07 → Pre-ship → PB ENGINE ACTIVATION.** Flip PB-DATA, PB-SYNC, PB-USAGE live at their call sites in bridge-turn06-post-ship.html (the banked Turn 07 Base). Old schema paths deleted. Pull on enterCall, write-back on hangUp+dirty-close. Gate: pbsync_pulled in log; cards in overlay; usage increments; pbsync_upload_completed on hangup when dirty; G1–G6 pass on device. Input: bridge-turn07-pre-base.html (= bridge-turn06-post-ship.html, already banked). Output: bridge-turn07-pre-ship.html. Version stamp: v5.7.1. Do not advance CURRENT STAGE — manager gates each stage.

**REMEDIATION (read before building):** A prior run produced `bridge-turn07-pre-ship-r1.html`, which flipped CONFIG only. That content was deterministically verified correct, but it was built BEFORE Turn 07's Base was a confirmed, banked, gated release in the ledger — that is a sequence violation (every turn always has a Base release; never start Pre-ship before Base is banked) and is now logged in the graveyard as G15. Do not repeat it: confirm the CURRENT STAGE / prior stage is BANKED in the ledger before starting any new work, every time, no exceptions. The fix for the CONFIG content itself is NOT a rebuild from scratch — take r1, ADD the LOG module flip on top of it (same workflow: checksum-before/predict-after, atomic marked block, §H wrapper), producing the complete Group 1 release. Output as `bridge-turn07-pre-ship-g1.html`. Device-test Group 1 as one combined release — do not ask for a device test of CONFIG alone.

## YOUR EXACT STEPS
1. Read this entire document. Then read the graveyard: https://raw.githubusercontent.com/acmeproducts/stuff/main/talkbridge/TALKBRIDGE-GRAVEYARD.md
2. Fetch the baseline: https://raw.githubusercontent.com/acmeproducts/stuff/main/bridge-turn06-base.html — verify 3940 lines and sha256 begins 0b21ffdeeadb5db9. Mismatch → STOP (graveyard G4). This file is read-only; never edit it in place.
3. Execute the PART VI §VI-1 WORKFLOW in order for the current stage: READ (quote the relevant PART I §4M contracts verbatim) → COMPREHENSION (§VI-3) → GRAVEYARD SCAN (§VI-6; grep is dead, atomic marked drop-in only) → CHECKSUM BEFORE / PREDICT AFTER → INSERT atomic marked modules with the §H entry/exit/error wrapper → CHECK actual vs predicted (mismatch → REVERT) → BUILD LOG → READY-TO-TEST REPORT (§VI-4).
4. Honor the DORMANT-STAGE GATING PRINCIPLE: everything you build is dormant (every CONFIG use.* flag false; old code untouched and live; behavior byte-identical to base). The 21 immutable functions (§B) stay byte-identical. One <script> block. Never wrap enterCall async.
5. Produce a COMPLETE single-file HTML (no fragments, ever), the build-log, and the §VI-4 ready-to-test report.

## DELIVERY
The build ARTIFACT (the .html) and its device promotion are handled by the gating side — you do not push the build to main or over base. But you DO record your outcome in the STATUS LEDGER below: if you have a repo token, write your outcome into the ledger and push ONLY this plan document; if you have no token, output the exact ledger text plus the complete file + build-log + report, and the manager writes the ledger and handles the build artifact. Either way: return the complete file, build-log, and ready-to-test report, update the ledger, then STOP. Do not start the next stage, merge to main, or touch base.

## IF ANYTHING IS AMBIGUOUS
STOP and list the exact gap with the section it should have been in. Do not decide it yourself. A correct STOP is success; a guess is the failure mode this whole document exists to prevent.

---

# STATUS LEDGER (the doer WRITES here every run; the manager READS here; the tester never relays)

This document is the shared channel. The doer does not send messages to anyone — it UPDATES this ledger and pushes the document. The manager reads this ledger and brings the human only the gating decision. The human talks only to the manager.

## DOER PROTOCOL FOR THIS LEDGER
At the END of every run, before stopping, the doer overwrites the CURRENT RUN block below with one of three outcomes, then pushes the document to GitHub (the doer DOES have the repo path; if it lacks a token it appends the outcome and flags NO-TOKEN so the manager pushes):
- **SUCCESS** — stage built, §VI-4 report all-green. Paste the full ready-to-test report. Set DISPOSITION: AWAITING-GATE.
- **RETRY** — first device/deterministic attempt failed; rebuilt from clean baseline per §VI-2. State what failed and that a clean-baseline retry was produced. Set DISPOSITION: AWAITING-GATE (retry build).
- **EXIT** — retry also failed, or a graveyard match was found. State the §VI-2 exit reason in full (which change, which step, checksum divergence, red cases, graveyard match). Set DISPOSITION: EXIT — NO FURTHER ATTEMPTS. Append the new failure to the graveyard.

The doer also updates CURRENT STAGE at the top: on a banked SUCCESS that the manager has gated-pass, the stage advances; the doer never advances it itself.

## CURRENT RUN
- STAGE: Turn 07 / Pre-ship / Engine activation
- ATTEMPT: (none yet)
- DISPOSITION: NOT STARTED
- READY-TO-TEST REPORT: (none yet)
- NOTES / GAPS / EXIT REASON: (none yet)

## RUN HISTORY (append-only; newest first)
- 2026-06-30 Turn 07 / Base — BANKED. bridge-turn07-pre-base.html confirmed checksum-identical to banked Turn 06 Post-ship: 4780 lines, sha a73aecbfd2c2. No rebuild, no new device test (content already device-gated as Turn 06 Post-ship). Verified by manager. Input to Pre-ship.
- 2026-06-30 Turn 06 / Post-ship / PB UI group — BANKED. 4 dormant additions (PB-SYNC pull/writeBack/markDirty/isDirty, PB-USAGE recordUse/getUsage, PB-RENDER.renderCard, PB overlay surface markup), all 17/17 modules now present, 17/17 use.* false, 21/21 immutables untouched (enterCall confirmed pre-existing async, not newly wrapped), single <script> block, lint clean, purely additive diff vs Ship baseline (only the v5.6.3→v5.6.4 version-stamp lines changed otherwise), +274 lines, v5.6.4, sha a73aecbf. renderCard fixture (talkbridge/fixtures/render.json) verified by structural assertion: wrap id/class, 6 children, all 5 child ids and 7 drawer ids present and correctly generated. Deterministic gate green (verified independently by manager); device gate pass (tester). NOTE: the doer's first push to this plan document overwrote it to 0 bytes (destructive — file content lost, ledger included); manager detected via API readback, reverted to last-good commit by sha, then re-applied this banked entry on top of the restored document. Build artifact itself (bridge-turn06-post-ship.html) was unaffected and verified independently — see checks above.
- 2026-06-30 Turn 06 / Ship / Core UI + shared search seam — BANKED. 7 modules dormant (ROOM, THREAD, CALL, PB-DATA, PB-QUERY, PB-RENDER.renderRow, COMPOSE_SEAM), 17/17 use.* false, 21/21 immutables, fixtures pass, +310 lines additive, v5.6.3, sha bf14bd59. Deterministic gate green; device gate pass (tester).
- 2026-06-30 Turn 06 / Pre-ship / Engine group — BANKED. 9 engine modules dormant (CONFIG, LOG, STORE, RELAY, RTC, STT, TRANSLATE, LANGDETECT, NORMALIZE), all use.* false, 21/21 immutables (incl. setupPC async), lint clean, single <script>, behavior identical to base, v5.6.2. Deterministic gate green; device gate pass (tester). Plan defects fixed in-flight: §B async-prefix method (v2.0), mandatory version stamp (v2.1).

---


Process: every turn = pre-base → base → pre-ship → ship → post-ship. BASE STAGE (every turn, not just Turn 06): the prior turn's banked post-ship file, copied forward under this turn's pre-base name, IS this turn's base — a checksum-verified, byte-identical floor. The Base gate is NOT a rebuild and NOT a new device test (the content already passed its device gate as the prior turn's post-ship): it is the doer/manager confirming, by full-file sha256 and line count, that pre-base == the prior turn's banked post-ship exactly. Mismatch → STOP, wrong input, do not proceed to Pre-ship. Only after Base is confirmed does Pre-ship begin. Each stage ends in a USER TEST gate on the phone; banks only on pass; next stage starts only from a banked stage. Modules built parallel beside working code, switched one surface at a time after device confirmation. Immutable engine (startDeepgram/stopDeepgram/reconcileDeepgramState, translate/translateWithRetry, onDGFinal, handleChatMsg, _loadFastText/_detectLangAsync, RELAY_*, all WebRTC/recovery/relay) is wrapped behind a contract, never rewritten. One change → lint → verify → next. Roll back on failure, never patch forward.

**Contract rules (every module):** exposes only its listed methods; in/out fixed once frozen; every method logs `{module}_{op}{in,out}` to LOG and swallows nothing; reads only its inputs + CONFIG, never another module's internals or page globals.

---

# PART I — MODULE CONTRACTS (§4M) + CONFIGURATION LAYER (§4C)

# 4M. MODULE ARCHITECTURE — THE ENTIRE APP (immutable in/out contracts)

The whole application is modular. Not just the phrasebook — every aspect. The reason is non-negotiable: the app must become CONFIGURABLE, and it cannot be configurable until every part is a module that reads its behavior from a config layer (§4C) instead of hardcoding it. Until modularized, nothing can carry forward parameters that drive look, feel, and operation. This is the spine. Everything is built strictly against these contracts; nothing reaches into another module's internals or into globals.

**Contract rules (apply to every module below):**
- Each module exposes only its listed methods. Inputs and outputs are fixed once frozen and do not change.
- Every public method catches all exceptions and logs `{module}_{op} {in, out}` to the debug log; nothing is swallowed silently.
- A module never reads another module's private state or page globals — only the config layer (§4C) and the explicit inputs it's handed.
- Modules are built beside existing code, proven in isolation, switched in one surface at a time after device confirmation. Never grep-replace live.

**4M.1 CONFIG** — owns all configurable parameters; every other module reads from it.
- get(key) → value | getAll() → object | set(key,value) (persisted) | subscribe(fn) for live re-render.
- Owns: theme tokens (colors, spacing, radii), font size, language defaults, feature flags (e.g. room capability defaults), copy/labels, timing constants. This is what makes the app configurable and white-labelable.

**4M.2 STORE** — sole owner of persistence (localStorage + relay-side state handles).
- get(key)/set(key,value)/remove(key); namespaced. No other module touches localStorage directly.

**4M.3 RELAY** — signaling transport. send(msg)/onMessage(fn)/connect()/close()/status(). (Engine; frozen functions live here.)

**4M.4 RTC** — WebRTC engine + recovery state machine. start(roomCtx)/stop()/onState(fn). Invokable and tear-down-able cleanly; not entangled with page state.

**4M.5 STT** — Deepgram. start()/stop()/onFinal(fn)/reconcile(reason).

**4M.6 TRANSLATE** — MyMemory + retry. translate(text,src,tgt)→text | backtranslate(...)→text. One shared path for chat and call (Turn 08 depends on this).

**4M.7 LANGDETECT** — fastText. detect(text)→lang. (Engine; frozen.)

**4M.8 NORMALIZE** — the Z→X→Y chat rule, the single shared normalization fn for chat and call. normalize(text, userPref, partnerLang) → {display, sent}; original Z never surfaced.

**4M.9 ROOM** — room lifecycle + the initiator/joiner data model. create(capability)→room | join(token)→roomView | dispose(id) | listForOwner()→rooms (owner only) | get(id). Capability fixed at creation; owner-scoped queries enforced here so a joiner can't enumerate other rooms.

**4M.10 THREAD** — chat thread render + message log. render(roomId) | append(msg) | postSystem(marker). Speaker-centric display.

**4M.11 CALL** — the call surface (mounts RTC+STT+TRANSLATE+PB overlay). mount(roomCtx)/unmount(); on unmount returns control to THREAD with a "call ended" marker. Present only for chat+call rooms (gated by CONFIG/ROOM capability).

**4M.12 PB-DATA** — sole owner of phrasebook cards. getCards()/getLive()/byId(id)/save(cards)/norm(raw)→Card. Canonical schema: id, source, target, sourceLang, targetLang, categories[] (default ['unassigned']), createdBy, updatedBy, createdAt, updatedAt, lastUsed, usage, backtranslate{sourceLang,targetLang,inputText,resultText,verdict (default 'pending'),contentHash,updatedAt}, clarifyChain[]. DROPS catalogIds, confidence, semanticRelationships, parentCategory, primaryTag, relatedIntents. GH is source of truth; load REPLACES cache (no merge).

**4M.13 PB-SYNC** — versioned GH pull/push. pull(src,tgt)/writeBack() — highest version wins, conditional on dirty, pending/completed status.

**4M.14 PB-QUERY** — search/filter. query({text,pair})→{cards,total}. One engine for inline ribbon and overlay.

**4M.15 PB-RENDER** — pure card→DOM. renderRow(card) | renderCard(card). No storage, no globals.

**4M.16 PB-USAGE** — usage tracking. CORE, not optional: it is the context that makes the phrasebook meaningful. recordUse(cardId) sets lastUsed + increments usage + sets updatedBy; getUsage(cardId). Usage is what ranks cards, surfaces them, and tells PB/XL teams which phrases matter for curation. A phrasebook without usage is a dead list. (Only PB Central LIVE TELEMETRY — a real-time external event pipe — is out of scope; local usage tracking on the card is core and in scope.)

**4M.17 LOG** — the debug canary. log(ev,d,l) → debugLog[] → #log-body; open/copy/clear. Every module logs through this.

# 4C. THE CONFIGURATION LAYER (why modularization is mandatory)

Once every module reads from CONFIG (§4M.1) instead of hardcoding, the app becomes configurable end to end: theme/font/look-and-feel (Turn 12 design system + Turn 10 readability axes plug straight in), feature flags, default room capability, labels/copy for white-labeling, and operational constants — all driven by carried-forward parameters, none requiring a rebuild. This is the payoff of the module discipline and the reason it is not optional: the program cannot be made configurable until it is modularized, and it cannot scale or be white-labeled until it is configurable.

---
---

# TURN 06 — Modularize the app + complete the phrasebook
Input: bridge-turn06-base.html v5.6.1. Output: bridge-turn06-post-ship.html.

## Base — THE FLOOR (already banked; read-only input)
bridge-turn06-base.html v5.6.1. Contains all prior pre-base work (WebRTC flapping fixes etc.). No stage rebuilds it. The next unbuilt stage is Pre-ship. All modules below are delivered DORMANT (present, marked, checksummed, every CONFIG use.* flag false, old code untouched and live, behavior byte-identical to base). Activation (flip new on / old off, one at a time, device-gated) is the job of the turns/releases AFTER all three groups are banked. VERSION STAMP (mandatory each stage): every stage bumps the file's internal version stamp. Turn 06: base=v5.6.1 (input) → Pre-ship output=v5.6.2 → Ship output=v5.6.3 → Post-ship output=v5.6.4. The doer MUST update the version string inside the HTML to the stage's output version; a build still showing the input version is NOT certifiable. General rule: output version = input patch +1 within a turn; a turn's post-ship is the next turn's input. DORMANT-STAGE GATING PRINCIPLE: a dormant module cannot be exercised on the phone (its flag is off). Each Turn 06 stage therefore has TWO gates — a DETERMINISTIC gate (fixtures + §VI-4 report prove the dormant modules are correct in isolation) and a DEVICE gate (the user confirms only that the app still behaves EXACTLY like base). Active-behavior device cases (A1–G6) belong to the ACTIVATION turns (07+), not Turn 06. The 21 immutable functions stay byte-identical; one <script> block; never wrap enterCall async. Build order within a stage per §F.

## Pre-ship — ENGINE GROUP (foundational modules, dormant) → output bridge-turn06-pre-ship.html v5.6.2
Deliver these nine as atomic marked blocks with the §H wrapper, all dormant:
CONFIG, LOG, STORE, RELAY, RTC, STT, TRANSLATE, LANGDETECT, NORMALIZE (signatures in §4M; engine modules wrap the immutable fns unchanged).
SURFACE: none; inert. GATE: call, transcription, translation, recovery, chat Z→X→Y identical to base, zero regression; §VI-4 report (9 present, 3 log points each, 21 immutables intact, all use.* false). Bank → input to Ship.

## Ship — CORE UI + SHARED SEARCH SEAM (dormant) → output v5.6.3
The compose strip, its slide-up search drawer, the search query, and the row renderer are a SHARED layer: the non-PB chat/transcript strip is not whole without them, AND the PB surface reuses the identical query + row renderer. They are delivered here, not in PB UI, because they straddle the boundary. Search needs data, so PB-DATA is delivered here too (the foundation the query reads). Modules, dormant, atomic/marked/§H-logged:
- ROOM create/join/listForOwner/get/dispose
- THREAD render/append/postSystem
- CALL mount/unmount
- PB-DATA getCards/getLive/byId/save/norm (canonical schema in §4M.12) — the data the shared search reads
- PB-QUERY query({text,pair})→{cards,total} — ONE engine for the inline drawer AND the PB surface
- PB-RENDER.renderRow(card)→el — the row renderer reused by the inline drawer AND the PB surface (renderCard stays in Post-ship)
- the compose strip dual chat/search behavior + slide-up search drawer (the "/" and ".." seam): the strip is core chat; its search predicate, drawer, and results are the shared seam. Guards on Enter AND send so a predicate never reaches the transcript.
FIXTURES (authored HERE, where their modules land): the doer authors fixtures/norm.json (PB-DATA.norm), fixtures/query.json (PB-QUERY), fixtures/render.json renderRow cases (PB-RENDER.renderRow), submitted for gating review per §N before they are the gate.
SURFACE: none changes; all inert. TWO GATES (a dormant module is NOT phone-tested — its flag is off): (1) DETERMINISTIC gate — fixtures norm.json/query.json/render.json (§N/§O) prove PB-DATA.norm, PB-QUERY.query, and PB-RENDER.renderRow produce expected output; §VI-4 report (modules present, 3 log points each, immutables intact, all use.* false). (2) DEVICE gate — the only thing the user verifies on the phone is that the app behaves EXACTLY like base (create/join, transcript, enter-call/hang-up unchanged; engine group intact). Bank → input to Post-ship.

## Post-ship — PB UI GROUP (PB-exclusive modules + surface, dormant) → output bridge-turn06-post-ship.html v5.6.4
The pieces that ONLY the phrasebook uses, consuming the shared layer already delivered. Dormant, atomic/marked/§H-logged:
- PB-SYNC pull/writeBack
- PB-USAGE recordUse/getUsage
- PB-RENDER.renderCard(card)→el — the full card (rows already shipped in the shared seam)
- the PB overlay surface (ribbon, pair label, +, sync dot, close; zero-state = full cards, active search = shared rows)
SURFACE: none changes; inert. TWO GATES (dormant): (1) DETERMINISTIC — renderCard fixture (added to render.json) proves the full card; §VI-4 report. (2) DEVICE — app behaves EXACTLY like base; engine + core-UI + shared-search intact. (Fixtures norm/query/render were authored in Ship where their modules landed; Post-ship only ADDS the renderCard case.) Bank → bridge-turn06-post-ship.html = all 17 modules present, dormant, behavior identical to base, with the shared search seam correctly placed for reuse. Input to Turn 07.

# TURN 07 — Shell: the five surfaces (ACTIVATION turn + new module work)
Input: copy bridge-turn06-post-ship → bridge-turn07-pre-base. Output: bridge-turn07-post-ship.html.
This is the first ACTIVATION turn: the dormant modules from Turn 06 get switched on, old paths off, one at a time, AND the shell surfaces are built. Same four-stage spine per turn (Base → Pre-ship → Ship → Post-ship).

## Base — THE FLOOR (checksum-verified, not rebuilt)
bridge-turn07-pre-base.html = bridge-turn06-post-ship.html, copied forward byte-for-byte. GATE: full-file sha256 and line count of pre-base match the banked Turn 06 Post-ship record (4780 lines / sha prefix a73aecbf) exactly. No new device test — this content already passed its device gate as Turn 06 Post-ship. Mismatch on sha or line count → STOP, wrong input, do not start Pre-ship. Bank → input to Pre-ship.

- **Pre-ship — PB ENGINE ACTIVATION.** Flip PB-DATA, PB-SYNC, PB-USAGE live — new centralized GitHub schema only, old schema paths deleted. Pull on `enterCall` (src=myLang, tgt=theirLang), replace cache wholesale (no merge), write-back on hangUp+dirty-close. GATE (device): `pbsync_pulled` in log on call start; cards present in overlay; usage increments on use; `pbsync_upload_completed` in log on hangup when dirty. G1–G6 pass.
- **Ship — PB CORE UI ACTIVATION.** Flip PB-QUERY, PB-RENDER live; COMPOSE-SEAM live at its one call site. Cards show in overlay, search works in drawer and overlay, PB-RENDER.renderCard is the only card renderer. GATE (device): overlay shows cards from pull; search filters correctly; card sent to chat lands correctly; compose `/` search opens drawer and is guarded on Enter AND send.
- **Post-ship — PB BEHAVIORS.** All A1–G6 cases pass. Enter-in-source KEYDOWN; conditional verdict reset; clarify focus; dedup; pbAddCard. Merge to main.

# TURN 08 — Shell merge: test.html + bridge + PWA
Input: copy turn07-post-ship → bridge-turn08-pre-base. Output: bridge-turn08-post-ship.html.
BASE STAGE: bridge-turn08-pre-base.html must be checksum-verified byte-identical to the banked Turn 07 Post-ship file before this turn's Pre-ship begins. No rebuild, no new device test.
- **Pre-ship — ENGINE ACTIVATION (all remaining modules + PWA foundation).** Flip CONFIG, LOG, STORE, RELAY, RTC, STT, TRANSLATE, LANGDETECT, NORMALIZE all live — one pass, old paths deleted immediately. Service worker registered; app installable to home screen. GATE: call connects through modules; transcript appears; app installs on phone.
- **Ship — SHELL MERGE.** test.html is the host. Bridge call engine drops in as a screen navigated to from thread. Room List (initiator), single-room view (joiner), Room Creation (one choice: chat-only vs chat+call), Thread, Call mount/return. Call button present only in chat+call rooms. Push notifications wired to correct room. GATE: create both room types; joiner asymmetry holds; call escalates and returns to thread; notification opens correct room; PB works inside call.
- **Post-ship — polish + regression.** All Turn 07 PB cases pass inside merged app. Joiner cannot reach room creation. Dispose confirmation. Merge to main.

# TURN 09 — One shared translation path
Input: copy turn08-post-ship → bridge-turn09-pre-base. Output: bridge-turn09-post-ship.html.
BASE STAGE: checksum-verified byte-identical to banked Turn 08 Post-ship. No rebuild, no new device test.
- **Pre-ship:** NORMALIZE is the single translation entry for chat AND call. GATE: spoken + typed translation identical; Z→X→Y in both paths.
- **Ship:** PB use/send/search feed the same path. Dead translation routes removed. GATE: type/speak any language → correct output both sides; original never shown.
- **Post-ship:** LOG shows one path per translated message. Merge to main.

# TURN 10 — Token addressing + multi-device
Input: copy turn09-post-ship → bridge-turn10-pre-base. Output: bridge-turn10-post-ship.html.
BASE STAGE: checksum-verified byte-identical to banked Turn 09 Post-ship. No rebuild, no new device test.
- **Pre-ship:** token is sole identity; residual name-derived identity audited out.
- **Ship:** multi-device chat join; cross-device call rings/answers.
- **Post-ship:** edge cases (drop mid-call, rejoin). Merge to main.

# TURN 11 — Presence, waiting, room disposal
Input: copy turn10-post-ship → bridge-turn11-pre-base. Output: bridge-turn11-post-ship.html.
BASE STAGE: checksum-verified byte-identical to banked Turn 10 Post-ship. No rebuild, no new device test.
- **Pre-ship:** relay-side presence + disposal policy (unjoined 30-day expiry; joined never silent; dispose retires token + purges).
- **Ship:** waiting indicator survives offline; unread/last-message in Room List; dispose cleans relay. GATE: offline→waiting→clears on join; dispose removes room everywhere.
- **Post-ship:** edge cases. Merge to main.

# TURN 12 — Design system + pilot readiness
Input: copy turn11-post-ship → bridge-turn12-pre-base. Output: bridge-turn12-post-ship.html.
BASE STAGE: checksum-verified byte-identical to banked Turn 11 Post-ship. No rebuild, no new device test.
- **Pre-ship:** all hardcoded color/size/spacing → CONFIG token keys.
- **Ship:** two independent persisted axes (font size, theme preset); uniform design across all surfaces + PB. GATE: change font/theme independently, both persist across reinstall; every surface coherent.
- **Post-ship:** full regression Galaxy + iPhone. Pilot. DONE.


# TURN 13 — Installable, reachable when closed + pilot readiness (DONE)
Input: copy turn12-post-ship → bridge-turn13-pre-base. Output: bridge-turn13-post-ship.html.
BASE STAGE: bridge-turn13-pre-base.html must be checksum-verified byte-identical to the banked Turn 12 Post-ship file before this turn's Pre-ship begins (see process-level BASE STAGE rule above). No rebuild, no new device test.
- **Pre-ship — ENGINE:** service worker + notification contract (PWA/push lives HERE); installable to home screen. GATE: installs, launches full-screen.
- **Ship — CORE UI:** push subscription; backgrounded + fully-closed → notification → opens right thread; unread badge. GATE: closed-app notification → correct thread; badge clears.
- **Post-ship — pilot readiness:** full cross-turn regression on real Galaxy + iPhone; configurability proof (change theme/font/labels/default capability via CONFIG, no rebuild). GATE: whole matrix passes; config change reshapes look/feel/operation without touching code. Merge to main. DONE.

# PART II — CC EXECUTION SPEC (the gap-closers; without these CC reintroduces regressions)

## §A. INPUT FILE MAP (never use a stale local file as baseline)
REFERENCE FILE EXACT PATHS (raw.githubusercontent.com/acmeproducts/stuff/main/): bridge-turn06-base.html (baseline, repo root), phrase-desk.html (PB card layout authority, repo root), test.html (shell architecture authority, repo root), 2vid.html (shell reference, repo root). Fixtures: talkbridge/fixtures/. Plan + graveyard: talkbridge/.
Every turn's input is fetched fresh from GitHub at stage start. Source of truth is the repo, not any local copy.
- Fetch: `curl -s -o <local> https://raw.githubusercontent.com/acmeproducts/stuff/main/<file>`
- Turn 06 input: `bridge-turn06-base.html` (v5.6.1, 3940 lines, full-file sha256 starts `0b21ffdeeadb5db9`). If the fetched file's line count ≠ 3940 or the sha prefix differs, STOP — wrong baseline.
- Every later turn input = the prior turn's `*-post-ship.html` AFTER it is merged to main, re-fetched from GitHub. Never carry a working-directory file forward across a turn.

## §B. IMMUTABLE FUNCTION CHECKSUMS (wrap, never rewrite — diff before and after)

EXACT CHECKSUM METHOD (use this precisely or you will get different hashes; setupPC in particular is sensitive to boundaries):
- Segment START: if the function is declared `async`, the segment STARTS at the `a` of `async` (include the `async ` prefix). Otherwise it starts at the `f` of `function`. **setupPC is async — its segment MUST begin `async function setupPC(`; dropping the `async ` prefix is the one mistake that yields a wrong hash with a correct 73-line count.** Do NOT include any leading newline, indentation, comment, or whitespace before `async`/`function`. The 21 functions and which are async: only `setupPC`, `startDeepgram`, `translateWithRetry`, `translate`, `onDGFinal`, `_loadFastText`, `_detectLangAsync`, `connectRelay`, `rejoinCall` may carry `async` — in every case include the `async ` prefix exactly as it appears in the baseline.
- Segment END: the matching closing brace `}` of the function body (brace-depth returns to zero), INCLUSIVE. Do NOT include any trailing semicolon, newline, or whitespace after that brace.
- Encoding: UTF-8 bytes of that exact segment, with LF (\n) line endings (the repo file is LF). If your local copy has CRLF, normalize to LF first.
- Hash: sha256 of those bytes; take the first 12 hex characters.
Reference implementation (Python): locate `(?:async )?function NAME\s*\([^)]*\)\s*\{`, then brace-match to the closing `}`, hash `base[start:end]`. This method reproduces every value in the table below from bridge-turn06-base.html (3940 lines, file sha 0b21ffdeeadb5db9), setupPC included.
These 21 functions are byte-frozen. When a stage wraps them behind a module contract, the function body must remain byte-identical. After any stage, CC recomputes each sha256 (first 12 hex of sha256 over the function text from `function NAME(` through its matching closing brace) and diffs against this table. Any mismatch = REJECT the stage.

| Function | sha256(12) | lines |
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

(Tier-2 — enterCall, hangUp, joinerProceed, createRoom — may change ONLY at one named insertion point each; never wrap enterCall in async; one `<script>` block only.)

## §C. THE SWITCH MECHANISM (the anti-grep rule, made concrete)
"Build beside, switch one surface at a time" means literally this, never a live edit of the working function:
1. The new module(s) are added to the file as new code; the old function(s) stay untouched and still live.
2. A CONFIG flag gates which path runs at the ONE call site per module: `if(CONFIG.get('use.MODULE')) MODULE.method(...) else oldFunction(...)`. Default false until the release's device gate passes.
3. CC flips the flag(s) for ONE RELEASE GROUP — a set of modules that share a single observable contract surface on the device, because the old and new code paths don't have identical contracts and flipping a module in isolation often produces no device-testable difference at all. A release group is valid only if: (a) the modules in it are coupled tightly enough that none of them is independently exercisable on the phone without the others (e.g. signaling and the peer connection can't be verified apart from each other — there's no call without both), or (b) they are infra-only modules with no live-path behavior of their own (e.g. config values, logging) and bundling them carries no incremental risk. CC builds nothing outside the declared group, and the release is tested with exactly that group's flags on.
4. Only AFTER the device gate passes does a later release remove the dead old function(s) for that group.
CC must NOT: edit the body of a live working function to "convert" it; replace a function in place; flip a flag for any module not in the declared release group; or invent its own grouping — the groups are named in the turn's Pre-ship section, not decided ad hoc. If CC finds itself doing a find-and-replace inside a working function body, STOP — that is the failure mode.

## §D. CONTRACT DETAIL FORMAT (every method, no ambiguity)
Each module method in Part I is implemented to this exact shape. Example for PB-SYNC.pull (CC writes the rest to match):
- `PB-SYNC.pull(srcLang, tgtLang)` — params: two ISO lang strings.
  - Returns: `{status:'ok'|'no-pair-file'|'no-pat'|'error', version:Number|null, cards:Card[]}`.
  - Lists `/phrasebook/`, filters `phrasebook-{src}-{tgt}-{NNNN>=1000}.json`, sorts desc, fetches highest.
  - REPLACES the cache via PB-DATA.save (no merge).
  - No PAT in localStorage `tb_gh_pat` → return `{status:'no-pat',...}`, do not throw.
  - No matching file → `{status:'no-pair-file',...}`, call does not block the call.
  - Network/parse error → catch, `LOG.log('pbsync_pull_err',{e},'warn')`, return `{status:'error',...}`.
  - On success → `LOG.log('pbsync_pulled',{pair,version,n:cards.length})`.
Every method states: params+types, return shape, each error path, each LOG event string. No method may throw uncaught. No method reads another module's internals.

## §E. PER-STAGE VERIFICATION BLOCK (CC produces; user runs)
A stage is not done until CC delivers ALL of:
1. **Lint pass**: extract `<script>` (Python `re.search(r'<script[^>]*>(.*?)</script>', txt, re.DOTALL)`) → temp `.js` → `node --check` → must pass.
2. **Immutable diff**: §B table recomputed, all 21 match.
3. **Grep manifest**: a stage-specific list of `grep -c` assertions with expected counts proving the new module is present AND wired at its call site AND the old path is flag-gated (e.g. `grep -c "CONFIG.get('use.PB_DATA')" file # >=1`). CC writes these per stage from the contracts.
4. **Called-but-missing audit**: every function referenced exists (no orphan calls).
5. **Numbered device-test table**: the stage's GATE expanded into a `| # | do | expected | P/F |` table the user runs on the phone. Turn 06 Ship uses cases A1–G6 verbatim (Part III).
A stage banks only when lint+immutables+greps+audit pass AND the user marks every device row P. Then merge to main; that becomes the next input.

## §F. BUILD ORDER WITHIN A STAGE (dependency DAG — build in this order)
NOTE: this is the WITHIN-A-STAGE order. Across Turn 06's grouped stages: Pre-ship = CONFIG→LOG→STORE→engine→NORMALIZE; Ship = ROOM→THREAD→CALL then the shared seam PB-DATA→PB-QUERY→PB-RENDER.renderRow→compose-strip; Post-ship = PB-SYNC→PB-USAGE→PB-RENDER.renderCard→PB-overlay. renderRow ships in Ship, renderCard in Post-ship.
CONFIG → LOG → STORE → (RELAY, RTC, STT, TRANSLATE, LANGDETECT) → NORMALIZE → ROOM → THREAD → CALL → PB-DATA → PB-SYNC → PB-USAGE → PB-QUERY → PB-RENDER. Never wire a module before the modules it reads from exist. CONFIG and LOG exist before anything else reads or logs.

## §G. DEFINITION OF A BANKED STAGE
A single complete `.html` file (no fragments, ever), lint-clean, 21 immutables intact, new module(s) present and flag-wired at one surface, old path still present but gated, grep manifest passing, called-but-missing audit clean, and the user's device-test table fully P. Anything less is not banked and the next stage does not start.

---

# PART III — DEVICE BEHAVIOR CASES A1–G6 (inline; Turn 06 Ship gate)
These are the cases CC must satisfy and the user runs on the phone. The mechanism notes are why each kept regressing.

**A. Enter-in-source (mechanism: real KEYDOWN, preventDefault on plain Enter — onblur ALONE does not fire on Enter; that was the bug)**
- A1 type new source, Enter → target + BT populate, keyboard STAYS up.
- A2 Shift+Enter → newline, no commit.
- A3 edit existing source, Enter → re-translates target+BT, verdict resets per B.
- A4 blur without Enter → same commit fires.

**B. Verdict reset + clarify (mechanism: CONDITIONAL — only if text changed; never log pending→pending)**
- B1 source changed, verdict was good → pending; clarify gets "Was:<old>" + "good → pending" (2).
- B2 changed, was flag → pending; "Was:<old>" + "flag → pending" (2).
- B3 changed, was pending → stays pending; "Was:<old>" only (1).
- B4 NOT changed, was good → nothing logged, verdict unchanged (0).
- B5 NOT changed, was pending → nothing (0).
- B6 tap Sounds Good → good; "pending → good" (1).
- B7 tap Flag → flag; "<prev> → flag" (1).

**C. Clarify input (mechanism: handler ENDS with el.focus() — missing line = looks dead)**
- C1 type note, Enter → entry appears "TB · time", input clears, CURSOR STAYS.
- C2 Shift+Enter → newline, no commit. C3 empty + Enter → nothing. C4 author shows "TB" capitalized. C5 × removes an entry.

**D. Tags**
- D1 type tag, Enter → pill with ×, input clears, focus retained. D2 tag logged to clarifyChain. D3 × removes pill, logs remove. D4 autocomplete from existing tags (createElement so mobile keydown fires).

**E. Compose strip (mechanism: guard BOTH Enter AND send; × inside field)**
- E1 type text → × INSIDE field's right edge. E2 clear → × gone. E3 "/" → inline drawer opens on keystroke, PB icon shown. E4 ".." → becomes "/", same drawer. E5 "/bank"+Enter → NOT sent; opens overlay searching "bank" (predicate stripped). E6 "/bank" + tap SEND → NOT sent (send has same guard as Enter — THIS is the regressor). E7 × during search → clears, closes drawer, refocuses. E8 normal chat + Enter/send → sends normally.

**F. Duplicate save**
- F1 save source+target+langs matching existing → no dup; toast "Already saved"; usage increments; lastUsed/updatedAt refresh.

**G. Sync lifecycle (observable in debug log)**
- G1 enter en-th call, file exists → "pbsync_pulled"; cards visible. G2 no file → toast "No shared phrasebook yet"; call still connects. G3 zero changes, hang up → "pbsync_skipped_no_changes". G4 edit, hang up → "pbsync_upload_completed"; new version in GitHub. G5 close overlay while dirty → write-back fires. G6 upload fails → "pending upload"; retries on reconnect → "upload completed" on success.

---
---

# PART IV — THE DETERMINISM LAYER (no LLM decisions; everything verifies by checksum, fixture, grep, or log)

Principle: anywhere this plan would say "identical", "correct", "appropriate", or "as needed", that is latitude and is replaced by a diff against a frozen reference. CC decides nothing; a script returns green or the stage is rejected before it reaches the phone.

## §H. MANDATORY ENTRY/EXIT/ERROR LOGGING (the observability contract)
EVERY public module method, with NO exception, has exactly three log points. This is the proof a contract was honored — a test is "download the debug log and read what every module received and returned", never "did it look right".

THE WRAPPER TEMPLATE (every public method matches this structure byte-for-structure):
```
MODULE.method = function(ARGS){
  LOG.log('MODULE.method:in', {ARGS});                 // ENTRY — actual input values
  try{
    /* body */
    var __out = RESULT;
    LOG.log('MODULE.method:out', {out:__out});          // EXIT — actual returned value
    return __out;
  }catch(e){
    LOG.log('MODULE.method:err', {in:{ARGS}, e:String(e)}, 'warn');  // ERROR — never swallowed
    return CONTRACT_ERROR_SHAPE;                          // defined error return, never uncaught throw
  }
};
```
Rules: entry logs the contract's declared inputs; exit logs the contract's declared output; catch logs input+error at 'warn' and returns the contract's defined error shape; nothing returns silently on error; no method re-throws uncaught. Event strings are `MODULE.method:in|out|err` and are part of the frozen LOG dictionary (§J).

ENFORCEMENT (deterministic, pre-device): for every public method M in a module, the verification block asserts all three exist:
```
grep -c "'MODULE.M:in'"  file   # == 1
grep -c "'MODULE.M:out'" file   # >= 1
grep -c "'MODULE.M:err'" file   # == 1
```
A method missing any of its three log points fails the stage. CC cannot "forget" logging because the machine check rejects the file.

## §I. CONFIG MANIFEST (frozen keys, exact values from base — CC neither names nor guesses)
CONFIG is seeded with these exact keys/values extracted from bridge-turn06-base. Types and initial values are fixed; CC reads them, never invents them. (Full 54-color token set enumerated in the companion extraction; the keys below are the fixed schema.)
- Infra (read-only, never overridden): `relay.base="talk-signal.myacctfortracking.workers.dev/signal"`, `relay.ws="wss://"`, `relay.app="talk-say-v1"`.
- Storage keys (fixed names): `tb_cf_tid, tb_cf_tok, tb_dev, tb_dg_key, tb_gh_pat, tb_my_lang, tb_their_lang, say_cards` (+ `pb_cdn_ts:` prefix).
- Theme tokens: one key per the 54 hex colors found in base, typed `color`, initial value = the exact hex. (e.g. `color.bg.app="#0a0a0a"`.) Turn 11 is where these get consolidated/renamed; until then they are 1:1 with base.
- Font size axis: `font.scale` (number, default 1.0). Theme axis: `theme.preset` (string, default 'dark').
- Feature flags (the switch mechanism, §C): one `use.MODULE` boolean per module, default false until that module's stage gate passes.
A CONFIG key's value at any stage is checksummable: `sha256(JSON.stringify(CONFIG.getAll(), sortedKeys))` must equal the frozen value for that stage.

## §J. LOG EVENT DICTIONARY (frozen vocabulary — device tests and code reference the same strings)
Base already emits 114 events (pb_loaded, relay_open, dg_final, chat_norm_result, rtc_track, … — all preserved, none renamed). New module events follow ONE pattern only: `MODULE.method:in|out|err`. PB sync lifecycle events used by device tests are fixed exactly as: `pbsync_pulled`, `pbsync_skipped_no_changes`, `pbsync_upload_completed`, `pbsync_upload_pending`. Any event string not in the dictionary appearing in code = reject (grep for stray `log('` events not in the frozen list). Device test G-cases assert these exact strings.

## §K. PER-STAGE GREP MANIFEST (pre-written here; CC runs, does not author)
Each stage's "wired correctly" proof is a fixed list of `grep -c` assertions with expected counts, written in this plan, not by CC. Pattern per modularization stage:
- New module present: `grep -c "MODULE.method = function"` == (method count).
- Each method's 3 log points present (§H greps).
- Switch wired at exactly one call site: `grep -c "CONFIG.get('use.MODULE')"` == 1.
- Old path still present (not deleted yet): `grep -c "function oldFn"` == 1.
- 21 immutables intact (§B diff).
(CC fills the literal MODULE/method/oldFn names from Part I contracts — those names are fixed by the contracts, so the manifest is determined, not authored.)

## §L. LINE-DELTA TOLERANCE (catches silent rewrites)
A "behavior identical" modularization stage adds module code + log lines + one flag check; it does not rewrite working bodies. Expected line delta per such stage = (new module LOC + ~3 lines/method logging + 1/surface). A swing beyond +20% over that estimate on an "identical" stage = investigate; a reduction in line count on an additive stage = reject (something was deleted/replaced in place).

## §M. CHANGE MANIFEST (protects the un-checksummed remainder)
Each stage ships a manifest: list of functions byte-IDENTICAL to input (with sha), functions NEW (with sha), and the EXACT call sites changed (file+line+old→new). CC diffs the built file against input: every function is either in the identical list (sha matches) or the new list; any changed function NOT declared = reject. No "I also cleaned up / improved X". This extends the checksum guarantee from the 21 frozen functions to the entire file.

## §N. NORM FIXTURE (pbNorm output is byte-exact, no edge-case latitude)
FIXTURE AUTHORSHIP: the doer authors fixtures/norm.json, fixtures/query.json, fixtures/render.json from the §4M contracts + canonical schema as part of Pre-ship, and includes them in the ready-to-test report for gating review BEFORE they are treated as the verification gate (a doer must not silently grade itself against fixtures only it has seen). Once reviewed and accepted they are frozen and committed to the repo under talkbridge/fixtures/.
Ship `fixtures/norm.json`: an array of `{input: rawCard, expected: normalizedCard}`. PB-DATA.norm(input) must deep-equal expected for every entry, including null-vs-missing-vs-empty, language-pair inheritance (remote card lacking sourceLang/targetLang inherits the file's pair, not 'en'/'en'), categories default ['unassigned'], verdict default 'pending', and dropped fields absent. `sha256(JSON.stringify(norm(input)))` == `sha256(JSON.stringify(expected))`. A mismatch on any fixture = reject.

## §O. QUERY/RENDER FIXTURES (search and render are deterministic, not judged)
- `fixtures/query.json`: `{cards:[…], query:"bank", pair:"en-th", expectedIds:["id3","id7"]}` — PB-QUERY.query returns exactly those ids in that order. Covers `-exclude`, pair scoping, omni-match fields.
- `fixtures/render.json`: given a fixed card, PB-RENDER.renderCard(card).outerHTML normalized (whitespace-collapsed) has a frozen sha; renderRow likewise. Structural drift in the card = sha change = reject.

## §P. THE PRE-DEVICE GATE IS FULLY MACHINE-CHECKED
Before a build is ever sent to the phone, one script must return all-green: lint (node --check) · 21 immutable shas match (§B) · §H logging greps pass for every method · §K stage grep manifest passes · §M change manifest reconciles · §L line-delta within tolerance · §N/§O fixtures deep-equal · no stray LOG events outside the dictionary (§J). Only an all-green pre-device gate earns a device-test table. The human runs the phone cases; everything before the phone is deterministic. A stage banks only on all-green + every device row P.

---
---

# PART V — UI ELEMENT MAP (surface by surface, every element; user reads it as screens, CC builds without inventing)

Format per element: **label** `#id` — content · states · interaction → handler/module. IDs marked NEW are created this build; IDs in plain code font already exist in base/phrase-desk and are reused verbatim. No element is invented beyond this map; if CC needs an element not listed, STOP and add it here first.

## SURFACE 1 — ROOM LIST `#room-list` NEW (initiator only; never rendered in a joiner session)
- **Brand/header bar** `#rl-header` NEW — app name left; no settings gear here (settings live in first-run setup). States: static.
- **New room button** `#rl-new-btn` NEW — "＋ New room", full-width primary. → ROOM nothing; navigates to Room Creation surface. (Mirrors base `openCreateRoomModal` styling: `lobby-btn` class.)
- **Room cards list** `#rl-cards` NEW — one card per `ROOM.listForOwner()` entry. Empty state: single line "Create your first room" + the ＋ button, no tutorial.
- **Room card** `#rlc-{roomId}` NEW (repeated) — contains:
  - other-party handle `#rlc-name-{roomId}` — the joiner's handle, or "waiting for them to join" if unjoined (italic, dim).
  - last-message preview `#rlc-prev-{roomId}` — last thread message text, 1 line, ellipsized.
  - capability icon `#rlc-cap-{roomId}` — chat-only glyph vs chat+call glyph (decoration; reflects `cap`).
  - waiting/unread dot `#rlc-badge-{roomId}` — shown only if unread/waiting; hidden otherwise.
  - tap target → THREAD.render(roomId). secondary action (long-press or ⋯ `#rlc-more-{roomId}`) → Room Info surface.
- GATE element checks: `grep -c 'id="rl-cards"'`==1; joiner session renders none of these (routing test, §C asymmetry).

## SURFACE 2 — ROOM CREATION `#room-create` NEW (one choice, then link/QR)
- **Title** `#rc-title` NEW — "New room". static.
- **Chat-only choice** `#rc-choice-chat` NEW — large tappable card "Chat only". → ROOM.create('chat'). 
- **Chat+call choice** `#rc-choice-call` NEW — large tappable card "Chat + Call". → ROOM.create('chatcall').
- (NOTHING else on this screen — no name field, no language picker, no settings, no save button. Language comes from first-run setup `tb_my_lang`/`tb_their_lang`, not asked here.)
- **Share sheet** `#rc-share` NEW — appears immediately after a choice (no wait state): link text `#rc-link` NEW + QR image `#rc-qr` NEW + copy/share button `#rc-copy` NEW. → system share.
- GATE: tap a choice → room exists instantly (ROOM.create logged in:out), share sheet shows link+QR; chat-only room carries no call-capability anywhere downstream.

## SURFACE 3 — THREAD `#thread` NEW (both roles; populated by role)
- **Header** `#th-header` NEW — other-party handle `#th-name` NEW + info affordance `#th-info-btn` NEW (→ Room Info). For chat+call only: call button `#th-call-btn` NEW — visible, persistent (→ CALL.mount(roomCtx)). For chat-only: `#th-call-btn` is ABSENT from the DOM (not hidden) — gated by `cap`.
- **Waiting indicator** `#th-waiting` NEW — initiator-only, pre-join: "waiting for them to join", quiet, non-blocking; removed once joiner joins.
- **Message list** `#th-msgs` NEW — bubbles via THREAD; each side's own language on its own side (speaker-centric, reuse test.html getSides logic). System markers (e.g. "call ended") via THREAD.postSystem.
- **Compose strip** `#th-compose` NEW — reuses Turn 06 compose contract: attach `#th-attach` · input `#th-input` (placeholder "Message") · clear × `#th-clear` (inside field, only when content) · send `#th-send`. The "/"+".." PB-search behavior applies ONLY inside a call (Call surface compose), not the thread compose — thread compose is plain chat.
- Joiner first-open: lands here directly, no setup; initiator's prior messages already present.
- GATE: chat-only thread has no `#th-call-btn` in DOM; chat+call has it; joiner cannot navigate to Room List from here.

## SURFACE 4 — CALL SCREEN (Bridge engine, mounted by CALL; reached only from a chat+call thread)
Reuses base call UI verbatim — these IDs already exist and are NOT rebuilt:
- remote video `#remote-video` · local video `#local-video` · control bar (collapse, mute `toggleMic`, share `shareLink`, phrasebook open `pbOpenOverlay`, DG mic indicator, camera `toggleCam`, hang up `hangUp`) · transcript area (`renderTr`/`appendTrDom`) · compose strip (the chat+search dual element, Turn 06 contract).
- **Hang-up behavior CHANGE:** on `hangUp`, CALL.unmount → return to THREAD.render(roomId) + THREAD.postSystem("call ended"). NOT showThankYou's terminal page. (showThankYou stays byte-frozen but is no longer the call's terminal route in the merged shell; CALL.unmount owns the return.)
### 4b. PHRASEBOOK OVERLAY `#pb-overlay` (component inside Call; Turn 06)
Element table (Bridge IDs, phrase-desk layout — already specified, reproduced for completeness):
- ribbon: pair label `#pb-ov-pair` (flags+filename, via pbOvUpdatePairLabel) · "+" add `#pb-ov-add` (→ pbAddCard) · save `#pb-ov-save` · sync dot `#pb-ov-sync` (pbOvUpdateSyncDot) · close `#pb-ov-close` (→ pbCloseOverlay) · search `#pb-ov-search` + clear `#pb-ov-search-x` (× inside box).
- cards host `#pb-ov-cards` — zero-state → full CARDs (pbBubbleHtml); active search → ROWs (pbOvRowHtml).
- **Full card** `pbb-{id}`: source `pbsrc-{id}` (editable, KEYDOWN→translate+BT) · target `pbtgt-{id}` · USE+TTS per side · back-translate `pb-bt-text-{id}` (always visible) · verdict pills ✓Sounds Good/⚑Flag · footer 3 icons (# tags / clarify / trash) · tag drawer `pbtags-{id}` (chips `pb-tc-{id}`, input `pb-ti-{id}`, suggestions `pb-ts-{id}`) · clarify drawer `pbclarify-{id}` (thread `pb-cc-{id}`, input `pb-ci-{id}`, Enter commits + el.focus()).
- **Row** (search): source+TTS+▶send | target+TTS+▶send (pbOvRowHtml/pbIRowHtml); no "tap to use".
- GATE: cases A1–G6 (Part III).

## SURFACE 5 — ROOM INFO / DISPOSE `#room-info` NEW (the one destructive place)
- **Created date** `#ri-created` NEW · **capability** `#ri-cap` NEW · **other-party handle** `#ri-name` NEW — all read-only.
- **Dispose button** `#ri-dispose` NEW — clearly marked destructive. → confirmation `#ri-confirm` NEW ("are you sure?", the ONLY confirmation in the app) → ROOM.dispose(id) (real relay-side cleanup).
- GATE: dispose shows the one confirmation; confirm → room removed everywhere (ROOM.dispose logged).

## SHARED / SYSTEM SURFACES (reused verbatim from base — IDs exist, do not rebuild)
- Debug Log `#log-overlay` (header `🪲 Debug Log`, Copy `copyLogText`, Clear `clearLogText`, Close `closeLog`, body `#log-body`) — the observability surface (§H). 
- Joiner landing `#joiner-landing` (lang pill `#joiner-lang-pill`, room name `#joiner-room-name`, flags `#joiner-flags`, join `#joiner-join-btn`→joinerProceed, sub) — adapted: joinerProceed now routes into THREAD, not the old call lobby.
- Create-room modal `#create-room-backdrop` from base is REPLACED by Surface 2 (Room Creation) — the modal's language selects move to first-run setup; the modal is retired in Turn 07.
- First-run setup (language `tb_my_lang`/`tb_their_lang`, Deepgram `tb_dg_key`, TURN `tb_cf_tid`/`tb_cf_tok`) — retained from base lobby; this is the only place languages/keys are entered.

## ELEMENT-MAP ENFORCEMENT
Every NEW id above is asserted present in its stage's grep manifest (`grep -c 'id="rl-cards"'` etc.). Every reused id is asserted unchanged. An element rendered that is not in this map = reject (CC invented UI). A map element missing from the built surface = reject (incomplete). The user can read this part top to bottom and see all five screens plus the PB component; CC builds exactly these elements, no more, no fewer.

---
---

# PART VI — PROCESS LOCKS (why this failed before; the rules that make it impossible to repeat)

Every prior failure was process and trust, not specification. These locks remove the latitude that caused them. They override convenience, speed, and any builder judgment.

## §VI-1. THE WORKFLOW (the only sequence permitted per change)
A "change" = ONE atomic, self-contained module (see §VI-5). For each change, in this exact order:
1. **READ** — emit the relevant contract (Part I) and element-map (Part V) section VERBATIM for this module. No paraphrase. This is the comprehension gate input (§VI-3).
2. **COMPREHENSION CHECK** — answer the module's fixed comprehension questions (§VI-3). Fail → do not build; re-read.
3. **GRAVEYARD SCAN** — check the change against the graveyard (§VI-6). If it matches a buried approach, STOP — this is a forbidden path.
4. **MARK + CHECKSUM BEFORE** — locate the insertion/replacement region; record `# checksum before` of the region (or of the file section the module replaces).
5. **PREDICT AFTER** — state the expected `# checksum after` and expected line delta BEFORE writing.
6. **INSERT THE ATOMIC MODULE** — drop in the self-contained block with its boundary markers (§VI-5). Never edit a working function body in place.
7. **CHECK ACTUAL vs EXPECTED** — compute actual checksum; compare to predicted. Mismatch → REVERT, do not adjust-and-continue.
8. **BUILD LOG** — append the result (module, before/after checksum, predicted/actual, pass/fail) to the build log (§VI-5).
9. **READY-TO-TEST REPORT** — only when all checks pass, produce the certification report (§VI-4).
10. **DEVICE GATE** — user runs the device test table. Red → §VI-2 exit condition. Green → bank, merge to main, next change.

## §VI-2. THE EXIT CONDITION (hard stop — clearly states why)
After a change's device gate goes RED:
1. ONE retry is permitted, and ONLY after: re-fetch the last banked file fresh from GitHub (never the working-dir file), re-run the workflow from step 1.
2. Before the retry, run the GRAVEYARD SCAN against the failure. If the failure mode matches a buried approach → no retry; go straight to exit.
3. If the retry's device gate is also RED → EXIT CONDITION TRIGGERED. STOP all building. Emit an exit report stating EXACTLY:
   - which change failed, at which step;
   - the before/after checksums and what diverged;
   - the device case(s) that went red and the relevant build-log + debug-log lines;
   - whether a graveyard match was found;
   - the explicit reason: "Exit triggered: [first attempt red] + [retry from clean baseline red] + [graveyard scan result]. No further attempts permitted on this change. Last banked file on main is intact and is the floor."
4. After an exit: the builder does NOT try a third time, does NOT patch forward, does NOT improvise. The change is escalated for human re-scoping or graveyard burial. The tester closes the session; stamina is preserved (§VI-7).

## §VI-3. COMPREHENSION GATE (the builder must prove it read, before it may build)
Before building any module, the builder answers that module's fixed questions, drawn from its own contract — e.g. for PB-SYNC: "What does pull return when no PAT? when no file? What does it REPLACE vs merge? Which exact LOG events fire?" Answers must match the contract verbatim in substance. A wrong/guessed answer = comprehension FAIL = building forbidden until re-read. This converts "did you read it" from trust into a passed test. The questions live beside each contract; the builder cannot author or skip them.

## §VI-4. READY-TO-TEST REPORT (the certification that replaces self-grading trust)
No device test begins until the builder emits a signed report certifying every check, by name, with its result:
- version stamp: file internal version == this stage's output version (e.g. Pre-ship == v5.6.2); FAIL if still showing the input version
- lint (node --check): PASS + output
- 21 immutable checksums: each one, expected vs actual
- atomic module boundary markers present: listed
- before/after checksums per module this change: predicted vs actual
- line-delta within tolerance: expected vs actual
- mandatory entry/exit/error log points present for every method: listed
- LOG events all within the frozen dictionary: confirmed
- fixtures (norm/query/render) deep-equal: PASS
- change manifest reconciles (every changed function declared): PASS
- graveyard scan: no match
- "CERTIFIED READY FOR ACCEPTANCE TEST" only if ALL pass; otherwise "NOT READY — [which check failed]".
This report IS the artifact the tester acts on. If any line is missing or not PASS, the device test does not happen.

## §VI-5. ATOMIC MODULE FORMAT (grep is dead; drop-in, marked, checksummed)
NO grep-and-replace. NO editing working function bodies. Every module is a self-contained block that can be dropped in, commented out, or stripped out without touching anything else. Format:
```
/* ===== #new module: MODULE.method ===== */
/* checksum-before: <region sha or 'n/a-new'> */
/* predict-after: <expected sha>  delta: <±lines> */
MODULE.method = function(ARGS){
  LOG.log('MODULE.method:in',{ARGS});
  try{ /* body */ var __out=RESULT; LOG.log('MODULE.method:out',{out:__out}); return __out; }
  catch(e){ LOG.log('MODULE.method:err',{in:{ARGS},e:String(e)},'warn'); return ERR_SHAPE; }
};
/* check: actual-after <sha> == predict-after <sha> ? PASS/FAIL → build log */
/* ===== #end module: MODULE.method ===== */
```
For a replacement of existing code: mark `#existing module` around the old block, checksum it before, insert the new atomic module adjacent (behind a CONFIG flag), and only after the device gate banks does the old marked block get stripped — as a whole marked unit, never by find-and-replace inside it. The boundary markers are how presence/removal is verified — by reading the markers, not by grepping live code. The build log records every module's before/predicted/actual checksum.

## §VI-6. THE GRAVEYARD (kept current; lives in project knowledge)
A living list of approaches PROVEN to fail, scanned at workflow step 3 and at exit. Buried so far (do not resurrect):
- Building Turn 06 inside the entangled single file (5 attempts, all failed).
- Grep-and-replace / editing a working function body in place ("changing a tire at 90mph").
- Multi-change patches in one cycle (cascading regressions).
- Using a stale working-dir file as baseline instead of re-fetching from GitHub.
- onblur (alone) to commit Enter-in-source (Enter never fires onblur).
- The catalog system (catalogIds/say_catalogs/pbGetCats) — deleted; categories[] replaces it.
- union-by-id merge on PB load — replaced by REPLACE-on-load (GH is SOT).
- Acknowledge-the-problem-then-repeat-it in the next step (state intent and act in the SAME step, never as separate turns).
- Self-graded gates (the builder asserting green without the certification report §VI-4).
RULE: any new failure that triggers the exit condition (§VI-2) is appended to the graveyard with its signature, and the graveyard is updated in project knowledge so it persists across sessions. A change matching a graveyard signature is forbidden before it is attempted, not after it fails again.

## §VI-7. TESTER STAMINA (protect the resource that actually runs out)
The human runs ONE device gate per change, then stops if red. The builder owns all prep (re-fetch, re-run workflow, certification) before the human is re-engaged. No multi-hour spirals: the exit condition (§VI-2) caps a failing change at two attempts, then hard-stops. The plan optimizes for the tester finishing the project, not for the builder finishing fast.

---

THE BOTTOM LINE: grep is dead. Every change is an atomic, marked, checksummed drop-in with mandatory logging, gated by a comprehension test, certified by a ready-to-test report, scanned against a living graveyard, and capped by a hard exit condition after one clean-baseline retry. The last banked file on main is always the floor. These locks make the specific failures of the last five attempts mechanically impossible to repeat.
