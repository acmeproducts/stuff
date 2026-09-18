# duck-graveyard.md

Defects that were **fixed, reopened, or shipped wrong**, with the root cause and
the structural change that makes each one unable to recur. A fix with no
structural guard goes back on this list eventually — that is the pattern this
file exists to break.

Status key: **BURIED** = structural guard in place · **OPEN** = fixed but only by
correcting code, no guard yet.

---

## G1 · Two complete engines in one file (v1, fatal)

**Symptom:** normalization behaved inconsistently; fixes "didn't take"; the same
issues reopened across many turns.

**Root cause:** `duck.html` v1 accumulated **2× `detectLangAsync`, 2× `loadFastText`,
2× `detectByScript`, 3× `ftAllowed`, 13 duplicate declarations total.** JavaScript
resolves duplicate `function` declarations last-wins. We were reading and editing
one copy while a *different* copy executed. The file's behaviour was determined by
declaration order, not by the code under inspection.

**Why it happened:** every subsystem was imported by pasting into an existing file
rather than replacing a named module. Nothing ever checked for collisions.

**Structural guard:** GATE 1 — build fails if
`grep -o "function NAME(" | sort | uniq -d` is non-empty. v2 ships with 0.

**Status: BURIED**

---

## G2 · Conditional teardown → stuck ring, silent steal, zombie mic

**Symptom (reopened 4×):** blue ownership ring stuck on; mic kept recording after
release; the other side could take input with no request; tapping compose after a
voice message gave no keyboard.

**Root cause:** teardown was **conditional** — it consulted remembered state
(`owner`, `recOn`, `.on`) to decide what to stop. That state lied. Auto-release on
pause deliberately set `owner=null` while leaving the pipeline running, so
`owner===null` did **not** mean "nothing is live". Any path that trusted it left a
pipeline alive or a visual unpainted.

**Structural guard:** `teardown()` is **unconditional and idempotent** — always
hard-stops *both* sides and repaints *both*, never consults state. `acquire()` calls
it first, always. GATE 3 proves only `teardown`/`acquire` write `INPUT`; GATE 3b
proves `teardown()` is the first statement in `acquire()`. Stuck ring is now
unreachable: no code path clears ownership without repainting both sides.

**Status: BURIED**

---

## G3 · Virtual keys stealing caret focus ("abc" → "cba")

**Root cause:** buttons receive `mousedown` before `click`; focus moved to the
button, so `selectionStart` reset to 0 and every character inserted at position 0.

**Structural guard:** every key and candidate binds
`pointerdown → preventDefault()`, so focus never leaves the input. Carried into v2
at build time rather than patched in.

**Status: BURIED**

---

## G4 · 32px keys

**Root cause:** treated as a style value, not an ergonomic constraint. 32px is below
every published minimum (Apple HIG 44pt / Material 48dp).

**Structural guard:** GATE 5 fails the build below 44px.

**Status: BURIED**

---

## G5 · `norm is not defined`

**Root cause:** a partial engine extraction — `normalizeOutgoing` was copied but the
`norm()` it calls lived 3,000 lines earlier in bridge and was left behind. Parse
checks pass because the reference is only resolved at call time.

**Structural guard:** GATE 2 byte-compares every engine block against bridge, and
the headless harness *executes* `normalizeOutgoing`, so an unresolved reference
fails the build rather than the phone. (This same harness caught a missing
`EXTRA_LAYOUTS` during the v2 build — before delivery.)

**Status: BURIED**

---

## G6 · Chrome password manager hijacking the compose input

**Root cause:** Chrome infers login context from *nearby* password fields; the
Deepgram key input on the same page was enough. `autocomplete="off"` is ignored by
Chrome for this heuristic.

**Structural guard:** compose inputs ship with
`autocomplete="new-password" role="presentation"` — the only override Chrome honours.

**Status: BURIED**

---

## G7 · Normalization not at parity with bridge (v2 baseline)

**Symptom:** typed code-switches not rewritten; quality below the donor.

**Root cause — a divergence I introduced in the plan, not a coding slip.** Plan §3
said "duck virtual keyboard → pass that layout's language as `knownLang`". Bridge
does **not** do this. Bridge's typed path calls `normalizeOutgoing(room, text)` with
**two arguments** — `knownLang` undefined — so `knownLang || await detectLangAsync(text)`
always runs detection. duck2 passed `langOf(side)` for keyboard input, which
**short-circuits detection entirely**, so a code-switch typed on the keyboard could
never be detected. Same class of bug as an earlier v1 defect; reintroduced because
the plan codified my assumption instead of bridge's actual contract.

