# duck.md — MASTER PLAN

**Sole authority.** Everything below §2 is decided and closed. Build history,
RCA writeups, and superseded designs live in **Appendix A** — nothing there is
live or blocking; it's kept for reference only.

---

## 0 · TURN / STAGE LEDGER — THE CHAIN IS THE LAW

Every turn runs **pre-base → base → pre-ship → ship → post-ship**, in that
fixed order. A new turn begins only after post-ship completes. Every stage is
its own permanently-hosted file, `duck-turnNN-STAGE.html` (two artifacts per
turn from Turn 22 on: `chat-turnNN-STAGE.html` + `chat-admin-turnNN-STAGE.html`).

| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 20·post-ship | Bridge-core engine (byte-verified) + ownership switch + 44px keyboard + dual-socket arbitration + mic idle release. | **ACCEPTED BASELINE — proven working for both South and North.** | https://acmeproducts.github.io/stuff/duck-turn20-post-ship.html (= `duck.html`) |
| 23·base | Keyboard engineered rebuild (§3 items 1–21): SHARK2 recognizer, 48px keys, key-preview popup, haptics. | **BUILT — awaiting real-device test** | https://acmeproducts.github.io/stuff/chat-turn23-base.html |
| 22·pre-base | Two-file split: `chat.html` (stateless shell, `?room=` required) + `chat-admin.html` (room create/edit/delete/restore, keys, font colour+size). All 6 gates pass — engine byte-identical (16/16), switch harness (25/25), no room/key code in chat.html, no-room gate present, never writes rooms_index. | **SHIPPED as pre-base — awaiting real-device test** | https://acmeproducts.github.io/stuff/chat.html · https://acmeproducts.github.io/stuff/chat-admin.html |

Turns 20·base through 20·ship, and the two rejected Turn 21 candidates, are
Appendix A history — superseded, not live. See Appendix A §0 for those rows if
ever needed.

---

## 1 · ADMIN / SHELL SPLIT — SPEC (Turn 22)

### 1.1 The shape

Two files:

- **`chat-admin.html`** — owns every room: create, edit (language pair, name,
  background colour, font colour, font size), soft-delete/restore/purge, and
  the two global keys (Deepgram, GitHub PAT). Only place any of it lives.
- **`chat.html`** — the tabletop shell (engine, switch, keyboard, bubbles),
  stateless about rooms. Requires `?room=<id>`, reads that room, renders. No
  room list, no room creation, no keys UI, no gear icon.

### 1.2 The room id — obfuscation, not access control

A long random id in the URL so an unattended phone doesn't invite
url-hunting — not a security boundary, no crypto, no token exchange, no relay.

```
room id = 22 random URL-safe characters, generated once at creation
example: chat.html?room=k3nF7xQ2mZpL9wRj4TbYs1
```

Deliberately not bridge's `encInv`/`#j=` — that encodes join tokens for a
second physical device over a relay. Duck has neither.

### 1.3 Data ownership

`chat-admin.html` writes; `chat.html` only ever reads its own room by id.

```
duck_rooms_index   [{id, createdAt, label, southLang, northLang,
                      southBg, northBg, fontColor, fontSize, trashedAt}]
duck_room_<id>      [messages]
tb_dg_key           — Deepgram key, shared with bridge
duck_gh_pat         — GitHub PAT
```

### 1.4 chat.html without `?room=`

No standalone mode. Missing or unresolved `?room=` → one line: "Open this
from chat-admin." Nothing else — no default room, no settings surface.

### 1.5 chat-admin.html contents

- Room list (card grid), tap → edit form → Save/Cancel (working-copy model —
  edits apply only on Save)
- ＋ New room → blank form, no inherited defaults (no "current room" concept
  in an admin app)
- **Launch** button per room → `location.href = 'chat.html?room='+id` (same
  tab — avoids mobile popup blocking and keeps one tab to manage)
- Trash view (chevron), Restore / Delete permanently
- Global tab: Deepgram key, GitHub PAT — the entirety of chat.html's former
  gear icon, nothing else

### 1.6 Visual identity

Shared CSS with chat.html — siblings in one workflow, not two products.

### 1.7 Gates

1. `chat.html` contains no room-creation, room-list, or key-entry code (grep-checked).
2. `chat.html` refuses to render without a `?room=` that resolves.
3. Engine blocks byte-identical to bridge27 (unchanged Gate 2 from Turn 20).
4. `chat-admin.html` writes; `chat.html` never writes `duck_rooms_index`.
5. Font colour and font size present and wired, alongside background colour.
6. Ownership-switch harness (25 assertions) re-run unmodified — proves the
   switch/engine is untouched by the file split.

---

## 2 · BACKLOG

### B1 · Mic turn-release model — SETTLED, build next

