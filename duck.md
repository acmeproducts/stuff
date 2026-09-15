# duck.md — REBUILD PLAN (v2)

**Supersedes all prior duck.md content.** Prior plan described an incremental
build on `chat.html` with bridge subsystems imported piecemeal. That approach
has failed and is abandoned. This document is the sole authority.

---

## TURN/STAGE LEDGER

The pre-rebuild duck.md tracked every deploy by turn number here. That
convention was dropped when the rebuild plan (v2) was written and every deploy
since has only been traceable by git commit SHA — exactly the unreadable
reference this ledger exists to prevent. Reinstated below, backfilled from git
history.

| Turn | Stage | Description | Status |
|---|---|---|---|
| 20 | Build | Engine sourced from bridge-turn27-base.html, byte-verified. Ownership switch (unconditional teardown), 44px keyboard, 6 gates. | SUPERSEDED |
| 21 | Fix | G7 (normalization parity — typed path passes no knownLang) + G8 (compose strip clears on every send path). Gates 7–8 added. | SUPERSEDED |
| 22 | Fix | G5/CRITICAL — `debugLog` missing from engine extraction, silently killing all of normalization via a thrown `log()`. G9 — mic no longer push-to-talk. Gates 9–10 added. | SUPERSEDED |
| 23 | Fix | G10 — restored bridge's dual-socket English arbitration for zh/th/ko/ar (the actual root cause of the Chinese-room translation failure). G11 — mic idle auto-release. Gates 11–12 added. | **BASELINE — currently live** |
| 24 | Build | Conversation persistence (§7), id-keyed storage. | REJECTED |
| 25 | Build | Multi-thread config UI (§16), per-thread language/colour. | REJECTED |
| 26 | Rollback | Reverted past both 24 and 25 on report that normalization/translation were broken even at the turn-24 baseline. Restored to turn 23's exact file. Root cause not yet confirmed — holding for real-device confirmation before any further build (graveyard G13). | DONE |

**Current turn: 26 (Rollback). Current stage: Hold**, sitting on Turn 23's file
(bridge-core engine + G10 dual-socket fix + G11 mic idle release — nothing from
§7 or §16 present). Nothing further builds until Turn 23 is confirmed working
on a real device. Next turn number once building resumes is **27**.

---

## 0. WHY REBUILD (the evidence, not the vibe)

`duck.html` at 177,627 bytes contains, verifiably:

| Symbol | Copies | Consequence |
|---|---|---|
| `ftAllowed` | 3 | — |
| `detectLangAsync` | 2 | **two complete detection engines** |
| `loadFastText` | 2 | two model loaders racing |
| `detectByScript` | 2 | — |
| `SCRIPT_TESTS` | 6 refs | — |
| `buildKeyboard`, `buildAsk`, `diag`, `renderDiag`, `langOf`, `other`, `keyCenters` | 2 each | last-wins silently |

JavaScript resolves duplicate `function` declarations by last-wins. So for
several turns we have been reading, editing, and "fixing" one copy of the
normalization engine while a **different copy actually executed**. Every fix
that "didn't take" has this as its explanation. No amount of further patching
resolves this, because the file's behaviour is not determined by the code you
read — it is determined by declaration order.

**The architectural error, stated plainly:** we used the broken file as the
base and imported the working engine into it. That is backwards. Bridge's
engine works. Duck's engine does not. The rebuild inverts this.

---

## 1. THE INVERSION

```
OLD (failed):  chat.html (weak engine) + bridge subsystems imported piecemeal
NEW (this):    bridge-turn27-base.html (proven engine) + tabletop UI replacing its call UI
```

**Base file:** `bridge-turn27-base.html` — copied whole, engine untouched.
**Donor file:** `duck.html` — UI components only, hand-picked, never wholesale.
**Output:** `duck2.html` (new filename; `duck.html` is left alone until duck2 passes gates, then swapped).

The engine is not ported, adapted, transplanted, or wrapped. It is **already
there** because we started from the file that contains it. Nothing is imported
into it. The only work is removing what duck doesn't need and replacing the UI
shell around it.

---

## 2. WHAT IS REMOVED FROM BRIDGE (and only this)

Bridge is a two-device networked call app. Duck is one device, two people, no
network peer. These bridge subsystems have no meaning in duck and come out:

- WebRTC peer connection, offer/answer, ICE, TURN/STUN config
- Cloudflare relay / signalling (`talk-signal` worker calls)
- Room join/leave/invite, invite encode/decode (`encInv`/`decInv`)
- Remote peer presence, receipts, typing indicators
- Call UI (dialer, ringing, hang-up, call timer)
- Phrasebook (S7/S8) — deferred to a later release, not deleted, just not wired

> **§2 CORRECTION (G10).** An earlier revision excluded bridge's dual-socket
> English arbitration, reasoning "duck is one language per side". That was my
> assumption, not bridge's contract. Bridge opens a second English-pinned socket for
> `DG_DUAL_LANGS = ['zh','th','ko','ar']` because a socket pinned to those languages
> transcribes spoken English as phonetic native-script nonsense. **The arbitration
> subsystem is IN SCOPE and ported verbatim.** GATE 11 enforces it.

**Everything else stays byte-identical.** Specifically these are NOT touched:

- `CHATMIC` + `startDeepgram` + watchdog + reconnect + generation guard
- `translateWithRetry` + `trCache` + `cleanTr` + `norm`
- `normalizeOutgoing` + `resolveEffectiveLang` + `langMode`
- `detectLangAsync` + `detectByScript` + `SCRIPT_TESTS` + fastText loader + `ftDetect`
- `applyNorthernThaiMap` + `NT_PHRASE_MAP` + `NT_WORD_MAP`
- `speakText`
- `LANG_ORDER`, `LANGS`, `gL()`

Rule: **if a function is in the engine list above and the diff shows it
changed, the change is a defect.** A byte-comparison gate enforces this (§7).

---

## 3. THE ROOM ADAPTER — the one engine-facing change

Bridge's engine is parameterised by a `room` object. Duck has no rooms, but it
has two sides, and a side supplies exactly what a room supplies:

```js
function sideAsRoom(side){
  return {
    myLang:     side==='south' ? CFG.southLang : CFG.northLang,
    theirLang:  side==='south' ? CFG.northLang : CFG.southLang,
    myLangMode: 'fixed'        // duck has no auto mode; normalization always on
  };
}
```

Every engine call site passes `sideAsRoom(side)`. That is the complete
adaptation layer. No engine function signature changes.

`knownLang` policy — **bridge's actual contract, verified against its source**:

- **Typed text → pass NOTHING.** Bridge calls `normalizeOutgoing(room, text)` with
  two arguments (bridge27 line 3814). `knownLang` is undefined, so
  `knownLang || await detectLangAsync(text)` **always runs detection**.
- **Deepgram STT → pass the socket's language.** Bridge:
  `onDGFinal(alt.transcript, myGen, room.myLang)` for single-language sockets.

> **Do not "improve" this.** An earlier revision of this plan said the virtual
> keyboard should pass its layout language because "we genuinely know it". That is
> false parity: it short-circuits detection, so a code-switch typed on the keyboard
> can never be detected. It shipped and broke normalization (graveyard G7).
> The keyboard's layout language is *not* evidence about the language of the text —
> people type Thai on a Latin keyboard and English on a Thai one. GATE 7 enforces
> the two-argument call.

---

## 4. THE OWNERSHIP SWITCH — the one genuinely new module

Bridge has no equivalent (one device = one mic, never contended). This is
duck's own problem and the rebuild's only novel logic. It is written once,
~60 lines, and **nothing else in the app is allowed to mutate input state.**

### 4.1 The complete rule set (your words, as spec)

> It doesn't matter if it's microphone or keyboard. It gets re-initiated every
> single time — whether it's handed off, or cancelled/closed with a tap to
> close the keyboard, or a tap to turn off the microphone, or the microphone
> turns off by itself because the pause has been long enough. That's it.

### 4.2 State — one object, one writer

```js
var INPUT = { owner:null, mode:null };   // owner: null|'south'|'north'  mode: null|'kb'|'mic'
```

### 4.3 The only two functions permitted to write it