**Fix:** typed path passes no `knownLang`, matching bridge exactly. STT keeps the
socket language, also matching bridge (`onDGFinal(..., room.myLang)`).

**Structural guard:** GATE 7 — the typed call site must match
`normalizeOutgoing(<room>, <text>)` with no third argument. Plan §3 corrected so the
divergence cannot be re-derived from the plan.

**Status: BURIED**

---

## G8 · `➤` leaving text in the compose strip

**Symptom:** tapping ➤ on a bubble sent the message *and* left the phrase sitting in
the compose strip afterwards.

**Root cause:** two separate paths wrote the strip and neither cleared it.
`sendFrom(side, textOverride)` skips its clear branch when `textOverride` is
supplied (`if(inp && textOverride==null)`), so anything already in the strip
survived the send. The STT callback made it worse by writing the transcript into
the strip *before* calling `sendFrom`, so voice messages always left their text
behind.

**Fix:** `sendFrom` clears the strip on **every** path. The STT callback no longer
writes to the strip at all — it sends directly. Tapping bubble *text* remains the
only action that populates the strip.

**Structural guard:** GATE 8 — harness asserts the strip is empty after ➤ and after
an STT send, and non-empty only after a text tap.

**Status: BURIED**

---

## G10 · Chinese→English transcription garbage (dual-socket omitted)

**Symptom:** English→Chinese worked; the Chinese side produced nonsense.

**Root cause — a subsystem I deliberately cut in plan §2.** Bridge defines
`DG_DUAL_LANGS = ['zh','th','ko','ar']`: for these rooms it opens a **second
Deepgram socket pinned to English** on the same audio and arbitrates between the
two results. Its own comment explains why — a socket pinned to one of these
languages transcribes any English the speaker uses *phonetically*, as native-script
nonsense. Plan §2 said "bridge's dual-socket English arbitration is NOT included:
duck is one language per side", which was my assumption, not bridge's contract. zh
is precisely the case that needs it.

Arbitration restored verbatim: the native result is held `_DG_HOLD_MS`; a
substantial English result inside the window displaces it; a native result arriving
just after an English one is suppressed. Also replaced my hand-written `DG_LANG`
table with bridge's `DG_LANGS` and its `dgLangParam`/`dgUseMulti` logic — mine
lacked the `multi` path entirely.

**Structural guard:** GATE 11 — build fails without `DG_DUAL_LANGS`,
`dgArbitrateNative`, `dgArbitrateEnglish`, `dgUseDual`, and the per-side English
socket. Plan §2 corrected.

**Status: BURIED**

---

## G11 · Mic never releases the turn (push-to-talk, then stuck-on)

**Symptom:** first as PTT (mic died after every utterance), then the opposite — mic
sat on indefinitely after the speaker stopped.

**Root cause:** two different errors either side of the correct behaviour. The PTT
half was `sendFrom` calling `teardown('sent')` unconditionally, killing the mic on
every final. Removing that fixed PTT but left nothing to end the turn.

