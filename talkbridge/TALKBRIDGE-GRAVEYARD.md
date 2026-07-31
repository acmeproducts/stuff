<!-- v5.8.2.25 -->
# TALKBRIDGE — THE GRAVEYARD (living; keep in project knowledge)
## Approaches PROVEN to fail. Scanned before every change and at every exit condition. Never resurrect.
**Version: 1.2 | 2026-07-01 | Maintained in GitHub by the build process (raw.githubusercontent.com/acmeproducts/stuff/main/talkbridge/TALKBRIDGE-GRAVEYARD.md). Updated on every exit-condition burial.**


Each entry: the approach, its failure signature, what replaces it. A change matching a signature is forbidden BEFORE it is attempted — not rediscovered as if new.

| # | Buried approach | Failure signature | Replacement |
|---|---|---|---|
| G1 | Build Turn 06 inside the entangled single file | 5 attempts, cascading regressions, never banked | Build atomic modules beside working code; switch one surface at a time |
| G2 | Grep-and-replace / edit a working function body in place | "changing a tire at 90mph"; breaks adjacent behavior | Atomic drop-in modules with boundary markers (§VI-5); strip whole marked units |
| G3 | Multi-change patch in one cycle | Cascading regressions; can't isolate cause | One atomic self-contained module per gate cycle |
| G4 | Stale working-dir file used as baseline | Built on corrupted/old state; first pre-ship discarded | Re-fetch last banked file from GitHub raw every time |
| G5 | onblur (alone) to commit Enter-in-source | Enter never fires onblur in a textarea; "doesn't translate" | Real KEYDOWN handler, preventDefault on plain Enter |
| G6 | Catalog system (catalogIds / say_catalogs / pbGetCats) | Resurrected a model deleted in Session 6; 489-vs-227 rabbit hole | categories[] (default ['unassigned']); catalog stays deleted |
| G7 | union-by-id merge on PB load | Stale cache accumulation; cards never overwritten | REPLACE-on-load; GH is SOT; localStorage is disposable cache |
| G8 | Verdict reset "always" (even when unchanged) | pending→pending clarify noise | CONDITIONAL: reset/log only if source text changed |
| G9 | Clarify handler without el.focus() at end | Entry posts but input loses focus; "doesn't update" | Handler ends with el.focus() |
| G10 | Compose send button without the "/"-guard | "/bank" sent to transcript | Guard BOTH Enter AND send for predicate prefixes |
| G11 | Acknowledge-the-problem-then-repeat-it next step | Stated intent as its own turn, then drifted | State intent and act in the SAME step; output is the green gate, not a promise |
| G12 | Self-graded gate (builder asserts green) | Trust substituted for verification | Ready-to-test certification report (§VI-4); every check named with result |
| G13 | Asking the user to re-decide settled items | "merge or separate?" stalls; infuriating | If clarified once, it's decided; act, don't re-ask |
| G14 | Inventing a parallel process (Stage M/P, 5-stages-per-turn remix) | Broke the defined pre-base→base→pre-ship→ship→post-ship process | Use the defined five stages; the work goes inside them |
| G15 | Starting Pre-ship before that turn's Base is confirmed BANKED in the ledger | Turn 07 Pre-ship (CONFIG release) was built before Base was a gated, banked release — sequence violated even though the copy-forward content was harmless | Before starting any stage's build, confirm the immediately prior stage shows BANKED in RUN HISTORY; if not, stop and bank it first (Base = checksum-verified copy-forward, no rebuild) |
| G16 | Open-ended patch-release series inside a stage (v5.7.2.1–.8) | Eight sequential user-driven patches on one stage; stage structure suspended; each fix risked regressing the last; closed only by explicit owner order | On any post-gate defect: fix at the root baseline and rebuild the stage as one release; never accrete numbered patches on a shipped stage artifact |
| G17 | Activating engine internals inside the bridge file while its lobby/onboarding was already condemned | T08 Base attempt 1: device gate failed on the bridge's own lobby (lang-model status stuck on Pages hosting); the effort was spent on a surface scheduled for deletion, and the container/shell — the actual app — remained unbuilt | Build stages on the surface that survives: container/shell first, migrate the engine into it; never invest a gate in a surface the same turn deletes |