```js
function teardown(why){
  // ALWAYS full teardown of BOTH sides. Never conditional. Never trusts flags.
  ['south','north'].forEach(function(s){
    micPipeline[s].hardStop();     // socket closed, audio ctx torn down, generation bumped
    hideKeyboard(s);
    paintIdle(s);                  // clears ring, fill, pending — every visual, both sides
  });
  INPUT.owner=null; INPUT.mode=null;
  speechSynthesis.cancel();
  log('input_teardown',{why:why});
}

function acquire(side,mode,why){
  teardown('acquire:'+side+'/'+mode);   // fresh every time, unconditionally
  INPUT.owner=side; INPUT.mode=mode;
  if(mode==='mic') micPipeline[side].start();   // brand-new pipeline instance
  else showKeyboard(side);
  paintActive(side,mode);
  log('input_acquire',{side:side,mode:mode,why:why});
}
```

**Every acquisition calls `teardown()` first. No exceptions, no fast paths, no
"it's already free so skip it".** The bug class we could never close came
entirely from conditional teardown that trusted remembered state. Remembered
state lies. Teardown is unconditional and idempotent, so it is always safe.

### 4.4 Every event, exhaustively

| Event | Action |
|---|---|
| Side X taps mic, `owner===null` | `acquire(X,'mic')` |
| Side X taps kb / focuses input, `owner===null` | `acquire(X,'kb')` |
| Side X taps mic, `owner===X`, mode mic | `teardown('self-stop')` — **off, fully** |
| Side X taps kb-close, `owner===X`, mode kb | `teardown('self-close')` |
| Side X taps anything, `owner===Y` | `requestFrom(Y)` → overlay on Y |
| Y allows | `acquire(X, requestedMode)` — teardown inside handles Y |
| Y declines / 20s timeout | nothing changes; X's pending cleared |
| Message sent (Enter or ➤) | `teardown('sent')` |
| Deepgram endpoint fires (pause) | `teardown('pause')` |
| Mic error / socket dies | `teardown('error')` |

There is no other path. No other function may write `INPUT`, start a pipeline,
or show a keyboard. A grep gate enforces this (§7).

### 4.5 Visual state is derived, never independently set

`paintIdle`/`paintActive` are the only painters. Three states per side,
matching what you described:

- **idle** — dark mic glyph, white fill, grey border
- **active-mic** — white glyph, red fill, blue ring
- **pending-request** — pulsing blue ring, no fill

Because `teardown()` always calls `paintIdle` on **both** sides, a stuck ring
is structurally impossible — there is no code path that clears ownership
without repainting both sides.

---

## 5. UI — what is taken from duck.html as donor

Hand-picked components only. Each is copied, reviewed, and re-attached to the
new engine. Nothing is bulk-copied.

| Component | From | Change on the way in |
|---|---|---|
| Two-panel tabletop layout, 180° north rotation | duck.html | keep |
| Two-column bubble (source \| translation) + day separators + timestamps | duck.html | keep; re-wire actions to new switch |
| Bubble action buttons (🔊 speak, ➤ send) | duck.html | keep; always-visible; `➤` bypasses switch by design |
| Compose strip (mic · TTS · input · send, gear south-only) | duck.html | keep; re-wire to `acquire`/`teardown` only |
| Config modal + Calling & Sync Keys + diagnostics panel | duck.html | keep |
| Custom colour swatches (native pickers break rotation) | duck.html | keep |
| Request/allow/decline overlay | duck.html | keep; drive from `requestFrom` only |
| **Virtual keyboard** | duck.html | **REBUILT — see §6** |

---

## 6. KEYBOARD — rebuilt, not donated

Current keys are 32px. That is the cause of "made for the fingers of an
infant". It is not a style preference; 32px is below every published minimum
touch target and is genuinely unusable for typing.

**Hard requirements:**
- Key height **≥44px** (Apple HIG 44pt, Material 48dp) — non-negotiable, gated
- Key gap ≥4px (below this, adjacent-key mis-taps dominate regardless of size)
- Keyboard may occupy up to **50vh** of its own half — typing beats transcript real-estate
- No swype (removed, stays removed)
- Layout follows `sideAsRoom(side).myLang` at the moment of `showKeyboard`, re-read live, never cached
- Korean 2-beolsik automaton + Japanese romaji→kana: keep duck's implementations (these genuinely work and have no bridge equivalent)

If 44px keys plus the transcript don't both fit a given viewport, the
**transcript shrinks** — never the keys.

---

## 7. GATES — mechanical, run before every deploy

A build that fails any gate does not ship.

