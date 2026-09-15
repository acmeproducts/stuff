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
