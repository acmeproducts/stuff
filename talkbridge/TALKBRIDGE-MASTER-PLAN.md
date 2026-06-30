# TALKBRIDGE — BUILD PLAN: STAGES × MODULES × SURFACES
## turn06-base → finished configurable WhatsApp-with-translation. Every stage names the module contracts it builds and the user-facing behavior it delivers.
**Version: 1.0 | 2026-06-29 | Master build plan. Source of truth in GitHub: raw.githubusercontent.com/acmeproducts/stuff/main/talkbridge/TALKBRIDGE-MASTER-PLAN.md**


Process: every turn = pre-base → base → pre-ship → ship → post-ship. Each stage ends in a USER TEST gate on the phone; banks only on pass; next stage starts only from a banked stage. Modules built parallel beside working code, switched one surface at a time after device confirmation. Immutable engine (startDeepgram/stopDeepgram/reconcileDeepgramState, translate/translateWithRetry, onDGFinal, handleChatMsg, _loadFastText/_detectLangAsync, RELAY_*, all WebRTC/recovery/relay) is wrapped behind a contract, never rewritten. One change → lint → verify → next. Roll back on failure, never patch forward.

**Contract rules (every module):** exposes only its listed methods; in/out fixed once frozen; every method logs `{module}_{op}{in,out}` to LOG and swallows nothing; reads only its inputs + CONFIG, never another module's internals or page globals.

---

# TURN 06 — Modularize the app + complete the phrasebook
Input: bridge-turn06-base.html v5.6.1. Output: bridge-turn06-post-ship.html.

## Pre-base — freeze contracts
MODULES FROZEN (in/out set, no code switched yet):
- CONFIG: get(k)→v · getAll()→obj · set(k,v) · subscribe(fn). Owns theme tokens, font size, language defaults, feature flags, labels, timing.
- LOG: log(ev,d,l) → debugLog[] → #log-body · open()/copy()/clear().
- STORE: get(k)/set(k,v)/remove(k) namespaced — the only module touching localStorage.
- PB-DATA/PB-SYNC/PB-QUERY/PB-RENDER/PB-USAGE: contracts frozen (built later this turn).
SURFACE: none changes. CONFIG seeded with today's hardcoded values as named keys; nothing reads from it yet.
GATE: app runs identical to base; LOG opens; CONFIG.getAll() returns keys.

## Base — modularize the non-PB app (behavior identical to base)
MODULES BUILT + SWITCHED IN:
- STORE — all persistence routed through it.
- RELAY send(msg)/onMessage(fn)/connect()/close()/status() · RTC start(roomCtx)/stop()/onState(fn) · STT start()/stop()/onFinal(fn)/reconcile(r) · TRANSLATE translate(t,s,g)→t / backtranslate(...)→t · LANGDETECT detect(t)→lang — each wraps the immutable engine functions unchanged.
- NORMALIZE normalize(text,userPref,partnerLang)→{display,sent} — the single Z→X→Y path; original never surfaced.
- ROOM create(cap)/join(token)/listForOwner()/get(id)/dispose(id) · THREAD render(roomId)/append(msg)/postSystem(marker) · CALL mount(roomCtx)/unmount().
SURFACE: lobby, call screen, transcript, mic/cam — visually and behaviorally identical to base.
GATE: full call, transcription, translation, recovery, chat Z→X→Y, create/join — zero regression vs base.

## Pre-ship — replace the phrasebook against clean PB contracts
MODULES BUILT + SWITCHED IN:
- PB-DATA getCards()/getLive()/byId(id)/save(cards)/norm(raw)→Card. Canonical schema (categories[] default ['unassigned']; createdBy/updatedBy; lastUsed; usage; backtranslate{…verdict 'pending'}; clarifyChain[]; drops catalogIds/confidence/semanticRelationships/parentCategory/primaryTag/relatedIntents). GH is SOT; load REPLACES cache.
- PB-SYNC pull(src,tgt)/writeBack(). Files phrasebook-{src}-{tgt}-{NNNN>=1000}.json, highest wins; pull on enterCall; write-back on hangup + dirty overlay close, conditional on dirty; pending/completed status, retried on reconnect, never blocking.
- PB-USAGE recordUse(id) (sets lastUsed + increments usage + updatedBy) · getUsage(id).
- Old catalog/NC/CDN/import/old-GitHub-push system fully removed — nothing coexisting.
SURFACE — PB overlay (inside call screen): opens showing the pair's cards pulled from GH; pair label shows flags + filename; you can add a card from the transcript and from the overlay "+"; edit, soft-delete; on hang up the changes write back as the next version.
GATE: pull 1000-series at call start → cards in overlay → add from transcript → add from "+" → edit → soft-delete → hang up → 1001-series in GH with all changes; every base feature survives (overlay close, search × inside box, compose ×, clarify capture, Enter in source, "/" search).