1. **No duplicate declarations** — `grep -o "function [a-zA-Z_]*(" | sort | uniq -d` must be **empty**. This single gate would have prevented the entire class of failure that forced this rebuild.
2. **Engine integrity** — for every function in §2's keep-list, byte-compare against `bridge-turn27-base.html`. Any diff fails the build.
3. **Single writer** — `INPUT.owner=` and `INPUT.mode=` appear only inside `teardown`/`acquire`. `micPipeline[...].start()` appears only inside `acquire`.
4. **Parse** — every `<script>` block compiles.
5. **Touch target** — no `.duck-key` height rule below 44px.
6. **No orphan calls** — every called function resolves to exactly one definition.
7. **Normalization parity (G7)** — the typed call site must be exactly
   `normalizeOutgoing(sideAsRoom(side), text)`. A third argument fails the build.
8. **Compose strip discipline (G8)** — `sendFrom` must clear the strip
   unconditionally; the STT callback must not write to the strip at all.

---

## 8. BUILD ORDER — internal steps, single delivery

Steps A–E are **internal build stages, verified by my own harness. They are
never handed over.** Intermediate scaffolding has no utility to the user and
testing it is not the user's job. There is exactly one delivery: a complete,
working app.

Verification at each stage is mechanical and runs in my container:
- all six gates from §7
- a headless driver that walks every row of §4.4 and asserts the resulting
  `INPUT` state and painted visual state after each transition
- byte-comparison of every engine function against `bridge-turn27-base.html`
- a `normalizeOutgoing` round-trip fixture: fixed inputs, expected outputs,
  compared against bridge's results for the same inputs

| Step | Internal deliverable | My verification |
|---|---|---|
| A | bridge27 minus §2 removals; engine intact | Gates 1,2,4; normalize fixture passes |
| B | Ownership switch (§4) | Gate 3; headless driver walks all §4.4 rows |
| C | Tabletop UI attached (§5) | Gates 1–5; round-trip fixture through real DOM |
| D | Keyboard rebuilt (§6) | Gate 5; synthetic tap targets ≥44px verified |
| E | STT live both sides through the switch | Full §9 run against my harness |

**Delivery:** one URL, once, when every item in §9 passes my harness. It
replaces `duck.html` at that point; the old file is archived as
`duck-v1-archive.html`. If §9 cannot be fully verified by harness alone (live
Deepgram audio is the one case — it needs a real mic and a real key), I say so
explicitly at delivery and name exactly which items are unverified and why,
rather than quietly handing over something half-checked.

## 9. ACCEPTANCE — the failures that forced this rebuild

Each is a direct restatement of a defect that reopened repeatedly. All must pass.

1. Tap compose strip after sending an audio message → keyboard opens. (Reopened 3×.)
2. Mic on, tap own mic → mic **fully off**, ring gone, socket closed. (Reopened 4×.)
3. Side A mic hot → side B taps mic → **request overlay**, never a silent steal. (Reopened 2×.)
4. Grant a request → previous owner's mic is dead, not backgrounded. (Reopened 2×.)
5. Both mics live simultaneously: **impossible by construction**.
6. Type a full sentence on a phone without mis-taps.
7. English spoken into a Chinese-set side → Chinese in-panel → English round-trip **matching bridge's quality**.
8. Normalization result identical to bridge given identical input. (The engine is the same bytes, so any difference is an adapter defect.)
9. No stuck blue ring reachable by any sequence of taps.
10. Compose input never triggers the browser password manager.

---

## 10. EXPLICIT NON-GOALS

- No phrasebook wiring (bridge code retained, dormant, later release)
- No multi-conversation UI (id-keyed storage shape only, per prior §7)
- No swype
- No `auto` language mode — normalization is always on
- No WebRTC / relay / TURN — duck is single-device by definition


---

## 12. BASELINE — 2026-09-14

v2 rebuild shipped and accepted as **baseline**. Two defects found against it,
root-caused, fixed, and guarded:

| ID | Defect | Root cause | Guard |
|---|---|---|---|
| G7 | Normalization below donor parity | Plan §3 told us to pass `knownLang` for keyboard text; bridge passes nothing. Detection was short-circuited, so typed code-switches were undetectable. | GATE 7 + §3 corrected |
| G8 | `➤` left the phrase in the compose strip | `sendFrom`'s clear was conditional on `textOverride==null`, so ➤/STT never cleared. STT additionally wrote the strip before sending. | GATE 8 |