Mic icon shows muted on both sides by default (matches bridge's visual state).

- **Single tap** → engages: white icon, red circle fill, blue ring. Releases
  automatically after **3 seconds of actual silence** (mic-sensitivity-gated,
  not a bare timer — silence means the input level, not just elapsed time) —
  back to muted.
- **Long press** → press-once-to-latch. Stays engaged with no timer until
  either (a) a single tap toggles it back to muted, or (b) the partner
  requests control and is granted it — same request/grant flow already built
  for the switch, unchanged.

This replaces the current 6s-flat-timer placeholder entirely. Build target,
not exploration — no longer "revisit later."

**Also shipped 2026-09-16 (bundled with Track A per owner instruction):**
Chrome's save-password prompt on chat-admin's Deepgram/PAT key fields — root
cause was `type="password"` combined with `autocomplete="new-password"`,
which is exactly Chrome's own trigger for offering to save a credential.
Neither field is a login; both are opaque tokens. Fixed with a plain
text-type field using the readonly-until-focus pattern, the one suppression
Chrome reliably honors.

### TRACK A · Dictionary-backed input, non-composing languages — build next

**B2 (autocomplete) + B3 (swype) + B5 (keyboard localization) collapse into one
build for every language that doesn't require candidate composition** — Latin
script plus flat-character-set scripts (Thai, Vietnamese, Russian, Arabic,
etc.). All three are downstream of the same mechanism: a downloadable
per-language word list, assigned per room in chat-admin.

- chat-admin detects whether a room's assigned language's on-device dictionary
  is already installed; if not, prompts to download it during room setup —
  not a silent failure discovered later inside chat.html.
- Once a room has its dictionary, autocomplete (B2), swype (B3), and correct
  keyboard localization (B5, non-composing half) all read from it. One
  dependency, three UI outcomes — not three separate builds.
- Korean and Japanese composition (existing hand-built IME in chat.html) is
  untouched by this track — already working, not in scope here.

**Chinese is explicitly excluded from Track A** — see Track B.

**Shipped to chat-admin.html (2026-09-16):** per-room dictionary status UI —
detects whether this browser has downloaded the word-list asset for each of a
room's two languages (checked against `localStorage`, not an OS-level query —
no browser API can truthfully answer "is a dictionary installed on this
device," so this checks the thing chat.html's autocomplete/swype will actually
read), shows Ready/Not downloaded per language, Download button on missing
ones. zh/ko/ja correctly produce no row.

**Real gap, stated plainly: the dictionary asset files themselves
(`dict/<lang>.json`) do not exist yet.** The download mechanism is real and
will correctly fail with a Retry button rather than silently succeed — but
until the files are published, every language shows "Not downloaded" and
stays that way. Publishing the word lists is the next piece of Track A, not
yet done.

### TRACK B · Composed-script input (Chinese first) — after Track A ships

Simplified Chinese (pinyin → ranked candidate selection) is not a bigger
dictionary — it's a different kind of component, an embedded IME engine, not
a data file. Real open-source options exist: **rime** or **libgooglepinyin**;
neither needs to be built from scratch, but integrating either is real
engineering effort, not a port.

**Explicitly sequenced after Track A**, not parallel to it: Track A builds
chat-admin's per-room dictionary-assignment mechanism against the simple case
first. Track B then adds one more asset type (an IME engine, not just a word
list) to a delivery mechanism that already exists and already works, rather
than building the mechanism and the hard engine at the same time. Engine
choice (rime vs libgooglepinyin) is not yet made — open question for when this
track starts.

Slot is Chinese-first but not Chinese-only — the same mechanism can later take
on other composed scripts if they come up.

### B4 · Phrasebook via omni-search — exploration, unchanged

The compose input doubles as a search box: typing filters a phrasebook of
common phrases, shown as tappable suggestions, tap inserts the full phrase.
Bridge already has a phrasebook subsystem (Appendix A notes duck deliberately
left it dormant, not ported) — worth a real look at what's reusable there
before scoping this as new build versus adaptation. Independent of Tracks A/B;
not resequenced by this update.


---

## 3 · KEYBOARD — ENGINEERED REBUILD SPEC (Turn 23)

Status: **APPROVED (items 1–21) and BUILT — Turn 23·base, awaiting real-device test.**
Artifact: https://acmeproducts.github.io/stuff/chat-turn23-base.html (= `chat.html`).
Harness: recognizer fixture 22/22 top-1 (gate 18 ≥90% top-4); gates 19–21 pass;
switch 25/25, autocomplete 5/5, listener-dup 4/4, keyboard 7/7. Items 15–17 are
hardware-only and unverified by harness, per item 22.

### 3.1 Findings (facts, verified in code — not theory)