**The honest finding:** bridge has **no idle timer at all** — `CHATMIC` runs until
the user taps it off. That is correct for bridge (one person, own device; an idle
mic costs nobody anything) and wrong for duck (two people, one device; an
un-released mic blocks the other side's turn). So this is the one place duck
**deliberately diverges**, recorded here so it is never "corrected" back to a port.

`MIC_IDLE_MS` (6s) is armed on acquire and re-armed on every final transcript, so
it measures silence since the last utterance, not since the mic opened. Natural
pauses mid-thought keep the turn; sustained silence releases it.

**Structural guard:** GATE 10 (a pause must not end the turn) and GATE 12 (sustained
silence must).

**Status: BURIED**

---

## G12 · §16 REJECTED — normalization regression, missing font controls

**Status: OPEN. Root cause not confirmed. This entry exists to prevent re-litigating
what's already been checked and cleared.**

**Symptom reported:** normalization "completely regressed" in §16; font size and
font colour missing from per-thread config (the latter confirmed, see below).

**§16 rolled back.** `duck.html` restored to commit `4cd50ed6e6` (the §7 baseline,
pre-multi-thread-config). Link reconfirmed byte-identical to that commit.

**What I checked and found CORRECT in §16's code** (harness, not live device):
- Same-language-room translation through `normalizeOutgoing` — fires correctly.
- Code-switch normalization through the **actual config-save flow** (not direct
  field pokes): English typed in a Chinese-set room correctly triggers `en→zh`
  normalization, then `zh→en` translation for the other side.
- Dual-socket arbitration's room/language capture — reads `sideAsRoom(side)`
  fresh at `connect()` time, same pattern as the accepted §7 baseline, no
  staleness.
- The `debugLog`/`log()` engine wiring that caused the G5/CRITICAL regression —
  intact, GATE 2 byte-verified, zero leftover `CFG.southLang`/`CFG.northLang`
  references anywhere in the file.

**What I could NOT check, stated plainly:** a real Deepgram socket, a real
fastText model load over HTTPS, and real mic input. None exist in this
container. Every synthetic reproduction attempted came back clean, which either
means the regression needs one of those three real conditions to surface, or it
needs a reproduction path I haven't tried yet. Both are open until confirmed
against the restored baseline.

**Font size/colour — this part IS confirmed, not speculative.** §7's modal had
font-size and font-colour controls; §16's redesign carried bubble *background*
colour onto the per-thread record but dropped font-size and font-colour
entirely. Plain omission during the rebuild, not a regression of working code —
straightforward to restore once §16 is rebuilt.

**Next action:** retest against the restored §7 baseline. If normalization is
confirmed working there, the next attempt at §16 must diff against §16's
*exact* commit rather than being rebuilt from scratch, so any regression is
isolated to a specific, reviewable change instead of re-deriving the whole
surface again.

---

## G13 · Second rollback — normalization/translation "hammered" even at §7 baseline

**Status: OPEN.**

User rejected the §7 baseline itself (`4cd50ed6e6`), not just §16 — reporting
translation and normalization broken there too. Rolled back one commit further,
to `f1cae14139`: the state immediately after the bridge-core rebuild + G10
dual-socket fix, before §7 conversation persistence touched the file at all.

**Not yet root-caused.** G12's harness checks (same-language translation,
code-switch normalization through the real save flow, dual-socket language
capture) all passed against §16's code — but that clean result is now suspect
given the baseline underneath it is also being rejected. Two live hypotheses,
neither confirmed:

1. The regression predates §7/§16 entirely and has been present since the
   bridge-core rebuild or the G10 patch — meaning my synthetic harness has a
   blind spot that covers all of it, not just the multi-thread config layer.
2. Something about live-device conditions (real Deepgram latency, real
   fastText load timing, real network) diverges from every harness result
   collected so far, which have all been clean end-to-end.

**Next action:** confirm/deny translation and normalization against `f1cae14139`
on a real device before any further code changes. No further building until this
is confirmed, per direct instruction.

---

## Turn 24 · Mic visual state (REJECTED × 2, rolled back to Turn 23·pre-ship)

### What was attempted
SVG mic button with animated ring countdown (blue→red), AnalyserNode level indicator,
and long-press latch mode.

### Root cause of failure

**The AnalyserNode is only created inside `ws.onopen`** — deep in an async chain
that starts a WebSocket to Deepgram, awaits browser mic permission, opens the audio
context, and then builds the graph. `paintActive` (which starts the level loop) is
called synchronously by `acquire`, typically 300–800ms before `ws.onopen` fires on a
real device. So `micState[side].analyser` is always `null` when `startLevelLoop` is
called from `paintActive`, and the function returns immediately — no RAF loop ever
starts, no level indicator, no silence detection, no countdown.

The second attempt added `s.silenceSince=null` inside `startLevelLoop` to fix the
immediate-countdown bug, but `startLevelLoop` was still being called from `paintMic`
(which has no analyser yet), not from inside `ws.onopen` where the analyser actually
exists. The fix corrected the wrong call site.

**In testing, `getUserMedia` resolves instantly** (the test stub returns a
resolved Promise synchronously), so the analyser is available before the first RAF
tick and all assertions pass. On a real device there is a 300–800ms permission +
socket-setup delay, so the analyser is never ready in time.

### Why the test harness missed it
The drive harness stubs `getUserMedia` to resolve immediately with a mock stream
that has no real `AudioContext`, so no analyser is ever created even in the test —
but the test only checks SVG ring opacity (set synchronously by `paintActive`),
not whether the level loop actually started. The gap between "ring is visible"
and "level loop is running" was never asserted.

### Correct fix (not yet built)
Invert the dependency: pass a callback into `createMicPipeline` that fires once
the audio graph is live, and start the level loop from there — not from `paintActive`.
`paintActive` sets the ring immediately (synchronous, correct). The level indicator
and silence detection start only when the AnalyserNode actually exists, wired from
inside `ws.onopen` after `P.analyser` is assigned.

The test harness must also be extended to assert that the level callback fires and
the RAF loop actually runs, not just that the ring element has opacity:1.