**Strip contract, now explicit:**
- `➤` on a bubble → sends immediately, strip untouched and left empty
- STT final → sends immediately, strip never written
- tap bubble **text** → populates the strip only; user then sends or clears with ✕

Full companion RCA for every historical defect: `duck-graveyard.md`.

**Verification at baseline+fixes:** 8 gates · 25 state-machine · 20 normalization ·
8 strip-discipline · 2 parity assertions. All pass.


---

## 13. DELIBERATE DIVERGENCES FROM BRIDGE

Everything else is a verbatim port. These are the exceptions, each with its reason.
Anything not on this list that differs from bridge is a defect.

| # | Divergence | Why duck must differ |
|---|---|---|
| D1 | Deepgram pipeline is a **per-side factory**, not a device singleton | Two people share one device; bridge only ever has one local mic |
| D2 | **Mic idle auto-stop** (`MIC_IDLE_MS`, 6s, re-armed per utterance) | Bridge has no idle timer — correct for one person on their own device, wrong when an un-released mic blocks the other side's turn (graveyard G11) |
| D3 | No WebRTC / relay / rooms / call UI | duck has no network peer by definition |
| D4 | `log()` mirrored into the diagnostics panel by a **wrapper**, engine bytes untouched | Visibility, without breaking GATE 2 |


---

## 14. BACKLOG

### B1 · Mic turn-release model — revisit (accepted as-is, not settled)

Current behaviour (D2) is a 6s silence auto-release, re-armed per utterance. It was
accepted to unblock testing, not chosen on merit. Four candidates, to be decided
after real two-person use:

| Option | Behaviour | Cost |
|---|---|---|
| **a. As-is** | 6s silence releases the turn | Timer length is a guess; a long thinking pause loses the turn |
| **b. Exactly like bridge** | Never auto-releases; explicit tap only | Matches donor; an un-released mic blocks the other side indefinitely |
| **c. Explicit hand-back** | Speaker must tap to give up the turn; no timer | Unambiguous, no guessing — but an extra deliberate action every turn |
| **d. Both mics live** | Each side transcribed on its own socket simultaneously | Most natural conversationally. Hard: two live Deepgram sockets per device, echo/crosstalk between two mics on one handset, speaker attribution when both talk, and the ownership switch stops being a switch |

Decide from observed use, not theory. If (d) is ever attempted it is a redesign of
the switch, not a tweak — the whole railroad-switch premise assumes one owner.

**Not blocking. Revisit after the next release.**


---

## 15. §7 SHIPPED — 2026-09-14

Conversation persistence built as designed: id-keyed from the start, so "start
fresh" is a pointer move rather than a migration.

```
duck2_conv_index   [{id, createdAt, label, count, lastAt}]
duck2_conv_active  "<id>"
duck2_conv_<id>    [messages]
```

- South-only list in config (switch · new · delete), consistent with the privacy
  boundary — North never sees the list or any history but the live conversation.
- Switching tears down the input switch first, so a conversation change can never
  strand a live mic.
- Any pre-§7 flat `duck2_hist` is adopted into a conversation record once, so no
  existing history is lost.

**Also closed:** TTS-default-off and keyboard-layout-on-open were v1 defects that
did not survive the rebuild — verified correct, no change needed.

**Still open:** GitHub PAT → phrasebooks (field present, feature deferred);
backlog B1 (mic turn-release model).

**Verification:** 13 gates · 83 assertions (25 switch · 20 normalization ·
8 strip · 2 parity · 4 chain · 11 dual-socket · 13 conversations).


---

## 16. §7b MULTI-THREAD CONFIG — REDESIGN (2026-09-14)

§7's flat conversation list in the existing modal is **rejected**. A conversation
is not a container for messages — it is a person you talk to. Language pair,
colours, and name are the thread's identity, not global settings that happen to
be in effect. The config surface is rebuilt around that.

### Model

**Per-thread:** language pair, name (inline-editable, blur/Enter commits),
bubble colours.
**Global (its own tab):** Deepgram key, GitHub PAT.
**Neither — live session state, not a setting at all:** TTS on/off. It resets to
off on every conversation load, same category as mic/keyboard ownership. It is
not stored per-thread and not global; it simply doesn't persist. Tap to hear,
every time.