## RULE
Any new failure that triggers the exit condition (build outline §VI-2) is appended here with its signature, and this file is updated in project knowledge so it persists across sessions. The graveyard is scanned at workflow step 3 and before any retry. A match = forbidden path, full stop.


## G1 — 2026-07-02 — T08 Pre-ship v5.8.2 (dcb0dcb284cb)
Gates flipped with adapter glue: invented controls (back arrow, call button) never in the frozen module; bridge screens overlaid shell instead of room opening into the 2vid chat surface. Owner verdict: Frankenstein, unusable. Rule reinforced: room entry must land on the frozen bridge surface exactly as 2vid (minus floating video), compose strip IS the search, no invented UI.


## G2 — 2026-07-03 — T08 Pre-ship v5.8.8
Search overlay rendered blank rows, live speech-to-text was dropped in a redesign pass and never restored, video icon didn't reliably appear on existing sessions. Owner verdict: nothing testable, rollback. Rule reinforced: every UI regression must be walked end-to-end against a real saved session before push, not just a fresh one.


## G3 — 2026-07-03 — T08 Pre-ship v5.8.9 (attempt 5)
Only the video icon rendered; compose strip and all chat function gone; old rooms broken. Deployed content did not match last verified build (site-serving lag). Owner verdict: rollback. Attempt-count subversioning adopted from this point.


## G3 — 2026-07-03 — T08 Pre-ship v5.8.9
Chat surface itself failed to load — only the video icon appeared, no compose strip, all rooms broken. Owner verdict: rollback.


## G4 — 2026-07-03 — T08 Pre-ship attempts 1-6 (v5.8.0.1 through v5.8.2.6)
Repeated patch-on-patch cycle: each fix targeted the last reported symptom without re-verifying the whole surface, so old defects resurfaced (blank search, dead speech pickup, missing compose strip) even after being fixed once already. Owner verdict: stop patching, full replan with checksummed module gates and documented contracts before next attempt.


## G5 — 2026-07-03 — T08 Pre-ship v5.8.2.7
Splash was a floating overlay instead of living inside the room panel as the correct starting screen; closing the side panel left it showing an old chat, nothing else. Owner verdict: 1000% fail.


## G6 — 2026-07-03 — T08 Pre-ship v5.8.2.9
Splash overlay broke the page underneath it (attempt 8 of this stage). Rolled back per process, not patched.


## G7 — 2026-07-03 — T08 Pre-ship v5.8.2.10
Splash was full-screen again instead of confined to the right panel. Pattern across attempts: trying to land chat+voice+phrasebook+video all at once keeps breaking each other. Scope cut for next attempt: chat surface + voice pickup + phrasebook only, no video/call, no splash beyond the right panel's own empty state.


## G8 — 2026-07-03 — T08 Pre-ship v5.8.2.12
Owner still saw a brief flash before the welcome screen settled. Rolled back.


## G9 — 2026-07-03 — T08 Pre-ship v5.8.2.13
Welcome screen still not confined to the right panel; chat surface, compose, mic, and phrasebook search all missing or blank. Root cause: live DOM surgery merging two separate apps into one page is too fragile — each fix reopens prior breaks elsewhere. Rolled back.


## G10 — 2026-07-03 — root cause found, v5.8.2.15
The confirmed call app itself had a startup-order bug — a piece of it ran before it was ready, which silently broke chat, phrasebook, and search every time it was merged. Fixed and verified standing alone before touching anything else.


## G11 — 2026-07-03 — T08 Pre-ship attempts 1-15, pattern summary (v5.8.2.16)
Three real root causes drove every failure, found only after stopping the patch cycle:
1. The call app itself shipped with a startup fault that silently killed chat, search, and phrasebook whenever it was merged.
2. The base file had a stale broken copy baked into it, so the page kept running old code no matter what was fixed.
3. The room-list app was designed to jump straight into the last room on open and to slide the panel over the welcome screen — directly defeating the splash requirement.
All three fixed. Current build (v5.8.2.15 + splash fix) awaiting device confirmation.


## G12 — 2026-07-04 — v5.8.2.15 field test (v5.8.2.17)
Three failures: mic icon wrongly on splash header; original landing behavior was broken by my change (correct rule: welcome only when no rooms exist, otherwise open last room); entering a room gave a dead surface. Verdict: swap-in-place keeps failing. Moving to a two-track strategy.


