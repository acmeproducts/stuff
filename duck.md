# duck.md — REBUILD PLAN (v2)

**Supersedes all prior duck.md content.** Prior plan described an incremental
build on `chat.html` with bridge subsystems imported piecemeal. That approach
has failed and is abandoned. This document is the sole authority.

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

`knownLang` policy (unchanged from bridge's own contract):
- duck virtual keyboard → pass that layout's language (we genuinely know it)
- Deepgram STT → pass the language the socket was opened with
- anything else (paste, OS keyboard) → pass `null`, let detection run

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

---

## 8. BUILD ORDER

Each step ends in a deployable, testable file. No step begins before the prior one passes its gates.

| Step | Deliverable | Gate |
|---|---|---|
| **A** | `duck2.html` = bridge27 with §2 removals only. No UI yet; engine + config + diagnostics reachable. | Gates 1,2,4. Deepgram key entry works; a typed test string round-trips through `normalizeOutgoing` and logs correctly. |
| **B** | Ownership switch (§4) implemented standalone, driven by two temporary test buttons. | Gate 3 + every row of §4.4 manually verified, including stuck-ring impossibility. |
| **C** | Tabletop UI (§5) attached — panels, bubbles, compose strips, config. | Gates 1–5. Typed message round-trips end-to-end both directions. |
| **D** | Keyboard rebuilt (§6). | Gate 5 + type a full sentence both sides without mis-taps. |
| **E** | STT live on both sides through the switch. | Full §9 acceptance. |
| **F** | Swap: `duck2.html` → `duck.html`. Old file retained as `duck-v1-archive.html`. | All gates. |

---

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