### Surface

Two tabs: **Conversations** and **Global**.

**Conversations tab**, split top/bottom, both independently scrollable:
- **Top half — cards.** One per thread: flag pair + name. Tap selects a card for
  editing below; selecting does **not** switch the live conversation by itself.
  A collapsible chevron at the top reveals a **trash view** (soft-deleted threads,
  each with Restore / Delete permanently).
- **Bottom half — settings for the selected card.** Language pair, inline name
  field, colour swatches. **Save** and **Cancel** pinned at the top of this half.

**Save/Cancel semantics — the whole model in one rule:**
- **Cancel** → discard edits, stay on whatever conversation is currently live.
- **Save**, selected card *is* the live conversation → edits apply immediately,
  stay put.
- **Save**, selected card is a *different* thread → full `teardown()`, switch to
  it, edited settings already in effect. Same "everything resets" rule as any
  other switch — mic, keyboard, TTS, all zeroed, no exceptions for coming via
  config instead of the card rail.

**New thread (＋):** inherits the *current live* thread's language pair as a
starting point, immediately editable — not a blank en/th default.

**Global tab:** Deepgram key, GitHub PAT. Unchanged from §6/§7.

### Soft delete

Delete moves a thread's record under a chevron-revealed trash list rather than
destroying it. Each trashed entry offers **Restore** (returns to the main list,
history intact) or **Delete permanently** (irreversible, the only actual
destruction). Deleting the live conversation switches to the most recent
remaining thread, or creates a fresh one if none remain — same teardown rule.

### What this replaces

§7's flat list-in-modal UI is removed. The id-keyed storage underneath (§7) is
correct and unchanged — index, active pointer, per-conversation records — this
redesign only changes the surface and adds `label` editing, colour/language as
per-record fields instead of global `CFG`, and a `trashedAt` field for soft
delete.


---

## 17. §16 SHIPPED — 2026-09-14

Multi-thread config surface built and verified: two tabs (Conversations/Global),
scrollable card grid over scrollable per-thread settings, inline-editable name
(blur/Enter commit), Save/Cancel with the working-copy edit-buffer model, soft
delete with trash/restore/purge, new-thread inherits the live pair. TTS confirmed
as pure session state, never stored anywhere, per-thread or global.

Verification: 15 gates + 116 assertions across 8 suites (state machine,
normalization, strip discipline, parity, dual-socket, conversation persistence,
§16 behavioural rules).

---

## 18. §16 REJECTED AND ROLLED BACK — 2026-09-14

`duck.html` reverted to the §7 baseline (commit `4cd50ed6e6`). §16 (multi-thread
config) is **not shipped**. Reasons: normalization reported as regressed (root
cause not confirmed — see graveyard G12), and font-size/font-colour controls
missing from the per-thread settings (confirmed omission).

**Process change for the retry:** §16 was built as a from-scratch rewrite of the
config section rather than a diffed change against the accepted baseline. That
made isolating what actually changed harder than it should have been, and it's
why G12 can't yet point to a single line. The next attempt must be a **reviewable
diff against `4cd50ed6e6`**, not a rebuilt surface — so if something regresses
again, the change that caused it is immediately identifiable rather than
requiring a search across the whole config module again.

**Before rebuilding §16:**
1. Confirm normalization is genuinely correct on the restored baseline (user
   retest, live device — this needs real Deepgram/fastText/mic, none of which
   exist in the harness).
2. Add font-size and font-colour back to the per-thread field set (they exist in
   the §7 modal already; §16 must carry all four fields — background colour,
   font colour, font size, name — not just background colour).
3. Rebuild §16 as a targeted diff, gate-by-gate, so each change against the
   working baseline is independently verifiable.

---

## 19. SECOND ROLLBACK — 2026-09-14

`duck.html` reverted further, to `f1cae14139` — immediately after the bridge-core
rebuild and the G10 dual-socket fix, before any conversation/config work began.
§7 is also not shipped as of this entry (was briefly re-accepted, now rejected
alongside §16).

**Hold: no further building until translation/normalization is confirmed working
on a real device against this exact commit.** See graveyard G13.
