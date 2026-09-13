# Master Plan (duck.md)

Sole authority for the `duck` app. Chat history loses to this document.

## 0. TURN/STAGE LEDGER

Append a row before every build session that touches code.

| Turn | Stage | Description | Status |
|------|-------|-------------|--------|
| 0 | Plan init | Create master plan (this file) | DONE |
| 1-11 | Define/R1/R2 | Original Define phase, R1 mis-build, R2 spec correction (nub-based keyboard request UX) — see git history for full text | SUPERSEDED |
| 12 | Build (many) | 2026-09-11/12: Extensive iterative build across ~40 turns. Custom per-side keyboards (hand-rolled, not Simple Keyboard), native Korean/Japanese IME, swype (later removed), 23-language set with flags (later flags removed from keyboard), script+fastText code-switch normalization, mic/keyboard ownership arbitration (many bugs found and fixed), custom color swatches (native pickers broke rotation), settings-modal flip for North. See decision log below for what's actually live. | DONE (superseded piecemeal, plan not kept current — corrected in this turn) |
| 13 | Plan sync + Turn 13 spec | 2026-09-13: Plan brought current with actual shipped state (Turn 12 was never documented as it happened). Owner directive: adopt bridge-turn23-ship.html's engine (STT/Deepgram, TTS, normalization) verbatim — "the minute we diverge we will never make it back." Ownership model finalized as a single first-come-first-served switch covering keyboard AND mic, TTS demoted to a non-claimant (plays or is silently dropped, never queues, always yields instantly to a human claim). Config surface redesigned: south-only access via long-press on transcript (replaces gear icon), conversation persisted with an id/index so "start fresh without losing history" is a data-model decision made now, not a later migration. | PLANNED (this document) — build next |

## 1. WHAT DUCK ACTUALLY IS (current, corrects prior drift)

Two people, one phone, face-to-face across the table — North and South, each half of the screen physically rotated to face its user. Not a call; no network peer. Baseline donor: `chat.html` (South Korean travel-chat baseline, byte-verbatim underneath everything duck has added — this rule has held throughout and does not change).