## G12 — 2026-07-04 — T08 Pre-ship v5.8.2.15, pattern autopsy (v5.8.2.17)
Screenshots confirm the core architectural problem: the bridge organs are being grafted onto the shell via a flag-flip and async injection. The room opens before the bridge is ready, so the user sees the shell compose strip but no live connection, no mic, no relay. The mic icon also bleeds onto the welcome screen where it does not belong.

Root cause is not a bug in any one line — it is the merge strategy itself. Injecting a second app's JS at runtime after the room opens guarantees a race condition. The bridge must be fully initialized before tbEnterRoom is ever callable.

New strategy: parallel track. The bridge organs are bundled into the shell at build time as inert code (not injected at runtime). A single gate enables them. The shell's own compose, transcript, and relay are disabled by that same gate. Switching is a build-time decision, not a runtime injection. This eliminates the race and removes the dual-surface problem permanently.


## G13 — 2026-07-04 — v5.8.2.17
Bridge JS inlined directly into page — crashed on load because the bridge's own startup sequence runs immediately at parse time and collides with the shell's already-running code. Need to defer bridge startup until after shell is fully booted.


## G14 — 2026-07-04 — v5.8.2.18
Bridge inline but its lobby screen was showing instead of the chat surface on room entry. The bridge's own screen-switching ran before tbEnterRoom could redirect it.


## G15 — 2026-07-04 — v5.8.2.19
Chat surface showed but app jumped straight into last room instead of welcome screen, and relay never connected. Two separate issues: boot still auto-opening last room, and relay call missing from room-entry path.


## G16 — 2026-07-04 — v5.8.2.20
Diagnosis: jsdom passes because it has no real browser rendering. On device, the bridge's own startup code runs at parse time and takes over the screen before the shell gets to show the welcome state. The fix of clearing localStorage at boot is not enough — the bridge app itself boots independently the moment its script tag is parsed, shows its own lobby, and the shell never gets a turn. The inline-JS approach cannot work without completely suppressing the bridge's own boot sequence and replacing it with one that only fires when tbEnterRoom is called.


## G-2026-07-04-A — Shell auto-opened last/most-recent room on cold boot
**Symptom:** Confi reports that whenever any rooms already exist, opening the app skips the room list and jumps straight into the most recently active room. With zero rooms, the landing page correctly shows.
**Root cause confirmed:** test.html continueStartup() checked for a saved active-conversation id (or fell back to the newest session) and called openSession() unconditionally on cold boot, bypassing the room list.
**Fix:** continueStartup() now always calls showEmptyShell() on cold boot when there is no invite link. Room list is always the landing surface; entering a room requires an explicit tap.
**Confirmed NOT present in bridge-turn08-pre-ship.html** — that merged build already lands on the empty shell unconditionally.
**Status:** fixed in test.html, pushed, awaiting device confirmation.


## Attempt v5.8.2.23 — remote diagnostic capture added to pre-ship
Added automatic crash capture (uncaught errors, unhandled rejections) and
automatic upload of the device diagnostic log to GitHub, reusing the existing
phrasebook GitHub-token mechanism. One rolling file per device under
talkbridge/device-logs/. Purpose: let Claude read what actually happened on a
real device without needing the device in hand — same approach that closed
Turn 07.


## Attempt v5.8.2.24 — unified logging, success checkpoints added
Root cause of blind spots: the app had two separate logging systems, and only
one fed the GitHub upload added in v5.8.2.23. The call/relay engine logged into
a stream Claude never saw. Fixed: both streams now feed one log, all uploaded.
Added explicit checkpoints for boot start, boot destination, room entry, and
relay connect success/failure — so a stalled flow shows exactly where it
stopped, not just that it crashed.

## 5.8.pre-ship.2 · P2 · FAILED GATE · Jul 5 2026
Keys button in the 3-button modal inert (About/Privacy worked). Cause class: incomplete rewiring during S13 reduction. Rule reinforced: acceptance must include a tap-path check for every button on a touched surface.

