# TALKBRIDGE MASTER PLAN
**Version: 5.0 | 2026-07-02 | Governing document. Repo: github.com/acmeproducts/stuff, path: talkbridge/TALKBRIDGE-MASTER-PLAN.md**

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
**CURRENT STAGE: Turn 08 / Pre-base — not yet started. Turn 07 is CLOSED, device-confirmed.**
T07 Pre-base/Base/Pre-ship/Ship all DONE. T07 Post-ship: DONE pending device test, bridge-turn07-post-ship.html v5.7.4. Closes Open Items 1-4 (TB capitalization, BT icon, dup-save toast, write-back batching). PB Surface Freeze Registry populated below — PB surface is now frozen.

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

## OPEN ITEMS (not scheduled — parked for later disposition)
| # | Item | Note |
|---|---|---|
| 5 | PB-RENDER (renderCard/renderRow) not activated | Scaffolded modules use a different design system than the live, approved cards — would break pixel parity if turned on. Needs a rebuild-to-match pass against the current live markup before it can replace the working renderer |

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
- RELEASE: Turn 07 / Post-ship — v5.7.4
- STATUS: DONE pending device test. Output: bridge-turn07-post-ship.html, 5109 lines, sha256 prefix 8b7aee8fe55d.
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
**Deliver:** bridge-turn08-base.html, v5.8.1
**Work (one foundational item, required before Pre-ship can start):**
1. **Nine engine modules only.** Initiator designation is DECIDED — see below. No spike, no decision doc needed in this stage.
2. **Nine engine modules** — CONFIG, LOG, STORE, RELAY, RTC, STT, TRANSLATE, LANGDETECT, NORMALIZE — activated in one pass. Old hardcoded paths removed. Service worker registered; app installable.
**References:** Part 4 §4M.1–§4M.8. Part 5 §IMM, §SFR (PB surface frozen — modules must not alter frozen PB checksums). GT-WA v2.3 §2B-1, §Turn 07A.
**Test (positive):** Call connects, transcript appears, translation correct — now through modules. Debug log shows module events. App installs to home screen. Spike: joiner probing tests all fail to reach room creation. INITIATOR-DECISION.md exists in repo.

### Pre-ship — Status: NOT STARTED
**Deliver:** bridge-turn08-pre-ship.html, v5.8.2
**Work:** Shell merged per INITIATOR-DECISION.md (Base deliverable — required input). Five screens live per the five-screen inventory (Part 0). Initiator → Room List. Joiner → Thread directly, no Room List visible, no path to Room Creation. Room capability gates call button presence in DOM. Hang-up → Thread + "call ended" marker.
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
**Work:** Relay presence contract live. Disposal policy: unjoined rooms expire 30 days, joined rooms never silently expire, dispose retires token + purges relay. Waiting indicator in Thread for initiator pre-join, survives backgrounding.
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
| PB function | pbCommitSrcEdit | cf4bfcd7e0ed | T07 Post-ship | |
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