**Owner's non-negotiable constraint (2026-09-13):** duck's real-time engine — STT, TTS, language normalization — must become a direct, unmodified port of `bridge-turn23-ship.html`'s equivalent code. Not "inspired by," not "the good parts of." The stated reason: divergence compounds, and reconciling two evolved copies later is a cost that's never actually paid down in practice. Anywhere this plan says "port from bridge," the standard is: same function body, same variable names where feasible, same protocol/timing constants (e.g. Deepgram's own endpointing, not a duck-invented timeout). The one and only thing duck is allowed to change about bridge's code is *what surrounds it* — turning a singleton built for "the one mic on this one device" into something instantiable twice.

## 2. THE OWNERSHIP SWITCH — the core mechanism, spec'd in full

**One shared resource, one owner at a time, first-come-first-served.** Not turn-taking, not politeness logic in code — the code just enforces the switch; the actual politeness (whether to yield) is a human decision made through eye contact and body language at the table, same as the owner described it.

### 2.1 What the switch controls
Exactly two things, always together, never independently: **the compose-strip input focus** and **the STT mic**. Both are "the input device." A side either owns both or owns neither. (TTS is explicitly *not* part of the switch — see 2.4.)

### 2.2 States
- `FREE` — nobody owns it. Either side's first touch (focus the input, or tap mic) claims it instantly, no negotiation.
- `OWNED(side)` — one side holds it. That side can keep typing or keep talking indefinitely.
- `PENDING(from, to)` — the non-owning side has asked; the owner has not yet answered. Existing `ask()`/`resolveAsk()` overlay (already built, already correct in shape) stays exactly as-is for this state's UI.

### 2.3 Transitions (this is the exact, complete state table — nothing implicit)
| Event | State before | Result |
|---|---|---|
| Side X focuses input / taps mic | `FREE` | `OWNED(X)` — instant, no ask |
| Side X focuses input / taps mic | `OWNED(X)` | no-op (already theirs) |
| Side X focuses input / taps mic | `OWNED(Y)` | `PENDING(X,Y)` — overlay shown to Y |
| Owner Y taps Allow | `PENDING(X,Y)` | `releaseSide(Y)` (stop Y's keyboard/mic/TTS if playing — see 2.4) then `OWNED(X)` |
| Owner Y taps Decline | `PENDING(X,Y)` | back to `OWNED(Y)`, X's request dismissed, logged |
| Owner Y taps Decline, then later sends/pauses | `OWNED(Y)` | **auto-release fires anyway** — see 2.4. X does not get silently granted; it just becomes `FREE`, and whoever touches first (X or Y again) wins. This is the literal first-come-first-served rule the owner specified — a decline doesn't grant a standing hold past the owner's own next natural pause. |
| Request times out unanswered (existing 20s `askTimer`) | `PENDING(X,Y)` | back to `OWNED(Y)`, treated as an implicit decline |
| Owner sends via Enter (typed) | `OWNED(Y)` | `FREE` immediately |
| Owner's STT auto-sends on pause (existing `armPause`/1100ms) | `OWNED(Y)` | `FREE` immediately — this pause **is** the release point; no separate mechanism needed, it's the same auto-send that already exists |

This table is the entire ownership module. No other state, no timers beyond the existing 20s ask-timeout, no "grace period" — those were things I invented in discussion and the owner correctly cut them.

### 2.4 TTS's actual role: not a claimant, an effect
TTS never calls into the switch. It has no owner, no pending state, no queue. It just plays, using bridge's `speakText(text, lang)` verbatim (already confirmed to be a pure function — no refactor needed, called twice, once per side, with whatever text/lang each side's delivered message needs). Two rules, both already implied by bridge's own existing code, not new mechanism:
- **A second `speakText` call while one is already playing**: bridge's own function already calls `speechSynthesis.cancel()` before speaking. That's it — that's the entire "only one voice at a time" enforcement, and it's bridge's code, unmodified, doing its normal job. Duck does not add a queue, does not add a "was one already playing" check. It relies on the side effect that's already there.
- **A human claiming the switch while TTS is mid-sentence**: same `speechSynthesis.cancel()` call, just invoked from one additional place — the top of `releaseSide()`/the grant path, so that whichever side just won the switch doesn't have to listen to the loser's device-voice finish over them. One extra line, not new logic.

### 2.5 What gets deleted from the current file
- `onKbButton`'s dead body (already unbound from the mic button in the last fix; the function itself is now unused — remove it, don't leave it as a landmine for a future duplicate-function trap).
- Any remaining reference to `langModeOf`/mode-chip dead code paths already stripped in HTML but check for stray CSS/JS remnants (`paintModeChip`, `modeChip[side]`) and remove them outright rather than leaving them as silent no-ops — the file has accumulated enough of these ghosts that a clean pass is worth doing as part of this turn, not deferred again.
- The 7 known duplicate function declarations (`diag`, `renderDiag`, `buildKeyboard`, `buildAsk`, `other`, `langOf`, `keyCenters`) — collapse each to one definition. Verified harmless today only because JS's last-wins rule happens to keep the correct copy; not safe to keep carrying forward through more edits.

## 3. STT MODULE — mechanical port of bridge's `CHATMIC` + Deepgram pipeline

**Source of truth**: `bridge-turn23-ship.html`, the `CHATMIC` object (~line 2793) plus the Deepgram functions it drives (`startDeepgram`, `stopDeepgram`, `_stopDgWatchdog`, the `dgWs`/`dgActive` module state, MicMeter). These are global singletons in bridge because bridge only ever has one local mic. Duck needs two live at once.