1. **Swipe resolves nothing because the scoring direction is wrong for real gestures.**
   `swypeScore` requires every letter the finger crosses to appear in the candidate
   word, in order. A real swipe is *dense*: `hello` on QWERTY crosses
   `h g t r e r t y u i o p l k o`. No word contains that sequence, so every swipe
   returns `no_match` and the bar stays blank. The blue line draws because path
   capture works; recognition is what fails. My earlier test only used a hand-typed
   sparse path (`h e l p`), which passes the wrong algorithm and hid this.
2. **Haptics are not wired to a signal the phone can feel.** `navigator.vibrate(8)` /
   `(4)` are below the perceptible floor on most handsets. Android Chrome supports
   `navigator.vibrate`; **iOS Safari has no web vibration API at all** — haptics on
   iPhone are impossible from a web page, no library changes that.
3. **Taps insert on release, with no key-preview on press.** Text appears only on
   `pointerup`, and nothing rises above the finger on `pointerdown`. That gap is the
   "flat, drag every word out of it" feel. Gboard also commits on release, but shows a
   popup preview on press — that preview is the missing responsiveness cue.
4. **Keys are too small.** 44px tall, ~34px wide with 4px gaps on a 380px screen.
   Gboard: ~48–52px tall, 6–8px gaps, larger glyphs.
5. **Shift auto-reset corrupts key labels** (`relabelKeysOnly` maps `SHIFT`/`BKSP`
   tokens onto letter keys). Latent bug; will surface after any shifted letter.
6. Dictionary loading, autocomplete-on-type, and the ownership switch are **correct**
   and unchanged by this spec.

### 3.2 Decision

Implement a proper shape-writing recognizer — the published SHARK2 algorithm
(Kristensson & Zhai) — over the existing frequency-ranked dictionary, and rebuild
the key surface to native-keyboard geometry and feedback. This is the standard
approach behind every serious gesture keyboard; there is no open-source drop-in,
so it is implemented here, correctly, once.

### 3.3 Recognizer (replaces `swypeScore` / `resolveSwype`)

1. **Capture** pointer path at native event rate (already done).
2. **Resample** the gesture to N=48 equidistant points (path-length normalized).
3. **Start/end gate**: candidate words must begin within 1.3 key-widths of the first
   sample and end within 1.3 key-widths of the last sample. This prunes the 8000-word
   dictionary to a few dozen candidates before any scoring.
4. **Template**: for each surviving candidate, build the ideal path through its
   letters' key centers (consecutive duplicate letters collapse to one point),
   resampled to the same N.
5. **Shape channel**: translate both to centroid, scale to unit size, mean point-wise
   Euclidean distance.
6. **Location channel**: mean point-wise distance on unnormalized coordinates,
   tunnel-tolerant (distances under half a key-width count as zero).
7. **Combine**: score = shape + location, then re-rank the top 8 by dictionary
   frequency rank (the list is already frequency-ordered).
8. **Output**: best match inserted, next four in the candidate bar for one-tap
   correction — same bar autocomplete already uses.
9. **Test fixture**: recorded *dense* paths (generated by walking real key-center
   geometry between letters) for ≥20 words, asserting top-1 or top-4 hit. The prior
   sparse-path test is deleted; it validated the wrong thing.

### 3.4 Key surface

10. Key height 48px, horizontal gap 6px, glyph 20px.
11. Keyboard may occupy up to 55vh; transcript shrinks first, never the keys.
12. **Key-preview popup** on `pointerdown`: a larger copy of the glyph rises above
    the key and follows the finger during slide-to-adjust; disappears on release.
13. Tap commits on `pointerup` (unchanged — required for swipe disambiguation).
    12px movement threshold decides tap vs swipe (unchanged).
14. Fix `relabelKeysOnly` to skip function-key tokens (finding 5).

### 3.5 Haptics

15. Tap: `navigator.vibrate(18)` on `pointerdown`. Swipe: `vibrate(10)` per new key
    entered; `vibrate(25)` on successful resolution.
16. **iOS: documented as unsupported.** No web API exists. Displayed once in
    diagnostics on an iOS user-agent so it is never mistaken for a defect.
17. Android: one-time diagnostics line on first keyboard open reporting whether
    `navigator.vibrate` returned true.

### 3.6 Gates (added to §1.7)

18. Recognizer fixture (item 9) passes ≥90% top-4 on the 20-word dense set.
19. Grep gate: no `swypeScore` symbol remains (old algorithm fully removed).
20. Key height ≥48px enforced.
21. Existing gates unchanged: engine byte-identity, switch harness 25/25,
    autocomplete 5/5, no duplicate listeners 4/4.

### 3.7 Delivery

22. One turn, one URL, all items 1–21 verified by harness before handoff. Items 15–17
    are the only ones that cannot be harness-verified (real hardware); stated at
    delivery as such.

