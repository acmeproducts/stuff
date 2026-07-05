<!-- v5.8.2.29 -->
# TALKBRIDGE MASTER PLAN
**Version: 7.0 (PLAN RESET) | 2026-07-04 | Governing document. Repo: github.com/acmeproducts/stuff, path: talkbridge/TALKBRIDGE-MASTER-PLAN.md**

---

# §SOT — SINGLE SOURCE OF TRUTH (declared at reset, 2026-07-04)
After 50+ Turn-08 attempts, authority is consolidated. Exactly three living documents:
1. **This plan** — execution SOT: current stage, specs, ledger. If a session memory, chat summary, or older document disagrees with this file, this file wins.
2. **talkbridge/TALKBRIDGE-GRAVEYARD.md** — failure SOT. Scanned before every build.
3. **talkbridge/device-logs/** — runtime truth. Every device run uploads its unified log; diagnosis reads the log, never guesses.

Superseded / reference-only: TB-TURN06-MASTER.md (historical), TB-GT-WA v2.1 (historical), TB-GT-WA v2.3 (product intent only, not execution), container-turn08-base.html (abandoned lineage, kept as reference), test.html / 2vid.html / phrase-desk.html (read-only pattern authorities), all prior chat sessions (context only, never authority).

---


# PART UC v3 — FLOW PERMUTATION MATRIX. DEV PAUSED until confirmed.

**Core principle (owner, 2026-07-02): ONE TRANSCRIPT.** The room's chat surface and the call transcript are the same surface. A call adds a live-media layer on top of the room; everything spoken lands in the same stream, translated, newest at bottom, next to the same compose strip. There is no separate call transcript anywhere.

**Surfaces:** LIST (room list) · ROOM (the one transcript + compose strip + header w/ presence + call icons) · MEDIA (call layer over ROOM: video, voice-only, controls) · PB (search drawer + overlay, banked bridge product) · KEYS (control-icon credentials) · SYS (OS notifications, install, badge).

| # | Flow | Role | Surfaces | Pass |
|---|---|---|---|---|
| F1 | First open, set name + keys | host | KEYS | one-time; persists |
| F2 | Create room (chat / chat+call) | host | LIST→ROOM | link+QR immediate; call icons only if call-capable |
| F3 | Join via link/QR (fresh or late) | guest | ROOM only | history visible; no LIST/KEYS path |
| F4 | Open existing room | both | LIST→ROOM | presence dots go green both ways; transcript newest-at-bottom; per-msg sent/received/read |
| F5 | Chat, both present | both | ROOM | each reads own language; receipts advance to read |
| F6 | Chat, partner absent | both | ROOM | queued→delivered on return; unread accrues on LIST card |
| F7 | Type in third language | both | ROOM | normalized to own language then partner's; original never shown |
| F8 | PB search from compose ("/" or "..") | both | ROOM+PB | banked rows/behavior; works with no call |
| F9 | PB overlay open/edit/save | both | PB | banked product, unchanged |
| F10 | Save partner's line to PB | both | ROOM→PB | from bubble; dup → "Already saved" |
| F11 | Escalate to video call | both | ROOM→MEDIA | ring → accept → media over ROOM; speech lands in the SAME transcript, translated live |
| F12 | Escalate to voice call | both | ROOM→MEDIA | as F11, no video; transcript is the view |
| F13 | Switch video↔voice mid-call | both | MEDIA | seamless; transcript unbroken |
| F14 | PB during call | both | MEDIA+PB | banked behavior |
| F15 | Hang up | both | MEDIA→ROOM | media layer gone; "call ended" marker; spoken lines remain in stream |
| F16 | Call partner: no answer / reject | caller | ROOM | ring times out or declined marker; room unaffected |
| F17 | Incoming call while in another room | callee | SYS→ROOM | ring/notification routes to right room |
| F18 | Incoming call, room muted | callee | ROOM | no ring; missed-call marker; unread accrues |
| F19 | Mute / unmute room | both | LIST or ROOM info | silences notifs+ring only |
| F20 | Message arrives, app backgrounded | both | SYS | notification → tap → correct ROOM; unread clears |
| F21 | Connection drops mid-call | both | MEDIA | auto-recovery as banked engine; transcript continuity |
| F22 | Exit room / switch rooms | both | ROOM→LIST | per-room isolation: history, languages, presence, PB pair |
| F23 | Delete room → recycle | host | LIST | recoverable; link suspended |
| F24 | Recover room | host | LIST | intact history; link live again |
| F25 | Permanently delete / dispose | host | LIST | one confirm; relay purged; link dead forever |
| F26 | Install to home screen | both | SYS | standalone, own icon |
| F27 | Reopen app (host) | host | LIST | all rooms, unread badges, no re-setup |

Stage tests cite F-numbers. Nothing outside the matrix gets built.

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
- **Room creation asks capability, the initiator's name, the initiator's language, and the partner's language — nothing else.** These four are the actual one-time setup (corrected 2026-07-01; superseded the earlier "capability only, no name field" draft, which did not match the working reference implementation). No account, no settings screen, no other fields.
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

## Initiator designation — DECIDED 2026-07-02
Current mechanism stands as final for pilot: an initiator is whoever holds the working API credentials on their device. A joiner never receives them (session-only, never persisted), so they can't create rooms even if they manipulate the URL. This already works and needs no further changes.

Real people won't personally set up Deepgram/Cloudflare/GitHub accounts to become initiators. That's solved by a separate, out-of-scope companion tool (not part of Turns 07-11) that hands a new initiator their working credentials in one step. Explicitly out of scope for this plan — does not block Turn 08 or any later turn.

## Identity model
- The room/token is the sole real identity — not the name. Names (initiator's, partner's) are editable display labels only; changing a name never breaks or re-routes an existing connection.
- Name + language are captured once at room creation as initial values, then remain editable from within the room at any time.

## Room disposal policy
- Unjoined rooms expire after 30 days and are purged relay-side.
- Joined/active rooms never expire silently — only explicit initiator-driven disposal removes them.
- Disposal is a real relay-side cleanup: token retired, waiting flag cleared, room record purged. Not just hidden client-side.

## Architecture rails (owner-confirmed 2026-07-02, end-state-backwards)
1. The room record is the spine — list card, thread, call, unread, notifications, mute all key off it.
2. The relay connection is an app-level service from Base onward (not call-scoped): chat sync, waiting flags, incoming-call ring, presence all ride one channel.
3. Per-room controls (mute calls, mute notifications, names, languages) live in Room Info.
4. One design system across all surfaces from Base.
5. Call, PB, notifications are attachments mounted over the Thread, never separate destinations.

## The five screens — no more, no fewer
1. **Room List** — initiator's home. Never shown to a joiner.
2. **Room Creation** — capability choice + initiator name + initiator language + partner language. Immediate link+QR. No other setup.
3. **Thread** — chat, used by both. Call button present only in chat+call rooms. Joiner lands here directly.
4. **Call Screen** — bridge engine, reached only from a chat+call Thread.
5. **Room Info / Dispose** — read-only info + one destructive action with one confirmation.

## What exists today
- `bridge-turn06-post-ship.html` (v5.6.4) — working call engine, STT, translation, 17 dormant modules. The floor.
- `test.html` — shell architecture and flow authority (room list, thread, async chat, room-creation flow, identity model). **READ-ONLY — reference only, never built on or modified. Turn 08 Base builds bridge-turn08-base.html from bridge-turn07-post-ship.html, following test.html's patterns.**
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
**CURRENT STAGE: Turn 08 / Pre-ship — CALL-LAYER WAKE (v5.8.2.x). File staged: bridge-turn08-pre-ship.html (byte-copy of confirmed Base). Next build: piece B7a.**

**The architecture that finally holds (locked after attempts 1–28):**
- One file. The shell (test.html lineage: room list, rooms, invites, QR, async chat, presence) is the host.
- The ENTIRE bridge product (call engine, STT, translation, transcript surface, compose strip, phrasebook — the confirmed T07 Post-ship organs, startup-order bug fixed at source) is bundled INTO the file at build time as one sealed, inert module behind a single gate. Its own self-boot is stripped; it wakes only when a room is entered.
- No runtime injection, no DOM surgery, no dual boot. Switching bridge organs on is a build-time decision. This killed the race conditions that caused every prior failure (graveyard G10–G16, 2026-07-03/04 entries).
- Every device run auto-uploads a unified diagnostic log with boot/room-entry/relay checkpoints to talkbridge/device-logs/ — device truth is readable without the device in hand.

**Confirmed on the phone (2026-07-04):** B1 splash-always · B2 make-a-room · B3 one surface per room · B4 hamburger navigation · B5 chat lands in transcript · B6 call icon in every room · B8 "/" and ".." open phrasebook from compose. Locked standard: app always opens to the start screen, left panel closed, never auto-opens a room.

**Remaining in Turn 08:** B7 (call layer, decomposed into B7a–B7f below — Pre-ship), B9 (joiner isolation — Pre-ship), then Ship (wiring: receipts, entry-heal, PB refresh on entry, notifications, dispose), then Post-ship (full regression + SFR freeze).

**Files of record:** bridge-turn08-base.html (confirmed Base host, ~10,016 lines) · bridge-turn08-pre-ship.html (staged) · bridge-turn08-pre-base.html (byte-identical T07 Post-ship — source of bridge organs) · bridge-turn07-post-ship.html (the floor; full working call product).

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

## §PIECE — Ordered piece gate (why the last 40 attempts failed)
When a stage spec lists ordered pieces (e.g. Turn 08 Base B1–B9), they are built strictly in order. One piece at a time. A piece is DONE only when the human did the action on the phone and saw the pass result — never because it lints or passes jsdom. "Compiles" is not "works." The next piece does not start until the current one is confirmed on the phone. A failing piece is fixed in place before anything later is touched; you never jump ahead to a later piece to work around an earlier one. This is the single discipline whose absence caused the repeated Turn 08 failures: the spec was always complete; the build skipped around inside it and gated on lint instead of on the phone.

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

## OPEN ITEMS (not scheduled — parked for later disposition)
| # | Item | Note |
|---|---|---|
| 5 | PB-RENDER (renderCard/renderRow) not activated | Scaffolded modules use a different design system than the live, approved cards — would break pixel parity if turned on. Needs a rebuild-to-match pass against the current live markup before it can replace the working renderer |
| 9 | Category-match dropdown not built | When a search matches multiple categories, show a dropdown below the search box with each category name + match count; tapping one filters to that category in place. Depends on cleaning up source PB category data first |
| 10 | PB search needs a speed strategy for scale | Flat search is fine at ~250 cards but needs to stay real-time-usable in a live conversation as the set grows toward 1500+. Open question: would grouping by starts-with/contains/ends-with (or similar) help, or is a different approach better |
| 11 | Only EN-TH phrasebook exists | PB team to build the reverse pair (TH-EN) next, then EN + top 5 languages and their reverse pairs, then a 10-phase program targeting high-value pairs. Not building every possible language combination |

## CLOSED (Turn 07 Post-ship, 2026-07-01)
| # | Item | Resolution |
|---|---|---|
| 1 | "tb" author initials should read "TB" | Fixed everywhere it's written as an author value. Note: only affects cards saved from now on — existing already-saved cards keep their old value |
| 2 | Remove BT manual-refresh icon | Removed from the new-card save sheet; back-translate result stays always visible, no toggle needed |
| 3 | Duplicate PB card save gives no feedback | Now toasts "Already saved" and stays exactly where the user was — no more jump to the PB surface. Also counts as a use (usage/lastUsed refresh), per spec |
| 4 | PB GitHub write-back timing was wrong | Write-back now fires once, at call end, only. Overlay close no longer writes. Dirty state now survives an unclean close, and is flushed to GitHub at the start of the next call, before that call's phrasebook loads |
| 6 | Tag/clarify footer icons showed a third, wrong-looking color state after closing | Was a stuck touch-tap shading effect, not a real third state — fixed so closed always matches true neutral |
| 7 | BT manual-refresh icon was still present | First pass only removed it from the new-card sheet; it was also on every live card's back-translate row. Now removed everywhere |
| 8 | New card from transcript logged a false "verdict reset" entry | A focus/blur right after creation was wrongly treated as an edit. Now only logs when the text actually changes |

## CURRENT RUN
- RELEASE: Turn 08 / Pre-ship — v5.8.2.x (attempt numbering continues; next build increments)
- STATUS: STAGED. bridge-turn08-pre-ship.html pushed 2026-07-04 as byte-copy of confirmed Base; call-layer wake (B7) not yet built. Build resumes at B7a per the Pre-ship spec below.
- BASE (input): bridge-turn08-base.html — B1–B6, B8 each confirmed on phone 2026-07-04. Sealed bridge module bundled inert; unified diagnostics + crash capture uploading to talkbridge/device-logs/ (one rolling file per device).
- SUPERSEDED LINEAGE: container-turn08-base.html (v5.8.1 re-cut of 2026-07-02) — abandoned; its useful decisions (first-run keys surface, compose PB seam, install support) carry forward as spec, not as code. bridge-turn08-base.html 5147-line engine-activation attempt — failed device gate, graveyard G17; filename since reused by the current confirmed Base.

## PRIOR RUN (Turn 07 Post-ship — CLOSED)
- RELEASE: Turn 07 / Post-ship — v5.7.4
- STATUS: DONE, device-confirmed 2026-07-01. Output: bridge-turn07-post-ship.html, 5111 lines, sha256 prefix 5713b5b41eab (final, incl. corrections for CLOSED items 6-7).
- WORK DONE: Closed Open Items 1-4 — see CLOSED table above. PB surface checksummed into §SFR below; frozen as of this release.
- VERIFIED: 21/21 immutable functions byte-identical. Lint clean.
- PRIOR: Turn 07 Ship DONE (bridge-turn07-ship.html, v5.7.3). Turn 07 Pre-ship DONE (final patch v5.7.2.11). Patch series CLOSED — graveyard G16.
- FIXED THIS SERIES: Enter-on-source commit; verdict as radio pills; tag/clarify inputs keep focus on Enter; every card change logs to clarify; creation vs edit no longer conflated in clarify log; new card at top (upsert was matching by content, overwrote unrelated blanks); header shows created/modified with time; verified-tag removal resets verdict AND visibly unchecks; three historical clarify field formats all render; send button (Go) respects /search same as Enter; search-open lag removed; "tap to use" removed everywhere; send chevron never cut off; search rows no longer compress/overlap; footer toggles resolve white when open; compose X inside input; overlay search X shows with query; trash pinned bottom; BT icon/label removed; transcript-save dedupes and clears stale search; focus outline removed.
- PROCESS RULE (locked, per owner): NO MORE PATCH RELEASES. All work follows stage structure: pre-base → base → pre-ship → ship → post-ship, each turn's post-ship feeds the next turn's pre-base. Master plan updated every release.
- NEXT: device test of bridge-turn07-post-ship.html. Once confirmed, Turn 07 is complete — move to Turn 08.

## §DELTAS — RESOLVED 2026-07-01 (v4.2 realignment). Kept for the record; all four dispositions below are now law in this plan.
1. RESOLVED — §SHIP-RECOVERED content: most built during patch series. PB-QUERY unification is now the core of Turn 07 Ship. Category assignment UI: DEFERRED out of Phase 2 (owner decision 2026-07-01) — categories[] stays schema-only with 'unassigned'; building assignment UI before pilot is scope creep.
2. RESOLVED — GT-WA v2.3 sequence mapped onto this plan's Turns 07–11: GT-WA 07A (initiator designation) → Turn 08 Base foundational work; GT-WA 07B (shell) → Turn 08 Pre-ship/Ship; GT-WA 08 (normalization) → Turn 09; GT-WA 09/10 (token, multi-device) → Turn 10; GT-WA 11 (presence/disposal) → Turn 11 Base; GT-WA 12/13/14 (design, installable, pilot) → Turn 11 Pre-ship/Ship/Post-ship + PWA install in Turn 08 Base. This plan's turn specs are the single execution sequence; GT-WA v2.3 remains the product-intent contract.
3. RESOLVED — GT-WA v2.3 out-of-scope list adopted: O-Ring, Translation Memory, PB Central live telemetry, industrial infra hardening, post-creation capability change, encryption at rest — all OUT of Phase 2. Also deferred: category assignment UI (per #1).
4. RESOLVED — Turn 07 Ship re-cut in place (see Turn 07 Ship spec).

## RUN HISTORY (append-only, newest first)
- 2026-07-04 T08 Pre-ship -- STAGED. bridge-turn08-pre-ship.html byte-copy of confirmed Base. Call-layer wake begun, not completed; resumes at B7a under plan v7.0 spec.
- 2026-07-04 T08 Base -- CONFIRMED ON PHONE piece by piece: B1, B2, B3, B4, B5, B6, B8 all passed device gates. Single room type locked (every room can call). Start-screen standard locked. Crash capture + unified device-log upload added (v5.8.2.23/.24). Sealed-bridge-module architecture proven (fingerprint 82879653b94b90dd at v5.8.2.21).
- 2026-07-03/04 T08 Pre-ship attempts 1-28 -- FAILED, buried (graveyard 2026-07-03/04 entries). Three root causes found and fixed: bridge startup-order bug, stale dormant block in base, shell auto-open-last-room. Runtime-injection merge strategy abandoned permanently in favor of build-time sealed module.
- 2026-07-02 T08 Base (re-cut) -- DONE pending device test. container-turn08-base.html v5.8.1, 5275 lines, sha 12ca81708709. test.html foundation + first-run keys setup + capability + call seam + composer PB seam + install support. Lint clean.
- 2026-07-02 T08 Base (attempt 1) -- FAILED device gate. Lang-model indicator stuck amber on acmeproducts.github.io hosting; room creation blocked. Owner rolled back and re-cut Base scope (container-first, new first-run onboarding, shared compose strip, call-as-overlay). Graveyard G17. Baseline stands at bridge-turn08-pre-base.html.
- 2026-07-01 T08 Base -- DONE pending device test. bridge-turn08-base.html v5.8.1, 5147 lines. Nine engine modules activated flag-guarded; NORMALIZE implemented; SW + manifest + INITIATOR-DECISION.md pushed. 21/21 immutables, all SFR PB regions byte-identical, lint clean. SFR pbCommitSrcEdit entry rebased (see registry) — registry value predated the two T07 post-ship correction commits; function is byte-identical to the device-confirmed T07 final.
- 2026-07-01 T08 Pre-base -- DONE pending device negative test. bridge-turn08-pre-base.html byte-identical to bridge-turn07-post-ship.html final (5111 lines, sha 5713b5b41eab). Ledger sha for T07 Post-ship corrected (was stale pre-correction value).
- 2026-07-01 T07 Post-ship -- CLOSED, device-confirmed by owner. Final file 5111 lines, sha 5713b5b41eab after two correction commits (CLOSED items 6-7).
- 2026-07-01 T07 Ship -- DONE pending device test. bridge-turn07-ship.html, 5096 lines, sha256 prefix 272f9f9d5372, v5.7.3. PB-QUERY is now the real filter engine (pbSearch delegates to it, output diff-verified identical). COMPOSE-SEAM wired into chatGo; closed a real pre-existing gap (".." predicate was unguarded on submit). PB-RENDER stays dormant — scaffold doesn't match live design, needs its own rebuild pass, logged to Open Items rather than forced. 21/21 immutables verified, lint clean, full diff reviewed.
- 2026-07-01 T07 Pre-ship -- DONE, device-confirmed at v5.7.2.8 (bridge-turn07-pre-ship.html). Patch series v5.7.2.1-v5.7.2.8 closed permanently (graveyard G16). Plan v4.2 realignment same day: Ship re-cut, initiator decision placed in T08 Base, Surface Freeze Registry (Part 5 SFR) added, version stamps T08-T11 corrected.
- 2026-07-01 T07 Base+Pre-ship -- card renderer pulled forward from Ship per explicit direction: catalog chips structurally deleted, footer 4->3 icons, BT+verdict always visible as full-width pills. Base sha 0ccda6ef (still v5.7.1), Pre-ship rebuilt on top sha d0c27309 (v5.7.2). Diffed to confirm no drift beyond the PB-SYNC/PB-USAGE layer.
- 2026-07-01 T07 Pre-ship -- full rebuild from corrected Base (not a patch). 4870 lines, sha prefix 6bcbdf455264, v5.7.2. PB-SYNC + PB-USAGE active, sync footer wired to real pull/writeBack state, 21/21 immutables, lint clean.
- 2026-07-01 T07 Base -- corrected at the root (still v5.7.1): pbRenderOverlay cats.length bug fixed, ribbon reduced to + and close only, dead catalog/CDN buttons removed, sticky sync footer added. sha prefix 900df96ff3ba. 21/21 immutables re-verified.
- 2026-07-01 T07 Pre-ship -- [SUPERSEDED] patched pbRenderOverlay fix directly into Pre-ship rather than fixing Base. Wrong per explicit rule (never patch forward). Rebuilt above.
- 2026-07-01 T07 Pre-ship -- DONE pending device test. 4851 lines, sha prefix 0e5105000619, v5.7.2. PB-SYNC + PB-USAGE active, two scaffold bugs fixed (usage-persist, offline-retry), markDirty wired at the pbSaveCards choke point. 21/21 immutables, lint clean.
- 2026-07-01 T07 Base -- DONE, device test confirmed. 4812 lines, sha prefix 9b416c8597d7, v5.7.1. PB-DATA.norm:in/out observed firing on overlay open; canonical + legacy fields both present as designed.
- 2026-07-01 T07 Pre-base -- DONE. bridge-turn07-pre-base.html = bridge-turn06-post-ship.html byte-identical. 4780 lines, sha prefix a73aecbf. Negative test pass.
- 2026-06-30 T06 Post-ship -- DONE. v5.6.4, sha prefix a73aecbf, 4780 lines. Device gate pass.
- 2026-06-30 T06 Ship -- DONE. v5.6.3. 21/21 immutables. Fixtures pass. Device gate pass.
- 2026-06-30 T06 Pre-ship -- DONE. v5.6.2. 21/21 immutables. Device gate pass.

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

### Base — Status: DONE (device-confirmed)
**Deliver:** bridge-turn07-base.html, v5.7.1
**Work:** Activate PB-DATA. Wire old storage functions (pbGetCards, pbSaveCards, pbNorm) to redirect into PB-DATA. All callers now receive cards in the new canonical schema. Old fields stripped on load: catalogIds, intentId, fingerprint, relatedIntents, confidence, semanticRelationships, parentCategory, primaryTag. pbBubbleHtml (old renderer) stays live — PB-RENDER not active yet.
**References:** Part 4 §4M.12 (canonical schema). Part 5 §IMM.
**Test (positive):** Open on phone. Overlay shows cards via old renderer. Debug log shows PB-DATA.norm:in/out for each card. Card objects in log show categories[] not catalogIds. Call and transcript unaffected.

### Pre-ship — Status: DONE (device-confirmed at v5.7.2.8; patch series closed)
**Deliver:** bridge-turn07-pre-ship.html, v5.7.2 (final: v5.7.2.8)
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

### Ship — Status: DONE, device-confirmed (scope RE-CUT 2026-07-01 — the v5.7.2.x patch series already built most of §SHIP-RECOVERED's display surface; do NOT rebuild what is working)
**Deliver:** bridge-turn07-ship.html, v5.7.3
**Input:** bridge-turn07-pre-ship.html v5.7.2.8 — the working, device-approved PB surface. The acceptance bar for everything visual is PIXEL-IDENTICAL to v5.7.2.8. Any visible change to the PB cards, overlay, ribbon, or compose strip = reject.
**Work (exactly three items, nothing else):**
1. **PB-QUERY activation — one search engine.** Overlay search and the compose /-drawer both route through PB-QUERY.query({text,pair,cards}). Ad-hoc/duplicate search paths deleted. -exclude prefix works. Flag use.PB_QUERY → true.
2. **Renderer contract formalization.** The card/row rendering built during the patch series moves under the PB-RENDER module contract (renderCard/renderRow, module log points per Part 4). Any remaining pbBubbleHtml/legacy render path deleted. Output HTML is byte-identical to what v5.7.2.8 produces for the same card — this is verifiable, not aesthetic. Flag use.PB_RENDER → true.
3. **COMPOSE-SEAM contract check.** No new build expected — the /-drawer and guards were built in the patch series. Verify E1–E8 pass and the seam logs per contract; wire log points if missing. Flag use.COMPOSE_SEAM → true.
**Explicitly NOT in this stage:** any layout change, any new UI element, category assignment UI (deferred out of Phase 2), pbAddCard rework (Post-ship item F1 only if broken).
**References:** Part 4 §4M.14, §4M.15. §SHIP-RECOVERED remains the historical detail record for what the patch series built — use it to verify, not to rebuild.
**Test (positive):**
- Overlay search → rows; clear → cards return. Search results identical before/after for the same query set.
- /bank + Enter in chat → NOT sent; overlay opens searching "bank". /bank + tap Send → NOT sent. Normal message sends.
- Full 17-item table in §SHIP-RECOVERED passes. All A1–G6 pass.
- Rendering spot-check: three cards (one with tags, one with clarify entries, one flagged) render identical to v5.7.2.8.

### Post-ship — Status: DONE, device-confirmed. TURN 07 CLOSED.
**Deliver:** bridge-turn07-post-ship.html, v5.7.4
**Work done:** Open Items 1-4 closed (TB capitalization, BT icon removed, dup-save toast with no context switch, write-back batched to call-end + startup flush). §SFR populated below — PB surface is frozen.
**Test:** Device confirmation pending. Input to Turn 08 Pre-base once confirmed.

---

## §SHIP-RECOVERED — Full Ship-stage spec (recovered from TB-TURN06-MASTER.md, 2026-06-24)

This document existed in project knowledge, was the actual detailed Ship-stage plan for the PB subsystem, and never made it into this file when it was rewritten into its current leaner form. Recovered here in full so it isn't lost a second time. Function names below are adapted from the Turn 06 draft to the module structure Turn 07 actually built (PB_DATA / PB_SYNC / PB_USAGE already exist and are active as of Base+Pre-ship — do not rebuild them, wire the ribbon/renderer against them).

### Principle
Ship is the complete replacement of the entire PB *display* subsystem — old ribbon, old catalog-era buttons, old bubble renderer all out; new system in; nothing coexisting. Pre-ship already gave PB-DATA/PB-SYNC/PB-USAGE a working data layer underneath the old renderer as a deliberate bridge — Ship is where the renderer catches up to that data layer and the old one is deleted, not patched further.

### Overlay ribbon — final layout
```
[pair label: 🇺🇸 → 🇹🇭 en-th-1001]   [+]   [save/disk icon]   [sync dot]   [× close]
```
- Pair label (`#pb-ov-pair-label`): flag emoji + arrow + current loaded filename, left-aligned, flex:1, ellipsis-truncated.
- `+` → `pbAddCard({})` (see below).
- Save/disk icon → `PB_SYNC.writeBack()` directly (manual save-now, in addition to the automatic dirty-triggered writeBack on hangup/close already wired).
- Sync dot (`#pb-ov-sync-dot`, 8px circle): grey = idle/clean, amber = dirty/pending, green = just-saved (brief), red = error. Driven by a `pbOvUpdateSyncDot(status)` function called after every PB_SYNC operation.
- Close (`×`) → `pbCloseOverlay()`.
- No back arrow (redundant with close — already removed in Base). No import/export/download buttons (already removed in Base).

Current Base/Pre-ship state has a simplified version of this (`+` and `×` only, static footer text) as an interim step — Ship is where pair label, save icon, and sync dot get added on top of that, using the already-live PB_SYNC state (`PB_SYNC.isDirty()`) to drive the dot instead of inventing new state.

### Overlay footer
Sticky, bottom of overlay: `TalkBridge · <span id="pb-ov-fn">no file loaded</span>`. Already partially built in Base (`#pb-ov-footer`, wired to `_pbLastPull` set by PB_SYNC.pull/writeBack) — Ship should keep this mechanism, just confirm live-timestamp formatting matches (`current as of <date> <time>`, updates on every successful pull or writeBack, not just on overlay open).

### pbAddCard(opts) — replaces the deleted NC system entirely
- Sets `categories:['unassigned']`, `createdBy` from current user context, `backtranslate.verdict:'pending'`.
- Runs `translateWithRetry` at birth to populate initial backtranslate.
- Saves via `pbSaveCard()` → routes through `pbSaveCards()` → `PB_DATA.save()` + `PB_SYNC.markDirty()` (already wired as of Pre-ship — pbAddCard just needs to call the existing `pbSaveCard`, not reinvent persistence).
- Opens overlay, new card visible immediately, scrolled into view.
- Entry points: transcript "save to phrasebook" action → `pbAddCard({source,target,sourceLang,targetLang})`; overlay `+` button → `pbAddCard({})` (blank card, cursor in source).

### pbRenderOverlay — final version (do not keep the Base interim gate)
Base's interim fix (`pbGetAllCards().length` instead of `pbGetCats().length`) was a minimal correctness fix, not the final design. Ship's version should hard-scope to the active room pair instead of showing everything:
```javascript
function pbRenderOverlay(){
  var host=document.getElementById('pb-ov-cards');if(!host)return;
  var q=((document.getElementById('pb-ov-search')||{}).value||'').trim();
  var cards=pbGetCards().filter(function(c){
    if(!room.myLang||!room.theirLang)return true;
    return(c.sourceLang===room.myLang&&c.targetLang===room.theirLang)
      ||(c.sourceLang===room.theirLang&&c.targetLang===room.myLang);
  });
  if(q)cards=pbSearch(q,cards); // or PB-QUERY.query(...) once that module is active
  var trashedCards=pbGetAllCards().filter(function(c){return c.deletedAt;});
  if(!cards.length&&!trashedCards.length){
    host.innerHTML='<div style="padding:32px 16px;text-align:center;color:#94a3b8;font-size:14px;">No phrases yet. Tap + to add.</div>';
    return;
  }
  var html=q?(cards.map(function(c,i){return PB_RENDER.renderRow(c);}).join(''))
    :cards.map(function(c){return PB_RENDER.renderCard(c);}).join('');
  html+=pbTrashSectionHtml(trashedCards);
  host.innerHTML=html;
}
```
(Written against `pbSearch`/plain functions above since that's what exists pre-Ship; swap in PB-QUERY/PB-RENDER method calls once those modules are the activated path — the filtering/scoping logic itself is what needed recovering, not the exact call signatures.)

### Card layout (PB-RENDER.renderCard / the old pbBubbleHtml being replaced)
Bridge element IDs (not phrase-desk's own IDs — these must match what Bridge's existing event handlers expect):

| Element | ID pattern |
|---|---|
| Card wrapper | `pbb-{id}` |
| Source field | `pbsrc-{id}` |
| Target field | `pbtgt-{id}` |
| Back-translate text | `pb-bt-text-{id}` |
| Tag drawer | `pbtags-{id}` |
| Tag chips container | `pb-tc-{id}` |
| Tag input | `pb-ti-{id}` |
| Tag suggestions | `pb-ts-{id}` |
| Clarify drawer | `pbclarify-{id}` |
| Clarify thread | `pb-cc-{id}` |
| Clarify input | `pb-ci-{id}` |

Layout, top to bottom:
1. **Header row**: `createdBy · date time`, dark readable text (not muted/faint).
2. **Body row**: source (contenteditable, 10px padding, Enter→commit, blur→commit) + USE (source lang) + TTS | target (contenteditable) + USE + TTS, side by side.
3. **Back-translate row**: always visible, plus TTS — no toggle, no drawer, no hide state.
4. **Verdict row**: two full-width pills — ✓ Sounds Good | ⚑ Flag.
5. **Footer row**: exactly 3 icons, grid — # (tags) | clarify bubble | trash. No text labels, no 4th icon, no BT-drawer toggle (BT is always visible per #3).
6. **Tag drawer**: pills with ×, tag input with autocomplete suggestions — hidden by default, preserved from Base exactly (this part already works, don't rebuild).
7. **Clarify drawer**: scrollable thread — author shown as `createdBy`/`updatedBy` (`tb`/`pb`/`xl` or real initials if XL team sets them), timestamp, text, × to remove. Hidden by default.

Event wiring that must survive the rebuild (already correct in Base, just needs porting to the new renderer, not reinvented):
- `pbCommitSrcEdit` resets verdict to `'pending'` on blur or Enter, even if source text is unchanged. Pushes to clarifyChain: `"Was: <old source>"` only if text actually changed, plus a verdict-reset entry always (regardless of whether text changed) — two possible entries, not one.
- `pbAddClarify`, `pbSetVerdict`, `pbAddTag`/`pbRemoveTag` all push to clarifyChain.
- Soft delete via trash icon → `pbSoftDelete()`.
- Enter in source fires the same commit path as blur (not a separate handler).

### The clarify-input focus fix (the one known functional bug in phrase-desk.html itself)
```javascript
function onClarifyKeydown(e,el){
  if(!(e.key==='Enter'&&!e.shiftKey))return;
  e.preventDefault();e.stopPropagation();
  var id=el.getAttribute('data-cardid');
  var v=el.value.trim();if(!v)return;
  var card=pbGetCardById(id);if(!card)return;
  if(!card.clarifyChain)card.clarifyChain=[];
  var ts=new Date().toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  card.clarifyChain.push({ini:'TB',ts:ts,txt:v});
  card.updatedAt=Date.now();pbSaveCard(card);
  el.value='';
  var cc=document.getElementById('pb-cc-'+id);
  if(cc){cc.appendChild(_pbBuildClarifyEl('TB',ts,v));cc.scrollTop=cc.scrollHeight;}
  el.focus(); // ← the fix. Without this line, Enter appears to do nothing — input keeps
              //   text-looking-stuck focus but doesn't visibly respond, which reads as
              //   "clarify doesn't respond to Enter" even though the entry was saved.
}
```

### Search rows (PB-RENDER.renderRow / pbOvRowHtml, pbIRowHtml)
Source + TTS + `>` send | target + TTS + `>` send, side by side. No "tap to use" text label anywhere — icon-only actions.

### Slash-drawer cleanup (separate surface from the overlay ribbon — the `//` compose menu)
Remove chips wired to the deleted functions: `pbOpenNewCardForContext` (if still chip-wired anywhere beyond the ribbon `+`), `pbTriggerImport`, `pbExportPrompt`, `pbOpenBooksModal`. Wire the remaining `+` chip to `pbAddCard({})`.

### 17-item Ship acceptance table
| # | What to do | Expected result |
|---|---|---|
| 1 | Start call with existing PB file on GitHub | Cards load in overlay without opening it |
| 2 | Start call with no PB file | Toast "No shared phrasebook yet", call connects normally |
| 3 | Speak during call | Transcription fires, translation appears — no regression |
| 4 | Type in chat | Translation appears — no regression |
| 5 | Open PB overlay | Cards visible in phrase-desk layout |
| 6 | Tap + | New card, source focused |
| 7 | Type source, press Enter | Target and BT populate inline, keyboard stays up |
| 8 | Tag drawer: type tag, Enter | Tag pill appears, input stays focused |
| 9 | Clarify drawer: type note, Enter | Note appears in thread, input clears AND refocuses |
| 10 | Tap Sounds Good | Verdict set, logged to clarify chain |
| 11 | Tap trash | Card soft-deleted |
| 12 | Tap save icon in ribbon | Write-back fires if dirty |
| 13 | Close overlay (dirty) | Write-back fires |
| 14 | Hang up (dirty) | Write-back fires |
| 15 | Search in overlay | Search results in row format, no crash |
| 16 | Save from transcript | Card appears in overlay |
| 17 | Pair label in ribbon | Shows flag emojis + filename |

---

## TURN 08 — Room Container Design + Build
Input: bridge-turn07-post-ship.html (call engine), test.html (shell), 2vid.html (call-overlay visual).

**Root problem solved by this turn:** Bridge and test exist as separate applications. No unified container definition exists for what a "room" is, how chat/call/transcript/phrasebook live together, or what surfaces exist in what states. This turn defines and builds that container.

**The room container:** A unified chat surface (from test/2vid) that can optionally overlay a call (from bridge's engine) without surface switching. One transcript. One compose. Phrasebook accessible from both. Call is an overlay that mounts on top of the Thread, not a separate screen.

### Pre-base — Status: DONE pending device negative test
**Deliver:** bridge-turn08-pre-base.html
**Work:** Copy bridge-turn07-post-ship.html byte-for-byte.
**Test (negative):** Identical to T07 post-ship.

### Base — Status: IN PROGRESS — BUILT PIECE BY PIECE, PHONE-GATED

**Deliver:** container-turn08-base.html, v5.8.1

**How this is built — the process fix.** The container is built one small piece at a time. Each piece is a single thing you can see and do on the phone. A piece is not started until the piece before it passed on the phone. No piece is "done because it lints" — done means you did the action and saw the result. If a piece fails, it is fixed in place before anything after it is touched. This is the whole change: small, ordered, phone-tested, no jumping ahead.

**LOCKED STANDARD (approved on phone 2026-07-04):** The app always opens to the start screen on the right, with the left panel closed. It never auto-opens a room. This is the confirmed baseline; all further work builds on top of it and must not regress it.

**The pieces, in build order. Each has what you'll see, what you do, and what counts as pass.**

**B1 — Splash always. [DONE on phone]**
- See: open the app cold, you land on the room list every time.
- Do: close and reopen with rooms already there.
- Pass: never drops you into the last room; always the list.

**B2 — Make a room. [DONE on phone]**
- See: a "+" makes a room; a link and QR appear right away.
- Do: make one.
- Pass: it appears in the list; link/QR shown instantly, no wait screen. Every room can call — no room-type choice.

**B3 — Enter a room = the one surface. [DONE on phone]**
- See: tapping a room opens the transcript with the compose strip at the bottom. Same surface every room.
- Do: enter one room, back out, enter another.
- Pass: identical surface each time; no theme flip, no second layout, no jump.

**B4 — Leave a room by the hamburger. [DONE on phone]**
- See: the left panel opens from the hamburger; picking another room switches to it.
- Do: open panel, switch rooms.
- Pass: that is the way out of a room; entering a room never auto-switches you anywhere.

**B5 — Chat lands in the transcript. [DONE on phone]**
- See: what you send appears in the one transcript, newest at the bottom.
- Do: send a few messages.
- Pass: they stack in order in the same surface; nothing opens a separate view.

**B6 — Call icon always present. [DONE on phone]**
- See: every room shows a call icon in the header.
- Do: open a room.
- Pass: call icon is there; every room can call.

**B7 — Call is a layer over the transcript (stub).**
- See: tapping the call icon brings the video/voice layer over the same transcript, not a new screen. (Engine itself is wired in Pre-ship; Base proves the layer mounts and unmounts over the one surface.)
- Do: open the call layer, close it.
- Pass: transcript stays put underneath; closing leaves a "call ended" marker in the same stream; the surface never switched.

**B8 — Phrasebook reachable from the strip. [DONE on phone]**
- See: "/" or ".." from the compose strip opens phrasebook search in the room.
- Do: open it with no call running.
- Pass: it opens over the transcript and closes back to it; no call needed.

**B9 — Joiner sees one room only.**
- See: opening a join link lands straight in that room's transcript.
- Do: open a join link; try to reach the room list or make a room.
- Pass: no path to the list or to room-making exists from a joined room.

**References:** test.html (list + room surface), 2vid.html (call-layer look), phrase-desk.html (phrasebook), bridge call engine (wired in Pre-ship, stubbed here).

**Base is done when B1–B9 each passed on the phone, in order.**

### Pre-ship — Status: IN PROGRESS — CALL-LAYER WAKE, PHONE-GATED PIECES (supersedes the 2026-07-02 TRANSPLANT spec; the transplant already happened at Base via the sealed module)
**Deliver:** bridge-turn08-pre-ship.html, v5.8.2.x
**Input:** bridge-turn08-base.html (confirmed). The bridge organs are already in the file, sealed and inert. Pre-ship = waking them, one observable piece at a time, per §PIECE. Every piece is verified two ways: the action on the phone, and the checkpoint lines in the uploaded device log. A red piece is fixed in place; nothing later starts first.

**B7a — Relay alive on room entry.**
- See: enter a room; nothing visibly changes yet.
- Pass: device log shows relay connected for that room; second device in the same room shows presence green both ways.

**B7b — Cross-device chat with translation.**
- See: message typed on one phone lands on the other phone in the one transcript, in the reader's language, newest at bottom.
- Pass: both directions work; original language never shown to the reader; log shows send/receive checkpoints.

**B7c — Mic without a call.**
- See: mic from the compose strip; speak; your line lands live-transcribed and translated in the same transcript. No call running.
- Pass: spoken line appears on both devices translated; log shows STT start/stop.

**B7d — Ring.**
- See: call icon rings the partner's device in the correct room; accept and decline both leave the right marker in the transcript.
- Pass: ring, accept path, decline path, timeout path each verified; room unaffected on decline/timeout.

**B7e — Voice call connects.**
- See: accepted call mounts the media layer OVER the transcript (2vid look, minus floating windows), camera off by default. Speech both ways lands translated in the SAME transcript.
- Pass: two-device voice call with live translated transcript; transcript never switches surface.

**B7f — Video toggle + hang up.**
- See: video on/off mid-call is seamless; hang up unmounts the layer, "call ended" marker in the stream, spoken lines remain.
- Pass: toggle both ways; hang up from either side returns both to the Thread cleanly; no goodbye screen.

**B9 — Joiner sees one room only.**
- See: join link lands straight in that room's transcript; no path to the room list or room creation exists (data/routing layer, not hidden buttons).
- Pass: URL editing, back button, navigation all fail to escape the room.

**Per-piece process:** graveyard scan → one build → lint → module fingerprint verified → push → phone test → log check → ledger update. Rollback of that piece only on red.
**References:** Part 7, Part 5 §IMM/§SFR, 2vid.html (call-layer look), phrase-desk.html.
**Pre-ship is done when B7a–B7f and B9 each passed on the phone, in order. Then run the F-matrix subset: F3, F4, F5, F7, F8, F11, F12, F13, F15, F16, F22.**

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn08-ship.html, v5.8.3
**Work:** Push notifications wired to correct room Thread. Room Info screen complete with dispose flow: one confirmation → dispose call issued and room removed from Room List + join link invalidated. (Full relay-side lifecycle policy — expiry windows, orphan-free cleanup verification — is Turn 11 Base scope; this stage builds the screen and the dispose call, Turn 11 owns the policy.)
**Test (positive):**
- App backgrounded → notification → opens correct Thread.
- Dispose → one confirmation → room gone from Room List, relay cleaned up, join link returns error.
- Two-device full call: Galaxy initiator + iPhone joiner, translation + PB both work.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn08-post-ship.html, v5.8.4
**Work:** Full regression. All T07 A1–G6 + G1–G6 pass inside merged app. Edge cases. **Then: extend §SFR** — freeze the call engine surface, the nine engine module blocks, and the five shell surfaces (checksums recorded and pushed with the ledger update).
**Test:** Full two-device regression all surfaces. §SFR updated. Input to Turn 09 Pre-base.

---

## TURN 09 — Single Translation Path
Input: bridge-turn08-post-ship.html. (GT-WA v2.3 §Turn 08 — language normalization in the call path.)

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn09-pre-base.html. Copy T08 post-ship byte-for-byte.
**Test (negative):** Identical to T08 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn09-base.html, v5.9.1
**Work:** NORMALIZE is sole translation entry for chat AND call. Z→X→Y at one shared place. Dead parallel routes removed.
**Test (positive):** Speak → correct. Type → correct. Third language → routes through your preferred language first. Original never shown. One log event per translation.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn09-pre-ship.html, v5.9.2
**Work:** PB card send, use, search all through NORMALIZE. No duplicate events.
**Test (positive):** Send PB card → one translation event in log. Chat and call translation log shape identical.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn09-ship.html, v5.9.3
**Work:** All dead routes removed. Full regression.
**Test:** Full A1–G6 + G1–G6. Every translation → exactly one event through NORMALIZE.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn09-post-ship.html, v5.9.4
**Work:** Edge cases. §SFR re-baseline: translation-path regions declared in-scope this turn get new frozen checksums recorded. Input to Turn 10 Pre-base.

---

## TURN 10 — Token Identity + Multi-device
Input: bridge-turn09-post-ship.html. (GT-WA v2.3 §Turn 09/10.)

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn10-pre-base.html. Copy T09 post-ship byte-for-byte.
**Test (negative):** Identical to T09 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn10-base.html, v5.10.1
**Work:** Token is sole identity. pairKey name-concatenation fully removed. Room ownership, joiner recognition, routing all keyed on token only.
**Test (positive):** Create room on Galaxy, open join link on iPhone → recognized as joiner by token. Debug log shows no name-derived routing anywhere.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn10-pre-ship.html, v5.10.2
**Work:** Two-device chat sync. Messages from either device appear on both Threads in real time.
**Test (positive):** Galaxy sends → iPhone sees it. iPhone sends → Galaxy sees it. Both speaker-centric.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn10-ship.html, v5.10.3
**Work:** Cross-device call. Ring on second device. Answer from either.
**Test (positive):** Galaxy in room → iPhone joins → Galaxy calls → iPhone rings → answer → call connects with translation both directions.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn10-post-ship.html, v5.10.4
**Work:** Drop mid-call, rejoin, re-create edge cases. Full regression. §SFR re-baseline for identity/routing regions declared in-scope this turn. Input to Turn 11 Pre-base.

---

## TURN 11 — Presence + Design + Pilot
Input: bridge-turn10-post-ship.html. (GT-WA v2.3 §Turn 11 + §Turn 12/13/14.)

### Pre-base — Status: NOT STARTED
**Deliver:** bridge-turn11-pre-base.html. Copy T10 post-ship byte-for-byte.
**Test (negative):** Identical to T10 post-ship.

### Base — Status: NOT STARTED
**Deliver:** bridge-turn11-base.html, v5.11.1
**Work:** Relay presence contract live. Per-room mute enforced (muted room: no ring on incoming call, no message notification; unread state still accrues silently). Disposal policy: unjoined rooms expire 30 days, joined rooms never silently expire, dispose retires token + purges relay. Waiting indicator in Thread for initiator pre-join, survives backgrounding.
**Test (positive — GT-WA §Turn 11 acceptance criteria):**
- A messages B while B offline → waiting flag set relay-side.
- B opens app → flag retrieved and cleared.
- Room created, never joined, window elapses (test with shortened window) → purged from relay.
- Active joined room, long idle → persists, no silent expiry.
- Dispose → confirmation → token retired, no orphaned relay state, join link returns error.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn11-pre-ship.html, v5.11.2
**Work:** All hardcoded color/size/spacing → CONFIG token keys — explicitly including every visible surface: bubble/card body, footer, header, icons, and all text, across every state (neutral/open/hover/active), not just base colors. Confirmed already in scope as of this plan version; called out explicitly here per owner direction so there's no ambiguity. This stage touches frozen surfaces BY DESIGN — the stage spec here declares ALL registered §SFR regions in-scope for token substitution only; the deterministic acceptance criterion is: default settings render identical to prior release (test below). §SFR re-baselined at Post-ship. Two independent persisted axes: font scale and theme preset — both user-adjustable and persisted.
**Test (positive):** Change font size → all surfaces larger. Change theme → all surfaces recolor. Reset one → other unchanged. Close and reopen → both persist. Default settings look identical to prior release.

### Ship — Status: NOT STARTED
**Deliver:** bridge-turn11-ship.html, v5.11.3
**Work:** Push notifications when app fully closed. Unread counts + last-message preview in Room List live. Design consistent across all five surfaces and PB.
**Test (positive):** Force-close app. Message arrives. Notification → correct Thread opens. Unread dot → read → clears. All surfaces visually coherent.

### Post-ship — Status: NOT STARTED
**Deliver:** bridge-turn11-post-ship.html, v5.11.4
**Work:** Full §SFR re-baseline (final). Full regression T07–T11, Galaxy + iPhone. GT-WA §Turn 14 pilot criteria: full lifecycle (create → capability → invite → joiner lands → async message → call if applicable → second device → closed → notified → reopened). Configurability proof: change theme/font/labels/capability via CONFIG, no code rebuild.
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
- `create(capability,name,myLang,theirLang)→room` (capability: 'chat' | 'chatcall'; name/langs editable post-creation, token is the real identity) | `join(token)→roomView` | `dispose(id)` | `listForOwner()→rooms` | `get(id)→room` | `rename(id,name)` | `setLang(id,myLang,theirLang)`.
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
- Text supports `-exclude` prefix. Searches source, target, tags, clarify text, and categories fields — not phrase text alone.
- **Category-match dropdown (spec added 2026-07-02, not yet built):** if a query's matches span more than one category, show a dropdown under the search box listing each matching category by name with its match count. Tapping a category filters results to that category only, staying in the same search view — no navigation away.

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

## §SFR — Surface Freeze Registry
Purpose: once a surface passes its final gate for a turn and is approved on device, its code regions are checksum-registered here so every later stage PROVES it did not touch approved work. This does not block planned rework — it forces planned rework to be declared.

**Rules:**
1. Checksum method: identical to §IMM (sha256 first 12 hex, function-body extraction; HTML regions hashed between named boundary comments).
2. A stage may change a frozen region ONLY if that turn's spec names the region as in-scope AND states a deterministic acceptance criterion for it. Otherwise: any registered sha12 that differs from this table = automatic NOT READY at §PDG.
3. §PDG gains item 9: recompute every registered checksum; every mismatch must map to an in-scope declaration in the current stage spec.
4. Re-baselining: when a turn legitimately changes frozen regions, the new checksums are recorded here at that turn's Post-ship, in the same commit as the ledger update. The old values move to a REBASED note (date + turn), never silently overwritten.
5. Population schedule: PB surface → T07 Post-ship. Call engine + nine engine modules + five shell surfaces → T08 Post-ship. Translation path → T09 Post-ship. Identity/routing → T10 Post-ship. Final full re-baseline → T11 Post-ship.

**Registry (populated at T07 Post-ship, 2026-07-01):**
| Surface | Region | sha12 | Frozen at | Rebased |
|---|---|---|---|---|
| PB module | PB-DATA | 3ec2efe5526f | T07 Post-ship | |
| PB module | PB-SYNC | 15b171e435ea | T07 Post-ship | |
| PB module | PB-USAGE | 40ca5ebb18af | T07 Post-ship | |
| PB module | PB-QUERY | a00d36e7208b | T07 Post-ship | |
| PB module | PB-RENDER (dormant) | 4c9986b20ce1 | T07 Post-ship | |
| PB module | COMPOSE-SEAM | fa641f39d320 | T07 Post-ship | |
| PB function | pbAddCard | ecf022ff261d | T07 Post-ship | |
| PB function | pbUpsert | 5e9d618565c5 | T07 Post-ship | |
| PB function | pbSaveCard | 66b8b73df318 | T07 Post-ship | |
| PB function | pbSaveNewCard | 63856442fb78 | T07 Post-ship | |
| PB function | pbBubbleHtml | 215406b987a0 | T07 Post-ship | |
| PB function | pbCommitSrcEdit | f0050e64d146 | T07 Post-ship | REBASED 2026-07-01 T08 Base: registry value cf4bfcd7e0ed predated T07 post-ship correction commits (CLOSED items 6-7); f0050e64d146 is the device-confirmed T07 final |
| PB function | pbSearch | b0251853bd33 | T07 Post-ship | |
| PB function | pbRenderOverlay | 569436a97900 | T07 Post-ship | |
| PB function | pbCloseOverlay | 15a0f73bc9f4 | T07 Post-ship | |
| PB function | _pbSyncOnEnter | f8c163eb6158 | T07 Post-ship | |
| PB function | _pbSyncOnLeave | 6ac07ee9da22 | T07 Post-ship | |
| PB function | pbIRowHtml | af260741be9a | T07 Post-ship | |
| PB function | pbOvRowHtml | 70351602ae58 | T07 Post-ship | |
| PB function | pbAddTag | bde6ed340333 | T07 Post-ship | |
| PB function | pbRemoveTag | ef876676a045 | T07 Post-ship | |
| PB function | trSaveToPb | bdd2d352bbc1 | T07 Post-ship | |
| PB surface | overlay HTML (lines 610-642) | 7733c116de06 | T07 Post-ship | |

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
9. **Surface freeze (§SFR):** recompute every registered surface checksum. Every mismatch must map to an explicit in-scope declaration in the current stage spec. Undeclared mismatch = NOT READY.

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
- `#rc-choice-chat` — "Chat only". → sets capability.
- `#rc-choice-call` — "Chat + Call". → sets capability.
- `#rc-name` — initiator's name for this room (editable later from the Thread/Room Info, per Identity model in Part 0).
- `#rc-my-lang`, `#rc-their-lang` — initiator's language, partner's language. Editable later; token stays the real identity, never these fields.
- On submit (capability + name + both languages set) → `ROOM.create(capability, name, myLang, theirLang)`.
- `#rc-share`, `#rc-link`, `#rc-qr`, `#rc-copy` — appear immediately after submit. → system share.

## Surface 3 — Thread `#thread` (Turn 08 Ship)
- `#th-header`: other-party name `#th-name` | info `#th-info-btn` | call button `#th-call-btn` (chat+call rooms only — ABSENT from DOM in chat-only rooms).
- `#th-waiting` — initiator only, pre-join. Removed once joiner joins.
- `#th-msgs` — bubbles via THREAD. Speaker-centric. System markers via THREAD.postSystem.
- `#th-compose`: the SHARED compose strip — identical element set and behaviors as the Call surface strip: attach | input | clear-× | send, `/` and `..` PB-search drawer, /bank guard on Enter AND send, PB overlay access. Live in plain chat with no call running. (Owner decision 2026-07-02; supersedes the earlier plain-chat-only rule.)

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
- `#ri-mute-calls`, `#ri-mute-notifs` — per-room toggles (owner decision 2026-07-02): mute incoming call ring / mute message notifications for this room only, persisted per room. Toggles built Turn 08 Ship; enforced against live presence/push in Turn 11.
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


### user entered open items ###
1. there is an issue with saving a PB entry after the tab is closed it's not being committed to local storage and a local storage being compared to SOT on GH 
2. when you tap the plus icon in the PB surface it creates an empty PB card if you tap it again it creates a second empty PB card this is problematic for a number of reasons


## CANONICAL: sub-version attempt counter
Each retry within the same stage appends a 5th version digit = attempt count (e.g. 5.8.9 attempt 1 = 5.8.9.1, attempt 2 = 5.8.9.2). The 4-part version (5.8.9) names the stage; the 5th digit is the attempt. Resets to .1 on the next stage's first version. Adopted 2026-07-03 after repeated pre-ship failures.


## ATTEMPT NUMBERING (canonical, added 2026-07-03)
Every stage version gets a trailing attempt counter: MAJOR.MINOR.PATCH.ATTEMPT. First try at a stage = .1; every rebuild of that same stage after a failed gate increments the last number. Resets to .1 only when moving to a new stage. Applies to all turns going forward.


## TURN 08 PRE-SHIP — REPLAN (2026-07-03, series 5.8, stage 2, attempt 7)

Reason: prior six attempts patched symptoms one at a time; fixes did not survive the next change. This replan freezes every module going in, with checksums locked before any code is written, and documents what each module is allowed to expect from and hand to the shell.

### Modules going in (frozen, checksummed at insertion)
- chat surface + compose (sendChat/chatGo/appendTrDom): 5fa3cd4881b3, bf8e6b33a5da, a8f990efd79b
- phrasebook search+render (pbRenderOverlay/pbSearch/pbOpenOverlaySearch): 569436a97900, b0251853bd33, 493343a1ace2
- speech pickup (startDeepgram/stopDeepgram/onDGFinal): 3e7d074881ee, 0d613db74bd6, d1febfbade02
- call/video (enterCall/setupPC/cleanUp): 524531943363, 5470a4ebb5b7, 099e2e7dbb66
- relay (connectRelay/relaySend): 1c773f9bdcf6, 74bf6900dfdd

### Contracts (in / out)
- Chat surface + compose: IN — a room is open and identified; language pair known. OUT — messages appended to the one shared transcript; nothing else touches the shell's own message list.
- Phrasebook: IN — the bridge's phrasebook data is fully loaded before first render, no partial state. OUT — the same search box also handles chat send; results always carry visible text.
- Speech pickup: IN — a room is open and keys exist. OUT — spoken words appear as chat lines, on or off a call, no video required.
- Call/video: IN — user starts a call from the video icon next to the names, camera off by default (voice) or on (video). OUT — ending the call returns to the chat surface intact, same transcript.
- Relay: unchanged from confirmed bridge behavior; owns the room's live connection.

### Gate for this stage (unchanged from before)
Splash/landing page, chat surface with working compose strip, live speech pickup with no call needed, working phrasebook search with visible results, video icon starting a real call, all on both a new room and an already-existing one, before this is offered for testing again.

### Process change (binding)
No push for testing until every item above is verified against a full pass — new room and existing room both — in one sitting, not incrementally.


## T08 Pre-ship — rollback to attempt 9 (2026-07-03)
Attempt 8 (v5.8.2.9) rolled back. Next attempt: v5.8.2.10.


## T08 Pre-ship — REPLAN v5.8.2.11 (2026-07-03)

Cause of repeated failure: each attempt tried to land chat, phrasebook, voice, and video together. Fixing one broke another.

New approach: split pre-ship into two smaller deliveries.
- Delivery A (this attempt): chat surface + voice pickup + phrasebook, working end to end, on new and existing rooms. No video, no call, no separate splash — the panel's own existing welcome screen is the landing state, left panel closed by default.
- Delivery B (next attempt, after A is confirmed solid): video call added on top of A, untouched.

Gate for Delivery A: open a room, type and send, speak and see it transcribed and translated, search the phrasebook and see real results, on both a brand-new room and one made earlier — all working together before this is shown for testing.


## T08 Pre-ship — attempt bump v5.8.2.13 (2026-07-03)
Replanning before next build. Confidence must clear 90% before execution resumes.


## T08 Pre-ship — plan confirmed v5.8.2.13 (92% confidence)
Build verified deterministic across 3 independent passes, identical checksum each time. No separate splash element used — welcome screen is the room panel's own built-in state. Proceeding to build.


## T08 Pre-ship — REPLAN v5.8.2.14 (2026-07-03)

Root cause across all failed attempts: the merge has been done as live surgery on one giant page — grafting one app's markup into another's page in place, patch after patch. Every fix has re-broken something already fixed, because nothing in that approach can be checked as a whole before it's shown.

New approach: build the merged room screen as its own separate, complete file first — verified whole and correct entirely on its own — before it ever touches the room list page. Only after that file is confirmed correct does it get wired to the room list, as one clean swap, not a patch.

Confidence: 2 / 2.5. Below the bar. Needs one more planning pass before build resumes.


## v5.8.2.15 — root cause fixed, confidence 2.5/2.5
Room screen verified complete and correct standing alone. Proceeding to the one clean swap into the room list.


## TWO-TRACK STRATEGY v5.8.2.17 (2026-07-04)

Track A (current app) stays exactly as test.html behaves today — untouched, fully working. Landing rule restored: welcome screen only if no rooms exist; otherwise open the last used room. No mic or video icons anywhere in Track A.

Track B (new room surface) rides along in the same file, fingerprinted, switched OFF. It cannot affect Track A while off.

Swap: one switch turns B on, which reroutes room-opening to the new surface. The old surface stays present but bypassed. Flip back = instant restore.

Removal: only after B passes its gate on real devices does a later release delete the old surface.

Acceptance gates (each deterministic, each must pass before the next step):
1. A-intact: with B off, app byte-identical in behavior to today's test.html — landing rule, rooms, chat all work; fingerprints of B blocks recorded and matching.
2. B-alive: with B on, opening a room shows the new surface: typing sends, speaking transcribes and translates, phrasebook search returns visible results, video icon appears only in call-capable rooms, mic/video icons exist only inside a room.
3. Swap-proof: flipping B off restores step-1 behavior exactly.
4. Removal (separate release): old surface deleted, gate 2 re-passed.

Confidence: 2.5/2.5 — Track A requires no surgery, which is what kept failing.


## T08 Pre-ship — fingerprint-gated parallel track plan (v5.8.2.17)

Strategy: bridge modules go into the shell at build time as inert code alongside the shell's own organs. A single build-time gate decides which set runs. No runtime injection. No race.

Acceptance is fingerprint-gated: fingerprints are calculated from the confirmed source before build. After injection, fingerprints are recalculated from what landed. If they don't match, build is rejected automatically — graveyard bumped, plan bumped, rollback, retry.

### Locked fingerprints (source of truth, bridge-fixed-order.html)
| module | fingerprint |
|---|---|
| chatGo | bf8e6b33a5daf489 |
| sendChat | 5fa3cd4881b3ba84 |
| pbRenderOverlay | 569436a97900a6d4 |
| pbSearch | b0251853bd3387af |
| startDeepgram | 3e7d074881ee5fff |
| onDGFinal | d1febfbade02152d |
| connectRelay | 1c773f9bdcf629a2 |
| cleanUp | 099e2e7dbb663d8b |
| translate | f9bc542ee9bdf6b1 |
| bjs_full | f0cd62c8e5b44591 |

Build proceeds only when all fingerprints match. Any mismatch = automatic rollback.


## v5.8.2.18 — inline bridge but defer its startup until shell DOMContentLoaded fires
Same fingerprint gate. Bridge JS inlined but wrapped so its startup calls only run after the shell has fully booted.


## v5.8.2.19 — hide all bridge screens at parse time via CSS; only tbEnterRoom reveals the chat surface


## v5.8.2.20 — fix boot auto-open + verify relay connects on room entry


## v5.8.2.21 — suppress bridge boot completely; only tbEnterRoom activates it
Bridge script tag is inlined but its own DOMContentLoaded and startup calls are stripped out entirely. The bridge only wakes when the shell explicitly calls tbEnterRoom. This is the only way to prevent it taking over the screen at parse time.


## v5.8.2.21 build record
Module fingerprint locked and matched after injection: 82879653b94b90dd. Kill switch verified both ways (on=bridge, off=pure shell). Full gate passed: boot with stored room lands on welcome, panel closed, chat, search, listening, video icon, leave-room all pass.