---

## Turn 24·attempt 4 (second simplified attempt — REJECTED)

### What was attempted
Bridge's mic glyph (SVG path + stand line) + CSS `.active`/`.pending` classes for
muted/unmuted. No level indicator, no countdown.

### Why rejected
Still not what bridge25 does. Bridge25 has a `mic-fill` rect inside the SVG glyph
that animates upward with audio level (the actual sound indicator), plus a `mic-slash`
diagonal line that appears when muted. The `.off` class controls both: slash visible +
fill hidden = muted; slash hidden + fill animating = active. The previous attempt used
a completely different pattern (`.active` class swapping disc colour) that doesn't
match bridge25's visual at all — it looked like a coloured circle, not the level-filled
mic glyph bridge users are familiar with.

### Correct fix (now in plan and being built)
Port bridge25's exact SVG markup (including `mic-fill` rect with `clip-path` and
`mic-slash` line), exact CSS (`.meter-btn`, `.meter-btn.off`, `.mic-fill`, `.mic-slash`
display rules), and exact `MicMeter` object (AnalyserNode, log-scale RMS, fast-attack
release, fill height animation). No new logic invented. Pure extraction.


---

## Sep 17 · input engine (R1/R2/R3) — REVERTED, cause of STT regression UNKNOWN

### What was attempted
A unified input engine in chat.html: spatial tap model (each touch scored as a
Gaussian distribution over nearby keys rather than resolving to one letter), a
bigram language model built from 305k lines of movie dialogue, next-word
prediction, auto-correct on space, an audio keypress click, and swipe re-scored
through the same ranker. Commits 3660b256, 5a409db6, dc5a95be, 58c4a241, 9a229f3c.

### Why reverted
STT stopped working during the session. Reverted chat.html to 78e582a3, the last
build with confirmed working STT. Owner's call, and the right one: a working app
beats an unshipped engine.

### Cause: NOT FOUND

This is the important entry. **The cause was never identified.** What is proven:

- `git diff 78e582a3 dc5a95be -- chat.html` touches NO line between 700 and 1010.
  The Deepgram socket setup, getUserMedia call, MicMeter, and audio pump are
  BYTE-IDENTICAL between the working build and the build reported broken.
- A Playwright trace of the mic path on both builds (fake media device, fake key)
  produced identical results: 1 getUserMedia call, same two Deepgram socket URLs,
  same INPUT state, same close behaviour.

Two causes were asserted and shipped as fixes. **Both were later disproven:**

1. **"The keypress click's AudioContext blocked Deepgram's 16kHz context."**
   Tested directly: creating a default-rate (44100) AudioContext and then
   `new AudioContext({sampleRate:16000})` — both succeed and run. Disproven.
2. **"The 1.78MB bigram in localStorage hit quota and broke unrelated writes."**
   Tested directly: ceiling measured at ~9MB; with storage full, small writes
   still succeed and reads still work. Disproven.

Not ruled out, and untestable from the build container:
- Android Chrome may differ from desktop Chromium on both mechanisms above.
- The fix in 58c4a241 may never have been tested: it was pushed at 20:40 and
  reported still broken at 20:41, inside GitHub Pages' 1–3 minute rebuild window.
- Deepgram account/key state could have changed independently of any code.

### Process failures that made this expensive

1. **Validated the wrong metric and called it a pass.** The harness checked whether
   the intended word appeared ANYWHERE in five candidates (7/7 "pass"). What
   matters is whether it is FIRST. Measured properly: 17% at zero letters, 43%
   after one, 80% after three. Tapping slot 1 early is a coin flip, which in the
   field turned "what time will you arrive" into "weary tilt whom your assurance".
2. **Proved the algorithm, reported it as proving the delivery.** Headless Chromium
   at 412x915 is not the target device and never was.
3. **Asserted a root cause twice without reproducing the failure**, and shipped a
   "fix" against each. Neither survived a direct test that took minutes to write.
4. **Handed the owner a file to paste** when the push route failed. Owner does not
   handle code; that is not a delivery.

### Rules for re-approach
- STT is a release gate. Any change to chat.html is verified against a live STT
  round trip on the real device BEFORE the next change is written.
- One mechanism per release. The reverted work bundled spatial model, language
  model, click audio, and swipe rescoring into one commit; when something broke
  there was no way to bisect it on-device.
- No cause is stated as fact until it has been reproduced. "I don't know yet" is
  the correct report when nothing has been reproduced.
- Accuracy claims name the metric and the device. Top-1 on a phone, or it does
  not count.