---

# APPENDIX A — HISTORICAL BUILD NARRATIVE

Everything below is preserved verbatim from the prior plan. Superseded by §0–§3
above where noted; kept in full because the RCA and gate rationale in it remain
correct and referenced by `duck-graveyard.md`.

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


---

## 4 · MIC VISUAL STATE SPEC (Turn 24)

Status: **PROPOSED — awaiting owner answers to 2 open questions before build.**

### 4.1 Single tap (timed mode)

1. White mic glyph, red circle fill, blue ring — active listening state.
2. Sound level indicator animates INSIDE the mic icon, driven by the live
   audio pipeline (same AudioWorklet/ScriptProcessor already running in the
   Deepgram pipeline — reading from it, not a separate analyser).
3. When silence is detected (level below threshold for 3 continuous seconds),
   the blue ring begins a **clockwise countdown** from 0° to 360°, transitioning
   from blue to red as it sweeps. The user sees the countdown start.
4. When the ring is fully red (countdown complete), the mic disengages
   (teardown, as per the existing switch rules).
5. Sound level indicator remains animated throughout the countdown — the mic
   is still live and still picking up.
6. If speech resumes before the ring completes, the countdown resets to blue.

**Open question A:** Does the 3-second countdown begin at the first moment of
silence (the ring itself IS the countdown), or does silence have to persist
for a threshold before the ring starts? Default choice if not answered: ring
starts at first silence, takes 3 seconds to complete — the countdown is the
timeout.

### 4.2 Long press (latch mode)

7. White glyph, red fill, ring is **fully red** immediately on engagement —
   no countdown, no timeout.
8. Same sound level indicator as 4.1.
9. Stays engaged until (a) user taps to toggle off, or (b) partner requests
   control and the user grants it — full teardown per the existing switch
   rules.
10. No ring animation while in latch mode — the fully red ring IS the visual
    signal that latch is active.

**Open question B:** The live audio pipeline in the existing Deepgram factory
reads from the AudioWorklet/ScriptProcessor already in `createMicPipeline`.
Plan is to expose the analyser from there. Confirm or override.

### 4.3 Implementation notes — REVISED after two failed releases

Root cause of both failures (documented in graveyard): the AnalyserNode is created
inside `ws.onopen`, 300–800ms after `acquire` fires on a real device. `paintActive`
is called synchronously by `acquire`, so the analyser is always `null` when the
level loop is started from there. The loop returns immediately; nothing runs.

Correct architecture — all items below are mandatory before any build attempt:

11. **SVG ring**: `stroke-dasharray`/`stroke-dashoffset` on a `<circle>` path,
    driven by a RAF loop. Set synchronously to full-blue on acquire (opacity:1,
    dashoffset=0). Countdown and level loop start only from the audio-ready
    callback (item 13 below) — never from `paintActive`.
12. **Level indicator**: AnalyserNode inserted into the audio graph immediately
    after `P.src` is created inside `ws.onopen`. Inner SVG disc (r 6–16px, opacity
    0.15–0.85) pulsing with RMS level — Bridge-style breath inside the glyph.
    Active in both timed and latch mode.
13. **Audio-ready callback**: `createMicPipeline` accepts an `onAudioReady(analyser)`
    callback, fired once from inside `ws.onopen` after `P.analyser` is assigned.
    The level loop and silence detection start exclusively from this callback.
    `paintActive` sets the ring immediately (synchronous); everything audio-dependent
    waits for `onAudioReady`.
14. **Silence detection**: RMS < 0.015 sustained — clock starts at first silence
    sample inside the RAF loop (not at acquire time). Speech resumes → clock clears
    AND ring actively repaints to full blue (not just clears the clock variable).
15. **Latch**: `pointerdown` ≥400ms → latch flag. After acquire, `onAudioReady`
    fires normally; the RAF loop runs but the silence clock is never started.
    Ring stays fully red. Level indicator active.
16. **Test harness gate** (mandatory before ship): assert (a) `onAudioReady` callback
    fires; (b) RAF loop runs at least one tick; (c) a synthetic RMS>0.015 input
    resets `silenceSince` and repaints the ring to full blue; (d) a sustained
    RMS<0.015 input sweeps the ring to fully red and calls teardown. These must
    pass before any device test.

### 4.4 Ledger

| Build | Description | Status |
|---|---|---|
| Turn 24·attempt 1 | SVG mic, AnalyserNode, countdown, latch | REJECTED — countdown ran immediately, no level indicator, no reset on speech |
| Turn 24·attempt 2 | Bug fixes to attempt 1 | REJECTED — same root cause, wrong call site patched |
| Turn 24·base | Rebuilt per items 11–16 above | **NOT YET BUILT** |