## Ship — the phrasebook behaviors (the ones that kept regressing), correct
MODULE BUILT + SWITCHED IN:
- PB-RENDER renderRow(card)→el (transcript/search: source+TTS+send | target+TTS+send; no "tap to use") · renderCard(card)→el (full card). PB-QUERY query({text,pair})→{cards,total} — one engine for inline ribbon and overlay. pbRenderOverlay picks: active search → row, zero-state → card.
- Full card (pbBubbleHtml; Bridge IDs pbb-/pbsrc-/pbtgt-/pb-bt-text-/pbtags-/pbclarify-): header (updatedBy||createdBy) capitalized · (updatedAt||createdAt); source+USE+TTS | target+USE+TTS; always-visible backtranslate row+TTS; verdict ✓ Sounds Good | ⚑ Flag pills; footer 3 icons (# | clarify | trash); tag drawer (chips + autocomplete, createElement); clarify drawer (Enter commits, no Add button).
- Behavior mechanisms (the fixes): Enter-in-source = real KEYDOWN, preventDefault on plain Enter → translate+backtranslate (onblur-alone is the bug); verdict reset CONDITIONAL (only if text changed; "Was:<old>" + real transition; no pending→pending); clarify Enter handler ends with el.focus(); compose "/" or ".." opens inline ribbon on keystroke, × inside field shown only when content present, predicate reaches transcript via NEITHER Enter NOR send (both guarded); pbAddCard → categories ['unassigned'], createdBy 'tb', verdict 'pending', translateWithRetry at birth, focus SOURCE field; duplicate save → no dup, toast "Already saved", increment usage.
SURFACE — PB overlay/card: a card edited by Enter re-translates and keeps the keyboard up; verdict and clarify log a readable history; tags add without losing focus; typing "/bank" never lands in the transcript; "+" makes a card with the source field focused.
GATE: device cases A1–G6 (07-BEHAVIORAL-ACCEPTANCE.md) all pass.

## Post-ship — consolidate + tokenize (D3)
- PB-RENDER consolidated to ONE card renderer (rows stay). Every PB hardcoded color/size moved into CONFIG tokens.
SURFACE: PB overlay/card visually identical, now theme-driven.
GATE: zero visual regression; all ship cases still pass. Merge to main.

---

# TURN 07 — Shell: the five surfaces
Input: copy turn06-post-ship → bridge-turn07-pre-base. Output: bridge-turn07-post-ship.html.

## Pre-base — freeze the room model + the initiator/joiner contract
MODULES FROZEN/EXTENDED:
- ROOM gains the owner/token/capability model: create(capability)→{id,token,owner,cap} · join(token)→roomView · listForOwner()→rooms (owner only) · dispose(id). Owner-scoped queries enforced here — a joiner session cannot enumerate other rooms.
- Initiator-designation decision (07A research): the credential that makes someone an initiator under no-signup/no-email/no-phone; must prove a joiner cannot reach room-creation via any URL/state manipulation, and an initiator's capability survives reinstall/multi-device.
SURFACE: none yet.
GATE: written contract + decision; no behavior change.

## Base — token identity + the two views off one room object
- test.html's room token replaces the name-derived pairKey everywhere (old pairKey DELETED, no fallback). One room object renders as a Room List entry for its owner and routes anyone with a valid token straight to its Thread.
SURFACE: internal — addressing only.
GATE: initiator creates a room → it appears in their list; joiner opens a token → lands in the thread; joiner cannot see/query any other room.

## Pre-ship — Room List + Room Creation surfaces
SURFACE — Room List (5.1, initiator only): list of rooms they started, each showing the other party's handle (or "waiting for them to join"), last-message preview, a chat-only vs chat+call icon, unread/waiting indicator, one obvious "+". Empty state = one prompt to make the first room. Room Creation (5.2): one screen, two big choices — "Chat only" / "Chat + Call", nothing else (no name, no settings, no language picker) → immediately yields link + QR. Capability is real: a chat-only room never carries a call control anywhere.
GATE: create both room types; chat-only never exposes a call affordance; link + QR generated for each.

## Ship — Thread + Call + Room Info surfaces
SURFACE — Thread (5.3): normal chat thread, each side's own language on their own side, input at bottom. Chat+call rooms show one persistent call button; chat-only rooms have no such button (absent, not greyed). Initiator before joiner joins sees a quiet "waiting for them to join". Joiner opens link/QR and lands directly in the thread, no setup. Call (5.4): the call button mounts the CALL module (existing call+PB UI); hang up returns to the SAME thread with a "call ended" marker — no goodbye dead-end. Room Info / Dispose (5.5): room facts + the one destructive action (dispose), with a confirmation step.
GATE: create chat+call room → joiner joins → chat → escalate to call → hang up returns to thread with marker → dispose with confirm.

## Post-ship — polish the five surfaces against CONFIG tokens
SURFACE: all five surfaces visually consistent, token-driven; no new screens introduced by the polish.
GATE: all Turn 06 + 07 tests pass; visual consistency. Merge to main.

---

# TURN 08 — One shared translation path (chat + call)
Input: copy turn07-post-ship → pre-base. Output: bridge-turn08-post-ship.html.
- Pre-base: freeze NORMALIZE as the single translation entry for chat AND call; map every existing call-path/chat-path/PB-send translation call to it.
- Base: route call-transcript translation through NORMALIZE. GATE: spoken translation identical; Z→X→Y holds in call.
- Pre-ship: route chat end-to-end through it; delete duplicate normalization. GATE: type any language → Z→X→Y, original never shown; speak any language → same.
- Ship: PB "use"/send and search feed the same path. SURFACE: sending a card mid-call lands correctly on both sides. GATE: card send via shared path correct both sides.
- Post-ship: remove dead translation routes; LOG shows one path per translated message. Merge to main.

---

# TURN 09 — Token addressing + multi-device
Input: copy turn08-post-ship → pre-base. Output: bridge-turn09-post-ship.html.
- Pre-base: freeze token as sole identity; audit residual name-derived identity.
- Base: all room/message/call addressing uses the token. GATE: no name-derived identity remains; flows unaffected.
- Pre-ship: multi-device chat join. SURFACE: same room/thread reachable on a second device; messages converge. GATE: two devices, one party, messages converge.
- Ship: multi-device extends to calls (CALL module recognizes/routes an active or incoming call on a second device). SURFACE: a call rings/answers on the right device. GATE: cross-device call rings/answers.
- Post-ship: edge cases (drop mid-call, rejoin). Merge to main.

---

# TURN 10 — Presence, waiting & room disposal
Input: copy turn09-post-ship → pre-base. Output: bridge-turn10-post-ship.html.
- Pre-base: freeze the relay-side presence/waiting contract and disposal policy (unjoined rooms expire 30 days; joined never expire silently; explicit dispose retires token + purges record).
- Base: token-keyed waiting indicator surviving recipient-offline. SURFACE: Room List shows "waiting for them to join" until they join, then clears. GATE: offline recipient → waiting; later join → clears.
- Pre-ship: unread/last-message state. SURFACE: Room List reflects messages that arrived while away. GATE: away messages reflected.
- Ship: disposal — initiator dispose does real relay-side cleanup; unjoined-room expiry purge. SURFACE: Room Info dispose removes the room everywhere. GATE: dispose removes room; expired unjoined room gone.
- Post-ship: edge cases (dispose during waiting, re-create after dispose). Merge to main.

---

# TURN 11 — Design system & uniform look (the configurability payoff)
Input: copy turn10-post-ship → pre-base. Output: bridge-turn11-post-ship.html.
- Pre-base: audit every remaining hardcoded color/size/spacing across all surfaces; document as CONFIG token keys (no code change).
- Base: inject the full token set into CONFIG/:root; replace hardcoded values with tokens surface by surface. GATE: every screen renders identically, now token-driven; no black boxes/missing colors.
- Pre-ship: CONFIG carries two independent persisted axes — font size and theme preset. SURFACE: change font size and theme separately; both persist; all surfaces honor them. GATE: independent change + persist across reload.
- Ship: apply one uniform design language across all five surfaces + PB component (spacing, type scale, controls). SURFACE: every surface coherent in default and each theme. GATE: visual walkthrough passes in default + each theme.
- Post-ship: final consistency pass; confirm nothing un-tokenized. Merge to main.

---

# TURN 12 — Installable & reachable when closed
Input: copy turn11-post-ship → pre-base. Output: bridge-turn12-post-ship.html.
- Pre-base: freeze the service-worker + notification contract (PWA/push lives HERE, not Turn 06).
- Base: service worker registers; installable to home screen. SURFACE: install → launches full-screen. GATE: installs and launches.
- Pre-ship: push subscription; backgrounded app gets a notification on new message/room-join. SURFACE: notification → tap opens the right room. GATE: backgrounded notification → correct room.
- Ship: fully-closed app → push → tap opens the thread; unread badge. SURFACE: closed-app notification → correct thread; badge clears on open. GATE: closed-app flow + badge.
- Post-ship: background edge cases. Merge to main.

---

# TURN 13 — Pilot readiness (DONE)
Input: copy turn12-post-ship → pre-base. Output: bridge-turn13-post-ship.html.
- Pre-base: assemble the full cross-turn regression matrix.
- Base: full lifecycle regression on real Galaxy + iPhone over real networks. GATE: whole matrix passes.
- Pre-ship: configurability proof — change theme/font/labels/default capability via CONFIG with no rebuild; confirm white-labelable. GATE: a config change reshapes look/feel/operation without touching code.
- Ship: fix anything surfaced; final polish. GATE: clean run, zero known regressions.
- Post-ship: pilot sign-off. Merge to main.

DONE: rooms (chat-only or chat+call, one per relationship, link/QR, no accounts) · live translation everywhere through one NORMALIZE path · a curated central phrasebook (GH SOT, PB/XL versioned, usage-tracked) inside calls · reachable when closed · one polished uniform look driven entirely by CONFIG so it re-themes and white-labels without a rebuild. Every part a module with a frozen contract; every release device-gated; nothing built by editing entangled code live.

## OUT OF SCOPE throughout
O-Ring · Translation Memory · PB Central LIVE telemetry pipe (local usage tracking IS in scope) · encryption at rest · changing a room's capability after creation.

---
---

# PART II — CC EXECUTION SPEC (the gap-closers; without these CC reintroduces regressions)

## §A. INPUT FILE MAP (never use a stale local file as baseline)
Every turn's input is fetched fresh from GitHub at stage start. Source of truth is the repo, not any local copy.
- Fetch: `curl -s -o <local> https://raw.githubusercontent.com/acmeproducts/stuff/main/<file>`
- Turn 06 input: `bridge-turn06-base.html` (v5.6.1, 3940 lines, full-file sha256 starts `0b21ffdeeadb5db9`). If the fetched file's line count ≠ 3940 or the sha prefix differs, STOP — wrong baseline.
- Every later turn input = the prior turn's `*-post-ship.html` AFTER it is merged to main, re-fetched from GitHub. Never carry a working-directory file forward across a turn.

## §B. IMMUTABLE FUNCTION CHECKSUMS (wrap, never rewrite — diff before and after)
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
1. The new module is added to the file as new code; the old function stays untouched and still live.
2. A CONFIG flag gates which path runs at the ONE call site: `if(CONFIG.get('use.MODULE')) MODULE.method(...) else oldFunction(...)`. Default false until the stage's device gate passes.
3. CC flips the flag for that one surface, builds nothing else, and the stage is tested with the flag on.
4. Only AFTER the device gate passes does the next stage remove the dead old function.
CC must NOT: edit the body of a live working function to "convert" it; replace a function in place; or flip more than one surface's flag per stage. If CC finds itself doing a find-and-replace inside a working function body, STOP — that is the failure mode.

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