## 5.8.pre-ship.4 · P3 · FAILED GATE · Jul 5 2026
Device showed call surface on boot — bridge organ not inert; startup race not contained. Root: doer let the bridge wake on load instead of only on room entry. Rollback to P2 output (972eca6). Cost: multiple retry tokens burned. Lesson: doer must verify inert-on-boot in deterministic checks (console trace showing zero bridge init before room entry) — this is now mandatory acceptance criterion for P3.


---

# ══════ METHOD CHANGE — EXTRACTION ERA BEGINS ══════

**Date:** 2026-07-06
**Ruling:** All entries above this line belong to the injection era (shell-first injection, merge, dormant-app approaches). That method is abandoned, not refined. Delivery now follows `talkbridge/TALKBRIDGE-HOW-WE-PREVAIL.md`: Plan → Execute → Test, extraction under single ownership. Every new graveyard entry below this line must also add an automatic gate check that enforces the lesson on all future builds.


## E-01 (extraction era) — P1 5.9.execute.3 device gate FAIL — 2026-07-06
Symptoms on device: dormant-app fields bled onto the start screen; "+" produced no new-chat modal; "/" inside an existing room opened the old phrasebook surface.
Root causes: (1) flipping the organ-gate defaults at boot disturbed shell startup — gates must flip at promotion time, not at load; (2) hiding the dormant surfaces by one inline style is too weak — must be enforced with priority CSS until promotion; (3) old rooms still route to the shell's old conversation organs — duplicate ownership not fully closed.
Automatic checks added (run before any future device gate): cold load shows zero dormant-app fields; "+" opens the new-chat modal; opening any pre-existing room must not expose the old phrasebook surface.
Action: rolled back, rebuilt as 5.9.execute.4.


## E-02 (extraction era) — P1 5.9.execute.4 device gate FAIL — 2026-07-06
Symptom on desktop Chrome: dormant-app screens rendered raw over the whole page.
Root cause: the dormant surfaces were held in an ordinary container; real-browser parsing let them escape it. The headless rig uses a different parser and could not see it.
Process failure: E-01 and E-02 were patched forward onto the same file instead of rebuilding clean — the exact violation the plan forbids.
Automatic checks added: spec-exact parse check (same rules as Chrome) proving all dormant content stays sealed; candidate builds must be produced by one scripted pass from the banked base, never by cumulative edits.
Action: rebuild as 5.9.execute.5 via single build script.


## E-03 (extraction era) — P1 5.9.execute.5 device gate FAIL — 2026-07-06
Symptoms: created room absent from the room list and lost on reload; "/" opened the full phrasebook surface instead of staying as in-chat search; search results not clickable; stale version stamp.
Root causes: (1) engine rooms and the shell room list are two separate worlds — never joined; (2) controls built at runtime carry actions that were never wired to the outside — static wiring only covered controls present at load; (3) headless rig cannot exercise runtime-built controls or reload persistence realistically.
Lesson: seam coverage, not surface coverage, is the gap. Every runtime-generated control and every cross-boundary state (rooms, reload) needs a named owner and a real-browser check.
Automatic checks added: room appears in the room list after create and survives reload; every search-result row responds to tap; version stamp matches build.
Status: 5.9.execute.5 FAILED. No forward patching. Replan in progress.

## Section B (b1) · REJECTED DIRECTION · Jul 26 2026
Chat-mic-to-waiting-messages, single AudioEngine with cloned call tracks, in-call ribbon transform to [MIC][VOICE][HEAR][TTS], VOICE/HEAR toggles, TTS voicing spoken lines. Owner rejected. Mode & Capability ruling replaces it: chat mic = voice typing only; Ear/TTS in S4b drawer; total mute; control-strip controls. Never rebuild this.

## a7r4 attempt 1 - Jul 29 2026 - PAGE COLLAPSE
Scope was 6 items (languages, flags, TTS label, drawer cleanup, single strip, categories). Two structural failures: (1) call-ctl removal left <div id="call-band"> unclosed, orphaning the transcript, compose, drawer and all modals inside it; (2) the repair used a depth-walk delete that removed the sibling transcript div and compose strip entirely. Page rendered blank. Owner verdict: complete bust. NEVER use as a base.