**The only permitted change:** wrap the singleton in a factory so the identical code can be instantiated per side, with every module-level variable (`dgWs`, `dgActive`, watchdog timers, `CHATMIC.on/.stream`) becoming a property of that instance instead of a bare global. No logic inside the wrapped functions changes — same reconnect/watchdog timing, same message protocol to Deepgram, same endpointing behavior. Concretely:
```
function createMicPipeline(side) {
  // body = bridge's CHATMIC + dg* functions, verbatim, with every
  // bare `dgWs`/`dgActive`/`this.stream` reference rewritten to
  // `pipeline.dgWs`/`pipeline.dgActive`/`pipeline.stream` — a
  // mechanical find-replace, not a rewrite of behavior.
  var pipeline = { on:false, stream:null, dgWs:null, dgActive:false, ... };
  pipeline.start = async function(){ /* bridge's CHATMIC.start body */ };
  pipeline.stop = function(silent){ /* bridge's CHATMIC.stop body */ };
  return pipeline;
}
var mic = { local: createMicPipeline('local'), peer: createMicPipeline('peer') };
```
`mic.local.start()`/`mic.peer.start()` are called from the exact places the current `toggleSTT(side)` is called today (composer mic button, keyboard's mic key) — those call sites don't change; only what's underneath them does.

**New requirement this introduces, named honestly:** a Deepgram API key (`tb_dg_key`), and running two concurrent Deepgram WebSocket connections instead of one (cost and connection-limit implications bridge never had to consider, since it never runs two at once on one device). This is real, not hidden — flagging it here so it's a known, accepted cost of "no divergence," not a surprise found mid-build.

**What this replaces:** the current Web Speech API implementation (`newRecognizer`, `armPause`, the whole `SpeechRecognition`-based flow) — deleted outright once the Deepgram port is live, not kept as a fallback. Fallbacks are exactly the kind of divergence-seed the owner is ruling out.

## 4. TTS MODULE — direct port, already established as trivial

`speakText(text, lang)` from bridge, verbatim, called from wherever duck currently triggers `speechSynthesis` (the message-send path, when that side's TTS toggle is on). No wrapper, no override needed — it already takes the two parameters duck needs to give it. The existing TTS-toggle UI (per-side, listener-gated per the earlier fix) stays; it now decides *whether* to call `speakText`, not *how* TTS behaves internally.

## 5. NORMALIZATION MODULE — port `normalizeOutgoing` verbatim; fix lives at the call site, not in the function

Port bridge's `normalizeOutgoing(room, text, knownLang)`, `resolveEffectiveLang(room, detected)`, `detectLangAsync`, `ftDetect`, `applyNorthernThaiMap` — byte-for-byte. Duck's `room` argument becomes a small object shaped to match what `resolveEffectiveLang` reads (`room.myLang`, room's fixed/auto mode) — a thin adapter object per side, not a change to the function.

**The call-site rule that keeps duck's already-fixed bug fixed, without touching bridge's code:**
- Text committed through duck's own on-screen keyboard → pass `knownLang = <that keyboard's language>`. This is exactly as trustworthy as bridge's single-keyboard assumption, because it *is* the same situation: one input surface, one known language.
- Text committed any other way (a physical/OS keyboard bypassing ours, if that's ever possible again, or pasted text) → pass `knownLang = null`. Bridge's own `knownLang || await detectLangAsync(text)` line then does exactly what bridge wrote it to do, unmodified — falls through to detection.
- Text from Deepgram (STT) → pass `knownLang = <the language that pipeline instance was listening for>`, matching bridge's own STT call sites exactly.

Mode (fixed/auto) stays hardcoded to `'fixed'` per the prior decision (no user-facing toggle) — this is a duck-side default choice for the adapter object, not a change to bridge's function.

## 6. CONFIG DRAWER — south-only, replaces the gear icon

- Remove the gear icon from both composer strips entirely (north never had legitimate access to config to begin with under the new model; south's gear is replaced by a gesture, not a button, to reclaim the real estate).
- **Trigger**: long-press (~500ms) anywhere on the **South transcript surface** that isn't a bubble. North's transcript gets no equivalent gesture — there is no config path from North at all, by design (this is the privacy boundary, not an oversight).
- **"South" is a fixed identity** (the device owner, whoever set the phone up), not "whichever half is on the bottom of the screen today" — confirmed assumption from the owner's answers; if this is wrong, it's a one-line change to which physical half the gesture listens on.
- Drawer contents: everything currently in the settings modal (language selects, the custom color swatches, TTS toggles) plus the new **Calling & Sync Keys** tab (below).
- The drawer itself does not need the `.flip` rotation logic at all now — it's south-only, so it only ever needs to face south, normally. The flip mechanism and the custom-swatch work already done stay (still needed for correctness) but the north-facing flip branch becomes dead code to remove — north can't open it.

### 6.1 Calling & Sync Keys tab
- Reads `localStorage.getItem('tb_dg_key')` directly on load — same-origin as bridge, so this is already populated for any existing bridge user, free, per the investigation done earlier this session.
- If empty (new device, no bridge history): a plain input + save button, writing to that exact same key — `tb_dg_key`, not a duck-specific name — so the value benefits both apps going forward, per the owner's explicit instruction not to fork the datastore.
- No other new keys needed for this phase (MyMemory's anonymous endpoint has no key; translation stays on MyMemory unless/until a future turn ports more of bridge's translation-provider logic too — out of scope for this turn).

## 7. CONVERSATION PERSISTENCE — data model now, UI later, so the later part is a drop-in

**Now (this turn):** every conversation gets an id at creation. Storage shape:
```
duck_conversations_index = [{ id, createdAt, label }]   // small, list of all conversations
duck_active_conversation = "<id>"                          // which one is live
duck_conversation_<id> = { messages: [...] }                // the actual transcript, keyed by id
```
Today, the index has exactly one entry, created once on first launch, and `duck_active_conversation` always points at it. There is no UI to create a second one yet.

**Later (explicitly out of scope for this turn, and this is the point of designing the shape now):** a "start fresh" action is: generate a new id, push it to the index, point `duck_active_conversation` at it. A "resume" action is: change the pointer. Neither touches any existing conversation's data. Because the shape already assumes more-than-one from day one, that later work is additive — a small list UI inside the south-only drawer — not a migration of a single flat history blob into this shape after the fact.

This lives in the config drawer's scope (south-only) per the privacy decision already made — north never sees a conversation list, never sees history, only ever sees the live transcript they're already part of.

## 8. BUBBLE ORIENTATION — carry forward unchanged

The DOM-order swap for North's rotated column (source language lands on North's physical left) is already correct and stays exactly as built — nothing in this turn touches bubble rendering.

## 9. ACCEPTANCE CRITERIA — the exact scenarios from the bug report, restated as pass/fail

1. Fresh launch: South TTS defaults **off**.
2. Focus compose strip → keyboard slides up, mic shows switch-owned state. Type, Enter → sends, translates correctly, switch is `FREE`. Tapping back into the same input (already caret-positioned) **re-arms the keyboard** — no need to tap outside first.
3. Keyboard keys are large enough to type reliably (concrete target: no smaller than the current composer control buttons, 36px minimum touch target — carried forward from the mobile-first constraint already governing every other control).
4. Color swatch selection persists across a save/reload cycle.
5. Mic: tap on South (`FREE`→`OWNED(South)`), speak, pause → auto-sends, switch → `FREE`. No flapping — this is a direct consequence of the Deepgram port replacing the Web Speech API's restart bug, not a patch on top of the old engine.
6. North taps mic while South owns it → South sees the request, can accept or decline; on accept, South's mic **actually and completely stops** (this is `releaseSide` correctly invoked on every grant, per the fix already shipped, now also verified against the new Deepgram pipeline's `.stop()`).
7. North holds the mic (owned, listening) → South taps into compose strip → North is asked, agrees → North's mic **fully stops** (same `releaseSide` guarantee, no partial state).
8. A message spoken in English into a room set to Thai: the two-column bubble shows Thai as the source (left, for that side's physical orientation) and English as the translation (right) — consistently, on both South's and North's view of that same message. No left/right disagreement between the two sides' displays of one message.

## 10. WHAT THIS TURN DOES NOT DO (explicit non-goals)
- No multi-room / multiple-simultaneous-conversation UI (data model only, per §7).
- No translation-provider changes beyond what's already MyMemory (bridge's provider logic is a separate, larger port not requested this turn).
- No changes to the IME/keyboard layouts, swype (already removed), or language list — untouched.
- No fallback preserved for the old Web Speech API STT path — replaced outright, not kept as a backup.