## a7r4 attempt 2 - Jul 29 2026 - HALF THE RULING
Built from clean a7r3. Merged ctl2 into the ribbon (single strip achieved) and removed the redundant in-video call bar. Structurally sound - syntax, div balance, wire check and runtime stub all passed. But it delivered only half the chrome-strip ruling: no zone model, mic not pinned to centre, no level meter, no timer-as-text, exit icon still in chat. Owner verdict: Frankenstein. Never device-gated, so never a release. NEVER use as a base.

## PROCESS FAILURES RECORDED THE SAME DAY
1. Depth-walk / brace-matching deletes on HTML. Root cause of both a7r4 structural failures. Exact-bounds string replacement only, with assertions that critical siblings (transcript, compose) are NOT inside the block before cutting.
2. Logging a successful push as SHIPPED. A gate is passed only by a confirmed phone test. Part 18 marked a7r4 SHIPPED when it had never been tested - corrected in v7.14.0.
3. Splitting one ruling across two releases. The chrome strip was split a7r4/a7r5, producing a deliberate half-implementation. One ruling, one release.
4. Creating standalone spec artifacts. The plan is the only SOT. A chrome-strip spec file was created and had to be folded into Part 17 and deleted.

## a7r4 attempt 3 (Part 17 rebuild) · FAILED DEVICE GATE · Jul 29 2026
Symptoms on device: mic does not toggle and does not transcribe in chat; phone and video icons rendered with wrong SVG glyphs (iOS mic-style icons instead of the correct phone/video glyphs); in call mode no hang-up button; mic toggle works but no audio detection therefore no transcription or translation; phone and video icons visible during call when they should be gone.
Root causes identified: (1) New ribbon replaced the SVG for mode-phone and mode-video with the mic-meter SVG path (the CAM_SVG and MIC_METER_SVG strings were inserted via Python f-strings into the wrong button slots). (2) The c2-mic button is now a contenteditable SVG element that lost its click->setMic() wiring when ctl2 was deleted — the wire() call that bound it no longer found it. (3) renderModes() references to S.dgConnected and CALL.hangingUp which are not defined in a7r3's scope. (4) The rb-centre absolute positioning broke the ribbon layout on iOS (icons pushed out of tap zone).
Verdict: Approach of rebuilding the ribbon HTML from scratch is too risky for a surgical release. The correct approach is incremental changes to the existing ribbon/ctl2 with exact-string replacements and a DOM rendering check.
NEVER use this file as a base. a7r3 is the baseline.
## turn08 Release 1 attempt 1 (bridge-turn08-post-ship.html) · FAILED DEVICE GATE · Jul 30 2026
Scope: unified ribbon strip states, chat mic wired to Deepgram, exit-to-splash, credential live-verify. Structurally clean — syntax, div balance, wire check and runtime stub all passed pre-push. Failed on physical device: chat-mode mic transcribed and translated correctly, but escalating chat mic straight into a phone or video call produced silence — no transcription, no translation, for the whole call, every time.
Root cause: mount() set CALL.active=true before calling CHATMIC.stop(true). CHATMIC.stop only tears down the Deepgram session when CALL.active is false, so with active already true the guard skipped it — the chat mic's dead audio-graph (built on a stream whose tracks had just been stopped) stayed wired to dgWs/dgAudioCtx. mount()'s own startDeepgram() call then hit the dgActive-already-true skip guard and returned without ever rebinding to the call's own stream. The call ran with a live-looking but silent, orphaned pipeline.
Secondary defect, same file: the mic/camera "off" state recolored the entire glyph (body + lens) red on top of the slash line, not just the slash — at small size this reads as a solid red blob occluding the bottom of the camera icon rather than a clean slash-through.
Replacement: mount() must call stopDeepgram() unconditionally, before any CHATMIC teardown or startDeepgram() call, on every escalation — never rely on the dgActive flag to imply the pipeline is bound to the right stream. Off-state styling shows the red slash only; glyph stroke color does not change.
Rollback executed: bridge-turn08-post-ship.html reverted to unmodified bridge-turn08-ship.html baseline (commit 7b65044370c2dd532f945438d0bf76b9cd460632). NEVER carry attempt 1's mount()/CHATMIC ordering forward — rebuild attempt 2 from bridge-turn08-ship.html with the fix above applied from the start.
